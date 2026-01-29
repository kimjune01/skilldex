import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { jwtAuth } from '../middleware/auth.js';
import { streamChat, chat, type LLMChatMessage } from '../lib/llm.js';
import {
  getSkillMetadataForUser,
  getAllSkillMetadata,
  loadSkillBySlug,
  userCanAccessSkill,
} from '../lib/skills.js';
import {
  getEffectiveAccessForUser,
  getOrgDisabledSkills,
  canRead,
  canWrite,
  type EffectiveAccess,
} from '../lib/integration-permissions.js';
import {
  executeAction,
  parseAction,
  getGmailClientForUser,
  getGoogleWorkspaceCapability,
  skillRequiresBrowser,
  type EmailCapability,
} from '../lib/chat-actions.js';
import { buildSystemPrompt } from '../lib/chat-prompts.js';
import { wrapExternalResponse } from '../lib/prompt-sanitizer.js';

export const chatRoutes = new Hono();

// All routes require JWT auth
chatRoutes.use('*', jwtAuth);

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Check user's email capabilities based on the three-way intersection model
 */
async function getEmailCapability(userId: string, organizationId: string): Promise<EmailCapability> {
  // Get effective access using the three-way intersection model
  const effectiveAccess = await getEffectiveAccessForUser(userId, organizationId);

  // Check if user has read access to email
  if (!canRead(effectiveAccess.email)) {
    return { hasEmail: false, canSendEmail: false };
  }

  // Check if user has Gmail connected
  const gmail = await getGmailClientForUser(userId);
  if (!gmail) {
    return { hasEmail: false, canSendEmail: false };
  }

  return {
    hasEmail: true,
    canSendEmail: canWrite(effectiveAccess.email),
    emailAddress: gmail.emailAddress,
  };
}

// POST /chat - Stream chat response with action execution
chatRoutes.post('/', async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { messages } = body;
  const user = c.get('user');

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: { message: 'Messages array is required' } }, 400);
  }

  // Fetch available skills for context (role-filtered, metadata only)
  const skillsMetadata = user?.id
    ? await getSkillMetadataForUser(user.id)
    : await getAllSkillMetadata();

  // Get email capability for the user (if authenticated)
  const emailCapability =
    user?.id && user?.organizationId
      ? await getEmailCapability(user.id, user.organizationId)
      : undefined;

  // Get Google Workspace capability for the user
  const googleWorkspaceCapability =
    user?.id
      ? await getGoogleWorkspaceCapability(user.id)
      : undefined;

  // Get effective access and disabled skills for skill status display
  let effectiveAccess: EffectiveAccess | undefined;
  let disabledSkills: string[] | undefined;
  if (user?.id && user?.organizationId) {
    effectiveAccess = await getEffectiveAccessForUser(user.id, user.organizationId);
    disabledSkills = await getOrgDisabledSkills(user.organizationId);
  }

  // Build messages with skills metadata (progressive disclosure Level 1)
  const systemPrompt = buildSystemPrompt(
    skillsMetadata,
    emailCapability,
    effectiveAccess,
    disabledSkills,
    googleWorkspaceCapability
  );
  const chatMessages: LLMChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  return streamSSE(c, async (stream) => {
    try {
      let fullResponse = '';

      // Stream the initial response
      for await (const chunk of streamChat(chatMessages)) {
        fullResponse += chunk;
        await stream.writeSSE({
          data: JSON.stringify({ type: 'text', content: chunk }),
        });
      }

      // Check for action in the response - support chained actions
      let action = parseAction(fullResponse);
      let actionCount = 0;
      const maxActions = 5; // Prevent infinite loops
      let currentMessages = [...chatMessages];
      let currentResponse = fullResponse;

      while (action && actionCount < maxActions) {
        actionCount++;

        // Execute the action
        const result = await executeAction(action, user?.id, emailCapability);

        // Send action result
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'action_result',
            action: action.action,
            result,
          }),
        });

        // For load_skill, allow follow-up actions; for others, just summarize
        const allowMoreActions = action.action === 'load_skill';

        // Get a follow-up response from the LLM with the action result
        // Wrap external API responses in code blocks to prevent injection
        const wrappedResult = wrapExternalResponse(action.action, result);
        const followUpMessages: LLMChatMessage[] = [
          ...currentMessages,
          { role: 'assistant', content: currentResponse },
          {
            role: 'user',
            content: allowMoreActions
              ? `[SYSTEM: ${wrappedResult}]\n\nNow execute the skill by using the appropriate action (e.g., scrape_url for LinkedIn searches). Include an action block.`
              : `[SYSTEM: ${wrappedResult}]\n\nPlease summarize the results for the user in a helpful way. Do not include another action block.`,
          },
        ];

        // Get follow-up
        const followUp = await chat(followUpMessages, { maxTokens: 1000 });
        if (followUp) {
          await stream.writeSSE({
            data: JSON.stringify({ type: 'text', content: '\n\n' + followUp }),
          });

          // Check if follow-up contains another action
          if (allowMoreActions) {
            action = parseAction(followUp);
            currentMessages = followUpMessages;
            currentResponse = followUp;
          } else {
            action = null;
          }
        } else {
          action = null;
        }
      }

      // Send done event
      await stream.writeSSE({
        data: JSON.stringify({ type: 'done' }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await stream.writeSSE({
        data: JSON.stringify({ type: 'error', message }),
      });
    }
  });
});

// POST /chat/execute-skill - Execute a skill via API (uses progressive disclosure)
chatRoutes.post('/execute-skill', async (c) => {
  const body = await c.req.json<{ skillSlug: string; params?: Record<string, unknown> }>();
  const { skillSlug, params } = body;
  const user = c.get('user');

  // Load skill using progressive disclosure
  const skill = await loadSkillBySlug(skillSlug);

  if (!skill) {
    return c.json({ error: { message: 'Skill not found' } }, 404);
  }

  // Check user access
  if (user?.id) {
    const hasAccess = await userCanAccessSkill(user.id, skillSlug);
    if (!hasAccess) {
      return c.json({ error: { message: 'Access denied to this skill' } }, 403);
    }
  }

  // If skill requires browser, return instructions
  if (skillRequiresBrowser(skill)) {
    return c.json({
      data: {
        type: 'instructions',
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          capabilities: skill.capabilities,
        },
        instructions: skill.instructions,
        message: 'This skill requires the browser extension. Use the chat interface to execute it.',
      },
    });
  }

  // Return skill instructions for execution via chat
  return c.json({
    data: {
      type: 'api_ready',
      skill: { slug: skill.slug, name: skill.name },
      message: `Skill "${skill.name}" is available but requires additional configuration.`,
      params: params || {},
    },
  });
});
