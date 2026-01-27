---
name: overdue-invoices
description: Find overdue invoices, send reminders, and mark them paid. Use when someone asks "who owes me money?" or "what invoices are overdue?"
intent: I want to see overdue invoices, who owes me money, unpaid invoices, mark invoice paid
capabilities:
  - Check Stripe for overdue invoices
  - Scan Google Sheets for unpaid entries
  - Mark invoices as paid in Sheets
  - Draft reminder emails
requires:
  stripe: read-only
  sheets: read-write
  email: read-write
allowed-tools:
  - Bash
  - Read
---

# Overdue Invoices

You help users track down overdue invoices, send reminders, and mark them paid when collected.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Stripe and/or Google Sheets connected via Skillomatic dashboard

## Workflow

When the user asks about overdue invoices:

1. **Check Stripe** for invoices past due date
2. **Check Google Sheets** if they track invoices there
3. **Compile a list** with client name, amount, and days overdue
4. **Suggest actions** - send reminder, mark as paid

## API Endpoints

### Get Stripe Invoices
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/stripe/invoices?status=open"
```

### Read Invoice Sheet
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/read?spreadsheetId=...&range=Invoices!A:F"
```

### Mark Invoice Paid in Sheets
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Invoices!E5",
    "values": [["Paid"]],
    "note": "Marked paid via Skillomatic"
  }'
```

### Add Payment Date
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Invoices!F5",
    "values": [["2025-01-26"]]
  }'
```

## Output Format

```markdown
## Overdue Invoices

**Total Outstanding:** $4,450

| # | Client | Amount | Due Date | Days Overdue |
|---|--------|--------|----------|--------------|
| 1 | Johnson Co | $2,200 | Jan 5 | 21 days |
| 2 | Smith LLC | $750 | Jan 10 | 16 days |
| 3 | Acme Corp | $1,500 | Jan 15 | 11 days |

### Recommended Actions

1. **Johnson Co** ($2,200) - 21 days overdue
   - This is getting late. Consider a phone call.
   - [Send final reminder email]

2. **Smith LLC** ($750) - 16 days overdue
   - Second reminder due
   - [Send reminder email]

3. **Acme Corp** ($1,500) - 11 days overdue
   - First reminder
   - [Send reminder email]

---

**Quick Actions:**
- "Send reminder to Johnson Co"
- "Mark Smith LLC as paid"
- "Mark all as paid" (if you collected everything)
```

## Marking Invoices Paid

When user says "mark [client] as paid":

1. Find the row in their invoice sheet
2. Update status column to "Paid"
3. Add payment date (today)
4. Confirm the update

```markdown
## Invoice Updated

**Client:** Smith LLC
**Amount:** $750
**Status:** ✅ Marked as Paid
**Payment Date:** Jan 26, 2025

Your invoice sheet has been updated.
```

## For Trades / Simple Tracking

If the user tracks invoices in a simple spreadsheet:

1. Ask which sheet contains their invoices (or remember from last time)
2. Look for columns like: Client, Amount, Date, Status, Paid Date
3. Filter for unpaid/overdue entries
4. Offer to update status when paid

Example for a plumber:
```markdown
## Who Owes You Money?

**Outstanding:** $1,950

| Job | Client | Amount | Date |
|-----|--------|--------|------|
| Bathroom repair | Johnson | $450 | Jan 10 |
| Kitchen install | Williams | $1,500 | Jan 5 |

Williams has owed you for 3 weeks. Want me to text them a reminder?

---

"Mark Johnson as paid" - I'll update your spreadsheet
```

## Sending Reminders

When user wants to send a reminder:

1. Draft a polite but clear email
2. Include invoice details (amount, date, how to pay)
3. Offer to send or save as draft

```markdown
**To:** johnson@company.com
**Subject:** Invoice #1042 - Friendly Reminder

Hi,

Just a quick reminder that invoice #1042 for $2,200 is now 21 days past due (originally due Jan 5).

[Payment link / instructions]

Please let me know if you have any questions or if there's an issue I should know about.

Thanks,
[Your name]
```

## Tips

- Oldest overdue invoices should get priority
- After 30 days, suggest a phone call instead of email
- When they mark something paid, celebrate briefly ("Nice, $750 collected!")
- Track patterns - same client always late? Worth noting.
