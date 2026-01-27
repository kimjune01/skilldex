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
allowed-tools:
  - Bash
  - Read
---

# Cold Leads Revival

You help users identify leads that have gone cold, draft follow-up emails, and track their outreach.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Gmail and Google Sheets connected via Skillomatic dashboard

## Expected Sheet Structure

Users typically track leads in Sheets with columns like:
- Name, Email, Company
- Status (new, contacted, proposal, closed, lost)
- Last Contact Date
- Notes
- Source

## Workflow

When the user asks about cold leads:

1. **Query lead sheet** for leads not marked as closed/won
2. **Check Gmail** for last contact with each lead
3. **Identify cold leads** - no contact in 2+ weeks
4. **Draft personalized follow-ups** based on last interaction
5. **Update the sheet** after sending

## API Endpoints

### Read Leads from Sheets
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/read?spreadsheetId=...&range=Leads!A:G"
```

### Search Gmail for Last Contact
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "to:lead@example.com OR from:lead@example.com", "maxResults": 1}'
```

### Update Lead Status in Sheets
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Leads!D5",
    "values": [["Followed up 1/26"]]
  }'
```

### Create Email Draft
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/draft" \
  -d '{
    "to": "lead@example.com",
    "subject": "Quick follow-up",
    "body": "Hi [Name],\n\nI wanted to check in...",
    "bodyType": "text"
  }'
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

**3. Lisa K. (StartupCo)** - Initial outreach
- Last email: Your intro email, no response
- Approach: Brief value-focused bump

---

**Actions:**
- "Draft follow-ups for all 3"
- "Draft email for Sarah only"
- "Mark John as lost" (updates your sheet)
```

## After Sending Follow-ups

When user sends or drafts follow-ups:

1. Update the Last Contact date in their sheet
2. Optionally add a note about the outreach
3. Confirm the updates

```markdown
## Outreach Logged

Updated your leads sheet:

| Lead | Status Updated | Notes Added |
|------|----------------|-------------|
| Sarah M. | Last Contact: Jan 26 | "Follow-up #2 sent" |
| John D. | Last Contact: Jan 26 | "Reschedule email sent" |
| Lisa K. | Last Contact: Jan 26 | "Bump email sent" |

I'll remind you to check on these in a week if you want.
```

## Follow-up Email Templates

### After Proposal (No Response)
```
Subject: Following up on the proposal

Hi [Name],

I wanted to check in on the proposal I sent over a few weeks ago.

I know things get busy - happy to hop on a quick call if you have questions or want to talk through anything.

Let me know what works.

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

### Initial Outreach Follow-up
```
Subject: Quick follow-up

Hi [Name],

I reached out a couple weeks ago about [topic]. Wanted to bump this in case it got buried.

If now isn't the right time, no problem - just let me know.

Best,
[Sender]
```

## Marking Leads as Lost

When user says "mark [lead] as lost":

1. Update status to "Lost" in sheet
2. Optionally ask for reason
3. Confirm the update

```markdown
## Lead Updated

**John D. (Tech Inc)** marked as Lost.

Reason logged: "No response after 3 follow-ups"

They're out of your active pipeline now.
```

## Elicitation

Ask the user:
1. **Timeframe**: "How many days of no contact counts as 'cold'?" (default: 14 days)
2. **Sheet location**: "Which sheet has your leads?" (remember for next time)
3. **Approach**: "Prefer gentle check-ins or more direct?"
