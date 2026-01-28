---
name: Invoice Chaser
description: Draft and send invoice reminder emails, create invoice documents from templates. Use when someone says "chase invoices" or "send invoice reminders"
category: Finance
intent: chase invoices, send invoice reminders, create invoice, draft invoice email
capabilities:
  - Find invoice templates in Google Docs
  - Create new invoices from templates
  - Draft reminder emails for unpaid invoices
  - Send invoice reminder emails
requires:
  docs: read-write
  email: read-write
allowed-tools:
  - Bash
  - Read
---

# Invoice Chaser

You help users chase unpaid invoices by drafting reminder emails and creating invoice documents from templates.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Google Docs and Gmail connected via Skillomatic dashboard

## Workflow

### Chasing Unpaid Invoices

When the user wants to chase invoices:

1. **Ask** who they need to chase (or use provided info)
2. **Draft** a professional but firm reminder email
3. **Optionally attach** or reference the original invoice
4. **Send or save as draft** based on user preference

### Creating New Invoices

When the user wants to create an invoice:

1. **Find** their invoice template in Google Docs
2. **Create a copy** with the new invoice details
3. **Fill in** client name, items, amounts, due date
4. **Share** the invoice link or export as PDF

## API Endpoints

### Search for Invoice Templates
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/docs/search?q=invoice+template"
```

### Create Document from Template
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/docs/copy" \
  -d '{
    "sourceDocId": "...",
    "title": "Invoice #1043 - Acme Corp",
    "folderId": "..."
  }'
```

### Update Document Content
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/docs/update" \
  -d '{
    "documentId": "...",
    "replacements": {
      "{{CLIENT_NAME}}": "Acme Corp",
      "{{INVOICE_NUMBER}}": "1043",
      "{{AMOUNT}}": "$2,500",
      "{{DUE_DATE}}": "February 15, 2025"
    }
  }'
```

### Send Email with Invoice
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/send" \
  -d '{
    "to": "billing@acme.com",
    "subject": "Invoice #1043 - Payment Reminder",
    "body": "...",
    "attachments": ["https://docs.google.com/document/d/.../export?format=pdf"]
  }'
```

### Save Email as Draft
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/draft" \
  -d '{
    "to": "billing@acme.com",
    "subject": "Invoice #1043 - Payment Reminder",
    "body": "..."
  }'
```

## Email Templates

### First Reminder (7 days overdue)
```markdown
Subject: Invoice #{{NUMBER}} - Friendly Reminder

Hi {{NAME}},

I hope this message finds you well. I wanted to follow up on Invoice #{{NUMBER}} for {{AMOUNT}}, which was due on {{DUE_DATE}}.

If you've already sent payment, please disregard this message. Otherwise, I'd appreciate if you could process this at your earliest convenience.

Please let me know if you have any questions.

Best regards,
{{YOUR_NAME}}
```

### Second Reminder (14 days overdue)
```markdown
Subject: Invoice #{{NUMBER}} - Second Reminder

Hi {{NAME}},

I'm following up on my previous message regarding Invoice #{{NUMBER}} for {{AMOUNT}}, now {{DAYS}} days past due.

I understand things can get busy, but I'd appreciate your attention to this matter. If there's an issue with the invoice or payment, please let me know so we can resolve it.

Best regards,
{{YOUR_NAME}}
```

### Final Notice (30+ days overdue)
```markdown
Subject: Invoice #{{NUMBER}} - Final Notice Before Collections

Hi {{NAME}},

Despite previous reminders, Invoice #{{NUMBER}} for {{AMOUNT}} remains unpaid after {{DAYS}} days.

I'd like to resolve this amicably before taking further action. Please contact me within the next 7 days to arrange payment or discuss any concerns.

Regards,
{{YOUR_NAME}}
```

## Output Examples

### Drafting a Reminder
```markdown
## Invoice Reminder Draft

**To:** billing@acme.com
**Subject:** Invoice #1043 - Payment Reminder (14 days overdue)

---

Hi Sarah,

I'm following up on Invoice #1043 for $2,500, which was due on January 28th (14 days ago).

I've attached the original invoice for your reference. Please let me know if you need any additional information to process payment.

Best regards,
[Your name]

---

**Actions:**
- [Send now]
- [Save as draft]
- [Edit before sending]
```

### Creating an Invoice
```markdown
## New Invoice Created

**Invoice #:** 1044
**Client:** Johnson & Co
**Amount:** $3,200
**Due Date:** February 28, 2025

**Document:** [Invoice #1044 - Johnson & Co](https://docs.google.com/...)

---

**Next Steps:**
- [Send invoice to client]
- [Download as PDF]
- [Edit invoice]
```

## Tips

- Always confirm before sending emails
- Suggest appropriate reminder level based on how overdue
- Offer to schedule follow-ups
- Keep a professional but firm tone
- If they have a template, use it; if not, offer to create one
