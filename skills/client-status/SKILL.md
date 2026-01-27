---
name: Client Status
description: Get complete context on any client and add notes. Use when someone asks "what's the status with [client]?" or wants to log client info.
category: Clients
intent: I want to check on a client, client status, add client note, what's happening with this client
capabilities:
  - Pull recent email threads with client
  - Check invoice/payment status
  - Show notes from client sheet
  - Add new notes to client record
requires:
  email: read-only
  stripe: read-only
  sheets: read-write
allowed-tools:
  - Bash
  - Read
---

# Client Status

You help users get complete context on any client and keep their notes up to date.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Gmail, Stripe, and Sheets connected via Skillomatic dashboard

## Expected Sheet Structure

Users track clients in Sheets with columns like:
- Name, Email, Company
- Status (active, prospect, past)
- Notes, Last Contact
- Total Revenue, Source

## Workflow

When the user asks about a client:

1. **Identify the client** - Name, company, or email
2. **Pull email history** - Recent threads, last contact
3. **Check financials** - Open invoices, payment history
4. **Pull notes** - From client sheet
5. **Enable updates** - Add notes, update status

## API Endpoints

### Search Emails
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "from:client@company.com OR to:client@company.com", "maxResults": 10}'
```

### Get Stripe Customer
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/stripe/customers?email=client@company.com"
```

### Get Client from Sheets
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/read?spreadsheetId=...&range=Clients!A:H"
```

### Add Note to Client
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Clients!G5",
    "values": [["Previous notes\n\n1/26: Called to discuss Phase 2, interested in Feb start"]]
  }'
```

### Update Last Contact
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Clients!F5",
    "values": [["2025-01-26"]]
  }'
```

## Output Format

```markdown
## Client Status: Acme Corp

**Contact:** Sarah Johnson (sarah@acmecorp.com)
**Status:** Active client since March 2024
**Last Contact:** 3 days ago

---

### Recent Emails

| Date | Subject | Status |
|------|---------|--------|
| Jan 24 | Re: Q1 Planning | Awaiting their reply |
| Jan 20 | Invoice #1042 | Sent |
| Jan 15 | Project kickoff | - |

**Last from them:** Jan 22 - Asked about Phase 2 timeline

---

### Financials

| Invoice | Amount | Status |
|---------|--------|--------|
| #1042 | $2,500 | Due Feb 1 |
| #1038 | $3,000 | Paid Jan 10 |
| #1035 | $2,500 | Paid Dec 15 |

**Total paid:** $12,500 | **Currently owed:** $2,500

---

### Notes

> **Jan 15:** Kicked off website redesign. Sarah is main contact, reports to CEO.
>
> **Dec 10:** Signed contract after 2 proposals. Found us via LinkedIn.
>
> **Nov 28:** Initial call. Interested in full redesign, budget ~$15k.

---

### Action Items

1. Reply to Jan 22 email about Phase 2
2. Invoice #1042 due Feb 1

---

**Quick actions:**
- "Add note: Called today, discussed Phase 2"
- "Update status to past client"
```

## Adding Notes

When user says "add note: [content]":

1. Append to the notes field with today's date
2. Update last contact date
3. Confirm

```markdown
## Note Added

**Acme Corp** - Note saved:

> **Jan 26:** Called today, discussed Phase 2. They want to start in February, budget approved.

Last contact updated to today.
```

## Quick Mode (Before a Call)

```markdown
## Quick Brief: Acme Corp

**Contact:** Sarah Johnson
**Last contact:** 3 days ago - asked about Phase 2 (you haven't replied)
**Owed:** $2,500 (due Feb 1)
**Project:** Website redesign, 60% complete

**Before your call:**
- You owe them a reply on Phase 2 timing
- Good time to mention upcoming invoice
```

## Adding a New Client

When user says "add client: [name]":

1. Collect basic info (email, company, source)
2. Append to client sheet
3. Confirm

```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/append" \
  -d '{
    "spreadsheetId": "...",
    "range": "Clients!A:H",
    "values": [["Tech Inc", "john@techinc.com", "John Smith", "Prospect", "", "2025-01-26", "", "Referral from Acme"]]
  }'
```

```markdown
## Client Added

**Tech Inc** (John Smith)
- Email: john@techinc.com
- Status: Prospect
- Source: Referral from Acme

Added to your clients sheet.
```

## Elicitation

If the client name is ambiguous:
1. "Found a few matches - which one? [Sarah Johnson - Acme] [Sarah Miller - TechCo]"
2. If no match: "Couldn't find that client. Want me to add them?"
