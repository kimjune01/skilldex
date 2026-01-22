/**
 * Email service for transactional emails via AWS SES
 *
 * Inspired by Stack Auth's template-based approach:
 * - Template-based emails with variable substitution
 * - Server-side only sending
 * - Transactional emails (can't be opted out)
 */
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Resource } from 'sst';

const ses = new SESv2Client({});

// Email templates with HTML and subject
const templates = {
  team_invitation: {
    subject: "You've been invited to join {{organizationName}} on Skillomatic",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">You're invited!</h2>
      <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.5;">
        <strong>{{inviterName}}</strong> has invited you to join <strong>{{organizationName}}</strong> as a {{role}}.
      </p>
      <a href="{{inviteUrl}}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Accept Invitation
      </a>
      <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">
        This invite expires in 7 days.
      </p>
    </div>
    <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
      Skillomatic
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  welcome: {
    subject: 'Welcome to Skillomatic!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Welcome, {{userName}}!</h2>
      <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.5;">
        Your account with <strong>{{organizationName}}</strong> is ready.
      </p>
      <a href="{{webUrl}}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Get Started
      </a>
    </div>
    <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
      Skillomatic
    </p>
  </div>
</body>
</html>
    `.trim(),
  },

  email_verification: {
    subject: 'Verify your email address',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 24px; color: #18181b; font-size: 24px;">Verify your email</h2>
      <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.5;">
        Click below to verify your email address:
      </p>
      <a href="{{verifyUrl}}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Verify Email
      </a>
      <p style="margin: 24px 0 0; color: #71717a; font-size: 14px;">
        This link expires in 24 hours.
      </p>
    </div>
    <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
      Skillomatic
    </p>
  </div>
</body>
</html>
    `.trim(),
  },
} as const;

type TemplateId = keyof typeof templates;
type TemplateVariables = { [key: string]: string };

/**
 * Interpolate variables into a template string
 * Replaces {{variableName}} with the corresponding value
 */
function interpolate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
}

/**
 * Get the sender email address
 * In production, uses the SES-verified domain from SST
 * In development, returns a placeholder (emails won't actually send)
 */
function getSenderEmail(): string {
  try {
    // @ts-expect-error - Resource.Email is defined by SST at runtime
    return `Skillomatic <noreply@${Resource.Email.sender}>`;
  } catch {
    // Development fallback
    return 'Skillomatic <noreply@skillomatic.technology>';
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
 * Send an email using a template
 *
 * @param params.to - Recipient email address
 * @param params.templateId - Template to use (team_invitation, welcome, email_verification)
 * @param params.variables - Variables to interpolate into the template
 */
export async function sendEmail(params: {
  to: string;
  templateId: TemplateId;
  variables: TemplateVariables;
}): Promise<{ success: boolean; error?: string }> {
  const template = templates[params.templateId];
  const subject = interpolate(template.subject, params.variables);
  const html = interpolate(template.html, params.variables);

  // Skip sending in development if SES not configured
  if (!isEmailEnabled()) {
    console.log(`[Email] Would send ${params.templateId} to ${params.to}`);
    console.log(`[Email] Subject: ${subject}`);
    return { success: true };
  }

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: getSenderEmail(),
        Destination: { ToAddresses: [params.to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } },
          },
        },
      })
    );
    console.log(`[Email] Sent ${params.templateId} to ${params.to}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Failed to send ${params.templateId} to ${params.to}:`, message);
    return { success: false, error: message };
  }
}

// Convenience functions with typed parameters

export interface InviteEmailParams {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}

export async function sendInviteEmail(to: string, params: InviteEmailParams) {
  return sendEmail({
    to,
    templateId: 'team_invitation',
    variables: {
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      inviteUrl: params.inviteUrl,
      role: params.role,
    },
  });
}

export interface WelcomeEmailParams {
  userName: string;
  organizationName: string;
  webUrl: string;
}

export async function sendWelcomeEmail(to: string, params: WelcomeEmailParams) {
  return sendEmail({
    to,
    templateId: 'welcome',
    variables: {
      userName: params.userName,
      organizationName: params.organizationName,
      webUrl: params.webUrl,
    },
  });
}

export interface VerificationEmailParams {
  verifyUrl: string;
}

export async function sendVerificationEmail(to: string, params: VerificationEmailParams) {
  return sendEmail({
    to,
    templateId: 'email_verification',
    variables: {
      verifyUrl: params.verifyUrl,
    },
  });
}
