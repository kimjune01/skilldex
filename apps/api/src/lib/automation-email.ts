/**
 * Email templates and delivery for automation results
 *
 * Follows the same pattern as email.ts but with automation-specific templates.
 * Uses AWS SES for delivery.
 */
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Resource } from 'sst';

const ses = new SESv2Client({});

/**
 * Get the sender email address
 */
function getSenderEmail(): string {
  try {
    // @ts-expect-error - Resource.Email is defined by SST at runtime
    return `Skillomatic Automations <noreply@${Resource.Email.sender}>`;
  } catch {
    return 'Skillomatic Automations <noreply@skillomatic.technology>';
  }
}

/**
 * Check if email sending is available (SES configured)
 */
function isEmailEnabled(): boolean {
  try {
    // @ts-expect-error - Resource.Email is defined by SST at runtime
    return !!Resource.Email?.sender;
  } catch {
    return false;
  }
}

/**
 * Escape HTML entities in text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert markdown-like formatting to basic HTML
 * Handles: **bold**, headers (#), bullet lists (-), code blocks (```)
 */
function formatOutputAsHtml(output: string): string {
  let html = escapeHtml(output);

  // Convert code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background: #e4e4e7; padding: 12px; border-radius: 4px; overflow-x: auto;">$1</pre>');

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background: #e4e4e7; padding: 2px 4px; border-radius: 2px;">$1</code>');

  // Convert bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert headers (##, ###)
  html = html.replace(/^### (.+)$/gm, '<h4 style="margin: 16px 0 8px; font-size: 14px;">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="margin: 16px 0 8px; font-size: 16px;">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 style="margin: 16px 0 8px; font-size: 18px;">$1</h2>');

  // Convert bullet lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul style="margin: 8px 0; padding-left: 20px;">$&</ul>');

  // Convert line breaks to <br> for remaining text
  html = html.replace(/\n/g, '<br>');

  return html;
}

export interface AutomationResultEmailParams {
  to: string;
  automationName: string;
  skillName: string;
  output: string;
  executedAt: Date;
}

/**
 * Send automation result email via SES
 *
 * @param params - Email parameters including recipient and automation output
 * @returns Success status and optional error message
 */
export async function sendAutomationResultEmail(
  params: AutomationResultEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { to, automationName, skillName, output, executedAt } = params;

  const subject = `[Skillomatic] ${automationName} - Results`;

  const formattedOutput = formatOutputAsHtml(output);
  const formattedDate = executedAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 8px; color: #18181b; font-size: 24px;">${escapeHtml(automationName)}</h2>
      <p style="margin: 0 0 24px; color: #71717a; font-size: 14px;">
        Skill: ${escapeHtml(skillName)} | Executed: ${formattedDate}
      </p>
      <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 20px; font-size: 14px; line-height: 1.6; color: #3f3f46;">
        ${formattedOutput}
      </div>
    </div>
    <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
      Powered by Skillomatic Automations
    </p>
  </div>
</body>
</html>
  `.trim();

  // Skip sending in development if SES not configured
  if (!isEmailEnabled()) {
    console.log(`[AutomationEmail] Would send automation result to ${to}`);
    console.log(`[AutomationEmail] Subject: ${subject}`);
    console.log(`[AutomationEmail] Output length: ${output.length} chars`);
    return { success: true };
  }

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: getSenderEmail(),
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } },
          },
        },
      })
    );
    console.log(`[AutomationEmail] Sent automation result to ${to}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AutomationEmail] Failed to send to ${to}:`, message);
    return { success: false, error: message };
  }
}

export interface AutomationFailureEmailParams {
  to: string;
  automationName: string;
  skillName: string;
  errorCode: string;
  errorMessage?: string;
  executedAt: Date;
  consecutiveFailures: number;
}

/**
 * Send automation failure notification email
 *
 * Sent when an automation fails after max retries.
 */
export async function sendAutomationFailureEmail(
  params: AutomationFailureEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { to, automationName, skillName, errorCode, errorMessage, executedAt, consecutiveFailures } = params;

  const subject = `[Skillomatic] ${automationName} - Failed`;

  const formattedDate = executedAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 8px; color: #dc2626; font-size: 24px;">Automation Failed</h2>
      <p style="margin: 0 0 24px; color: #71717a; font-size: 14px;">
        ${escapeHtml(automationName)} | ${formattedDate}
      </p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; font-size: 14px; line-height: 1.6; color: #991b1b;">
        <p style="margin: 0 0 12px;"><strong>Error Code:</strong> ${escapeHtml(errorCode)}</p>
        ${errorMessage ? `<p style="margin: 0 0 12px;"><strong>Details:</strong> ${escapeHtml(errorMessage)}</p>` : ''}
        <p style="margin: 0;"><strong>Skill:</strong> ${escapeHtml(skillName)}</p>
        <p style="margin: 8px 0 0;"><strong>Consecutive Failures:</strong> ${consecutiveFailures}</p>
      </div>
      <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">
        The automation will continue to run on schedule. Check your skill configuration if the issue persists.
      </p>
    </div>
    <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
      Powered by Skillomatic Automations
    </p>
  </div>
</body>
</html>
  `.trim();

  if (!isEmailEnabled()) {
    console.log(`[AutomationEmail] Would send failure notification to ${to}`);
    console.log(`[AutomationEmail] Subject: ${subject}`);
    return { success: true };
  }

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: getSenderEmail(),
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } },
          },
        },
      })
    );
    console.log(`[AutomationEmail] Sent failure notification to ${to}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AutomationEmail] Failed to send failure notification to ${to}:`, message);
    return { success: false, error: message };
  }
}
