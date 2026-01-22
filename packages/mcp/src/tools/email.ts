/**
 * Email tools for the MCP server.
 * Only registered if the user has an email integration connected.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SkillomaticClient } from '../api-client.js';

// Schemas for tool inputs
const draftEmailSchema = {
  to: z.string().describe('Recipient email address'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body text'),
  cc: z.string().optional().describe('CC recipient email address'),
  bcc: z.string().optional().describe('BCC recipient email address'),
};

const sendEmailSchema = {
  to: z.string().describe('Recipient email address'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body text'),
  cc: z.string().optional().describe('CC recipient email address'),
  bcc: z.string().optional().describe('BCC recipient email address'),
};

const searchEmailsSchema = {
  query: z.string().describe('Gmail search query (e.g., "from:user@example.com", "subject:interview")'),
  maxResults: z.number().optional().default(10).describe('Maximum number of results (default: 10)'),
};

const listDraftsSchema = {
  maxResults: z.number().optional().default(10).describe('Maximum number of drafts to list (default: 10)'),
};

/**
 * Register email tools with the MCP server.
 * @param canSendEmail - Whether the user is allowed to send emails (controlled by capability profile)
 */
export function registerEmailTools(
  server: McpServer,
  client: SkillomaticClient,
  canSendEmail: boolean = true
): void {
  // Get email profile
  server.tool(
    'get_email_profile',
    'Get information about the connected email account',
    {},
    async () => {
      try {
        const profile = await client.getEmailProfile();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(profile, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error fetching email profile: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Search emails - always available if email is connected
  server.tool(
    'search_emails',
    'Search emails in the connected mailbox using Gmail search syntax',
    searchEmailsSchema,
    async (args) => {
      try {
        const result = await client.searchEmails(args.query, args.maxResults);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  emails: result.emails,
                  total: result.total,
                  query: args.query,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error searching emails: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // List drafts - always available if email is connected
  server.tool(
    'list_email_drafts',
    'List email drafts in the connected mailbox',
    listDraftsSchema,
    async (args) => {
      try {
        const result = await client.listDrafts(args.maxResults);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error listing drafts: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Draft and send email tools - only if canSendEmail is true
  if (canSendEmail) {
    // Create email draft
    server.tool(
      'draft_email',
      'Create an email draft (saved to Gmail Drafts folder)',
      draftEmailSchema,
      async (args) => {
        try {
          const result = await client.createDraft({
            to: args.to,
            subject: args.subject,
            body: args.body,
            cc: args.cc,
            bcc: args.bcc,
          });

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Draft created successfully. You can find it in your Gmail Drafts folder.`,
                    draftId: result.draftId,
                    messageId: result.messageId,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error creating draft: ${message}` }],
            isError: true,
          };
        }
      }
    );

    // Send email
    server.tool(
      'send_email',
      'Send an email directly. Use with caution - confirm with the user before sending.',
      sendEmailSchema,
      async (args) => {
        try {
          const result = await client.sendEmail({
            to: args.to,
            subject: args.subject,
            body: args.body,
            cc: args.cc,
            bcc: args.bcc,
          });

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Email sent successfully to ${args.to}.`,
                    messageId: result.messageId,
                    threadId: result.threadId,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Error sending email: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }
}
