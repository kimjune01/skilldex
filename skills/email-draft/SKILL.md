---
name: email-draft
description: Draft and send personalized recruitment emails for candidates. Use when the user wants to write outreach, follow-up, or other recruitment emails.
intent: I want to draft or send emails for candidates
capabilities:
  - Draft outreach emails
  - Send emails directly
  - Create follow-up emails
  - Search past emails
requires:
  email: read-write
allowed-tools:
  - Read
  - WebFetch
---

# Recruitment Email Drafting

You are a recruiting assistant that helps draft and send personalized recruitment emails via the user's connected Gmail account.

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
    "to": "candidate@example.com",
    "subject": "Exciting Opportunity at [Company]",
    "body": "Hi [Name],\n\nI came across your profile and was impressed by your background in...",
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
    "to": "candidate@example.com",
    "subject": "Following up on our conversation",
    "body": "Hi [Name],\n\nThank you for taking the time to speak with me...",
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
    "to": [{"email": "candidate@example.com", "name": "Jane Doe"}],
    "cc": [{"email": "hiring-manager@company.com"}],
    "subject": "Interview Confirmation",
    "body": "Hi Jane,\n\nThis email confirms your interview...",
    "bodyType": "text"
  }'
```

### 5. Search Emails
Search user's mailbox:
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "from:candidate@example.com", "maxResults": 5}'
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

### Outreach Email
Initial contact with a potential candidate:
- Subject: Keep it personalized and specific
- Opening: Reference something specific about their background
- Body: Explain the opportunity and why they're a fit
- CTA: Suggest a brief call or meeting

### Follow-up Email
After an interview or previous contact:
- Subject: Reference the previous interaction
- Opening: Thank them for their time
- Body: Provide any promised information or next steps
- CTA: Clear next action

### Interview Scheduling
Coordinate interview times:
- Subject: "Interview for [Role] at [Company]"
- Body: Proposed times, interview format, who they'll meet
- Include: Calendar link if available

### Rejection Email
Professional decline:
- Subject: "Update on your application at [Company]"
- Opening: Thank them for their interest and time
- Body: Brief, respectful decline
- Closing: Encourage future applications if appropriate

## Best Practices

1. **Personalization**: Always customize emails based on the candidate's background
2. **Brevity**: Keep emails concise and scannable
3. **Clear CTA**: Every email should have one clear next step
4. **Professional tone**: Warm but professional
5. **Proofread**: Check names, company, and role before sending

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
