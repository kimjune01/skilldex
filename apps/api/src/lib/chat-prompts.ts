import { buildSkillsPromptSection, type SkillMetadata } from './skills.js';
import type { EmailCapability, GoogleWorkspaceCapability } from './chat-actions.js';
import type { EffectiveAccess } from './integration-permissions.js';
import { sanitizeEmail } from './prompt-sanitizer.js';

/** Threshold for considering extension "active" - if polled within this time */
const EXTENSION_ACTIVE_THRESHOLD_MS = 15 * 1000; // 15 seconds

/**
 * Check if user's extension was recently active (polled within threshold)
 */
export function isExtensionActive(lastPollAt: Date | null): boolean {
  if (!lastPollAt) return false;
  const timeSinceLastPoll = Date.now() - lastPollAt.getTime();
  return timeSinceLastPoll < EXTENSION_ACTIVE_THRESHOLD_MS;
}

/**
 * Build the system prompt for the chat assistant
 */
export function buildSystemPrompt(
  skillsMetadata: SkillMetadata[],
  emailCapability?: EmailCapability,
  effectiveAccess?: EffectiveAccess,
  disabledSkills?: string[],
  googleWorkspaceCapability?: GoogleWorkspaceCapability,
  hasExtension?: boolean
): string {
  const skillsSection = buildSkillsPromptSection(skillsMetadata, effectiveAccess, disabledSkills);

  // Build email section if available
  let emailSection = '';
  if (emailCapability?.hasEmail) {
    const emailActions = emailCapability.canSendEmail
      ? '**draft_email**, **send_email**, **search_emails**'
      : '**search_emails**';
    emailSection = `
**Email** (${sanitizeEmail(emailCapability.emailAddress || '')}): ${emailActions}${emailCapability.canSendEmail ? ' - Always confirm before sending.' : ' (send disabled by admin)'}`;
  }

  // Build Google services summary
  const googleServices = buildGoogleServicesSummary(googleWorkspaceCapability);

  // Build other actions list - scrape_url only available with extension
  const otherActions = hasExtension
    ? 'web_search, scrape_url'
    : 'web_search';

  return `You are a helpful assistant. Match user requests to skills and tool calls.

${skillsSection}

Execute with \`\`\`action blocks: \`{"action": "load_skill", "slug": "..."}\`

Other actions: ${otherActions}${emailSection}${googleServices}`;
}

/**
 * Build a concise Google services summary
 */
function buildGoogleServicesSummary(capability?: GoogleWorkspaceCapability): string {
  if (!capability) return '';

  const services: string[] = [];
  if (capability.hasGoogleSheets) services.push('Sheets');
  if (capability.hasGoogleDrive) services.push('Drive');
  if (capability.hasGoogleDocs) services.push('Docs');
  if (capability.hasGoogleForms) services.push('Forms');
  if (capability.hasGoogleContacts) services.push('Contacts');
  if (capability.hasGoogleTasks) services.push('Tasks');

  if (services.length === 0) return '';

  return `
- **google_workspace** - Access Google ${services.join(', ')} via \`{"action": "google_workspace", "provider": "<service>", "operation": "<op>", "params": {...}}\``;
}
