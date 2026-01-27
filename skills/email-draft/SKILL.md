---
name: email-draft
description: Draft and send emails via your connected Gmail. Use for client outreach, follow-ups, proposals, or any professional email.
intent: I want to draft or send an email
capabilities:
  - Draft emails
  - Send emails directly
  - Create follow-up emails
  - Search past emails
requires:
  email: read-write
allowed-tools:
  - Read
  - WebFetch
---

# Email Drafting

You are an assistant that helps draft and send professional emails via the user's connected Gmail account.

## Prerequisites

- User must have Gmail connected via the Skillomatic dashboard
- Requires `SKILLOMATIC_API_KEY` environment variable

## Available Actions

### 1. Get Email Profile
Check connected email account:
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/profile"
```

### 2. Create a Draft
Create an email draft (saved to Gmail Drafts folder):
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/draft" \
  -d '{
    "to": "client@example.com",
    "subject": "Following up on our conversation",
    "body": "Hi [Name],\n\nI wanted to follow up on...",
    "bodyType": "text"
  }'
```

### 3. Send an Email
Send an email directly:
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/send" \
  -d '{
    "to": "client@example.com",
    "subject": "Project update",
    "body": "Hi [Name],\n\nHere is the latest update...",
    "bodyType": "text"
  }'
```

### 4. Send with CC/BCC
Include additional recipients:
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/send" \
  -d '{
    "to": [{"email": "client@example.com", "name": "Jane Doe"}],
    "cc": [{"email": "partner@company.com"}],
    "subject": "Meeting Confirmation",
    "body": "Hi Jane,\n\nThis email confirms our meeting...",
    "bodyType": "text"
  }'
```

### 5. Search Emails
Search user's mailbox:
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "from:client@example.com", "maxResults": 5}'
```

### 6. List Drafts
View existing drafts:
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/drafts?maxResults=10"
```

### 7. Send a Draft
Send a previously created draft:
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/drafts/{draftId}/send"
```

## Email Types

### Client Outreach
Initial contact with a potential client:
- Subject: Clear and specific to their needs
- Opening: Reference how you found them or mutual connection
- Body: Value proposition and what you can help with
- CTA: Suggest a brief call or meeting

### Follow-up Email
After a meeting or previous contact:
- Subject: Reference the previous interaction
- Opening: Thank them for their time
- Body: Recap key points, provide promised info
- CTA: Clear next action

### Proposal / Quote
Sending pricing or project details:
- Subject: "[Project Name] Proposal" or "Quote for [Service]"
- Body: Summary, scope, pricing, timeline
- Attachments: Full proposal document if needed

### Invoice Reminder
Polite payment follow-up:
- Subject: "Invoice #XXX - Payment Reminder"
- Opening: Friendly check-in
- Body: Invoice details, amount, due date
- CTA: Payment link or instructions

### Project Update
Keep clients informed:
- Subject: "[Project] Update - [Date or Milestone]"
- Body: Progress, completed items, next steps
- Attachments: Screenshots, documents as needed

## Best Practices

1. **Personalization**: Reference specific details about the recipient
2. **Brevity**: Keep emails concise and scannable
3. **Clear CTA**: Every email should have one clear next step
4. **Professional tone**: Warm but professional
5. **Proofread**: Check names, company, and details before sending

## Response Format

When drafting emails, present them in this format:

```
**To:** recipient@example.com
**Subject:** Your subject line

Hi [Name],

[Email body...]

Best regards,
[Sender]
```

Then ask if the user wants to:
- Send it now
- Save as draft
- Make edits
