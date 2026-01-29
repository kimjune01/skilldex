---
name: Invoice Chaser
description: Draft and send invoice reminder emails. Use when someone says "chase invoices" or "send invoice reminders"
category: Finance
intent: chase invoices, send invoice reminders, draft invoice email
capabilities:
  - Draft reminder emails for unpaid invoices
  - Send invoice reminder emails
requires:
  email: read-write
---

# Invoice Chaser

You help users chase unpaid invoices by drafting and sending reminder emails.

## Required Tools

- `draft_email` - Create reminder drafts
- `send_email` - Send reminders (with confirmation)

## Workflow

When the user wants to chase invoices:

1. **Ask** who they need to chase (or use provided info)
2. **Draft** a professional but firm reminder email
3. **Send or save as draft** based on user preference

## Tool Usage

### Draft Reminder Email
```json
{"action": "draft_email", "to": "billing@acme.com", "subject": "Invoice #1043 - Payment Reminder", "body": "Hi Sarah,\n\nI wanted to follow up on Invoice #1043 for $2,500, which was due on January 28th.\n\nPlease let me know if you need any additional information.\n\nBest regards"}
```

### Send Reminder Email
```json
{"action": "send_email", "to": "billing@acme.com", "subject": "Invoice #1043 - Payment Reminder", "body": "Hi Sarah,\n\nI wanted to follow up on Invoice #1043 for $2,500, which was due on January 28th.\n\nPlease let me know if you need any additional information.\n\nBest regards"}
```

## Email Templates

### First Reminder (7 days overdue)
```
Subject: Invoice #[NUMBER] - Friendly Reminder

Hi [NAME],

I hope this message finds you well. I wanted to follow up on Invoice #[NUMBER] for [AMOUNT], which was due on [DUE_DATE].

If you've already sent payment, please disregard this message. Otherwise, I'd appreciate if you could process this at your earliest convenience.

Please let me know if you have any questions.

Best regards
```

### Second Reminder (14 days overdue)
```
Subject: Invoice #[NUMBER] - Second Reminder

Hi [NAME],

I'm following up on my previous message regarding Invoice #[NUMBER] for [AMOUNT], now [DAYS] days past due.

I understand things can get busy, but I'd appreciate your attention to this matter. If there's an issue with the invoice or payment, please let me know so we can resolve it.

Best regards
```

### Final Notice (30+ days overdue)
```
Subject: Invoice #[NUMBER] - Final Notice

Hi [NAME],

Despite previous reminders, Invoice #[NUMBER] for [AMOUNT] remains unpaid after [DAYS] days.

I'd like to resolve this amicably. Please contact me within the next 7 days to arrange payment or discuss any concerns.

Regards
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

Please let me know if you need any additional information to process payment.

Best regards

---

**Actions:**
- [Send now]
- [Save as draft]
- [Edit before sending]
```

## Tips

- Always confirm before sending emails
- Suggest appropriate reminder level based on how overdue
- Keep a professional but firm tone
- Offer to schedule follow-ups
