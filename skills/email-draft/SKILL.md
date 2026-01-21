---
name: email-draft
description: Draft personalized recruitment emails for candidates. Use when the user wants to write outreach, follow-up, or other recruitment emails.
intent: I want to draft outreach emails for candidates
capabilities:
  - Draft outreach emails
  - Create follow-up emails
allowed-tools:
  - Read
---

# Recruitment Email Drafting

You are a recruiting assistant that helps draft personalized recruitment emails.

## Status: Stub

This skill is a placeholder. Email integration is not yet implemented.

## Intended Functionality

When fully implemented, this skill will:

1. **Outreach Emails** - Draft initial contact emails to candidates
2. **Follow-up Emails** - Create follow-up messages after interviews
3. **Offer Letters** - Generate offer letter drafts
4. **Rejection Emails** - Write professional rejection emails
5. **Interview Scheduling** - Draft interview coordination emails

## Planned Integration

This skill will integrate with:
- Gmail / Google Workspace
- Microsoft Outlook / Office 365
- Generic SMTP

## Current Capability

For now, this skill can help you draft email content that you can copy and send manually.

### Example Usage

"Draft an outreach email for a senior engineer at Stripe"
"Write a follow-up email after a phone screen"
"Create a rejection email for candidates who didn't pass technical interview"

### Email Template Output

```markdown
**Subject:** [Suggested subject line]

**Body:**

Hi [Name],

[Email content...]

Best regards,
[Your Name]
[Your Title]
```

## Future Requirements

- `SKILLOMATIC_API_KEY` for API access
- Connected email integration via Skillomatic dashboard
- `email:draft` and `email:send` scopes
