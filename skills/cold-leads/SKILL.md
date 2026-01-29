---
name: Cold Leads
description: Find leads that went cold, draft follow-ups, and log your outreach. Use when someone asks to "revive cold leads" or "follow up with old prospects."
category: Outreach
intent: I want to follow up with cold leads, revive stale leads, re-engage prospects
capabilities:
  - Scan Google Sheets for inactive leads
  - Check Gmail for last contact date
  - Draft personalized follow-up emails
  - Update lead status after outreach
requires:
  email: read-write
  sheets: read-write
requiresInput: true
---

# Cold Leads Revival

You help users identify leads that have gone cold, draft follow-up emails, and track their outreach.

## Required Tools

- `search_emails` - Check last contact with each lead
- `draft_email` - Create follow-up drafts
- `google_workspace` (google-sheets) - Read leads and update status

## Workflow

When the user asks about cold leads:

1. **Query lead sheet** for leads not marked as closed/won
2. **Check Gmail** for last contact with each lead
3. **Identify cold leads** - no contact in 2+ weeks
4. **Draft personalized follow-ups** based on last interaction
5. **Update the sheet** after sending

## Tool Usage

### Read Leads from Sheets
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Leads!A:G"}}
```

### Search Gmail for Last Contact
```json
{"action": "search_emails", "query": "to:lead@example.com OR from:lead@example.com", "maxResults": 1}
```

### Update Lead Status in Sheets
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "write_range", "params": {"spreadsheetId": "...", "range": "Leads!D5", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["Followed up 1/26"]]}}
```

### Create Email Draft
```json
{"action": "draft_email", "to": "lead@example.com", "subject": "Quick follow-up", "body": "Hi [Name],\n\nI wanted to check in..."}
```

## Output Format

```markdown
## Cold Leads Found

**Leads with no contact in 14+ days:** 5

| Lead | Company | Last Contact | Days Silent | Stage |
|------|---------|--------------|-------------|-------|
| Sarah M. | Acme Corp | Jan 5 | 21 days | Proposal sent |
| John D. | Tech Inc | Jan 10 | 16 days | Demo scheduled |
| Lisa K. | StartupCo | Jan 12 | 14 days | Initial outreach |

---

### Recommended Follow-ups

**1. Sarah M. (Acme Corp)** - Proposal sent 3 weeks ago
- Last email: You sent proposal, no response
- Approach: Check if they have questions

**2. John D. (Tech Inc)** - Had demo scheduled
- Last email: Demo confirmation, then nothing
- Approach: May have been a no-show, ask to reschedule

---

**Actions:**
- "Draft follow-ups for all 3"
- "Draft email for Sarah only"
- "Mark John as lost"
```

## Follow-up Email Templates

### After Proposal (No Response)
```
Subject: Following up on the proposal

Hi [Name],

I wanted to check in on the proposal I sent over a few weeks ago.

I know things get busy - happy to hop on a quick call if you have questions.

Best,
[Sender]
```

### After Missed Meeting
```
Subject: Shall we reschedule?

Hi [Name],

I noticed we didn't connect for our scheduled call. No worries - calendars get hectic.

Would you like to find another time?

Best,
[Sender]
```

## Elicitation

Ask the user:
1. **Timeframe**: "How many days of no contact counts as 'cold'?" (default: 14 days)
2. **Sheet location**: "Which sheet has your leads?"
3. **Approach**: "Prefer gentle check-ins or more direct?"
