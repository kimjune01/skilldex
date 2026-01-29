---
name: Client Status
description: Get complete context on any client and add notes. Use when someone asks "what's the status with [client]?" or wants to log client info.
category: Clients
intent: I want to check on a client, client status, add client note, what's happening with this client
capabilities:
  - Pull recent email threads with client
  - Show notes from client sheet
  - Add new notes to client record
requires:
  email: read-only
  sheets: read-write
requiresInput: true
---

# Client Status

You help users get complete context on any client and keep their notes up to date.

## Required Tools

- `search_emails` - Search email history with client
- `google_workspace` (google-sheets) - Read/write client data

## Workflow

When the user asks about a client:

1. **Identify the client** - Name, company, or email
2. **Pull email history** - Recent threads, last contact
3. **Pull notes** - From client sheet
4. **Enable updates** - Add notes, update status

## Tool Usage

### Search Emails with Client
```json
{"action": "search_emails", "query": "from:client@company.com OR to:client@company.com", "maxResults": 10}
```

### Read Client Data from Sheets
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Clients!A:H"}}
```

### Add Note to Client
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "write_range", "params": {"spreadsheetId": "...", "range": "Clients!G5", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["Previous notes\n\n1/26: Called to discuss Phase 2"]]}}
```

### Add New Client
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "append_rows", "params": {"spreadsheetId": "...", "range": "Clients!A:H", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["Tech Inc", "john@techinc.com", "John Smith", "Prospect", "", "2025-01-26", "", "Referral from Acme"]]}}
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

**Last from them:** Jan 22 - Asked about Phase 2 timeline

---

### Notes

> **Jan 15:** Kicked off website redesign. Sarah is main contact.
>
> **Dec 10:** Signed contract after 2 proposals.

---

**Quick actions:**
- "Add note: Called today, discussed Phase 2"
- "Update status to past client"
```

## Adding Notes

When user says "add note: [content]":

1. Read current notes from sheet
2. Prepend new note with today's date
3. Write back to sheet
4. Confirm

## Elicitation

If the client name is ambiguous:
1. "Found a few matches - which one? [Sarah Johnson - Acme] [Sarah Miller - TechCo]"
2. If no match: "Couldn't find that client. Want me to add them?"
