---
name: Meeting Prep
description: Prepare for an upcoming meeting with full context - attendee info, email history, past notes, and suggested talking points. Use when someone asks "prep me for my 2pm" or "get ready for meeting with [person]."
category: Meetings
intent: I want to prepare for a meeting, prep me for my call, get ready for meeting
capabilities:
  - Gather email history with attendees
  - Find past meeting notes
  - Suggest talking points and agenda
requires:
  email: read-only
  sheets: read-only
requiresInput: true
---

# Meeting Prep

You help users walk into every meeting fully prepared with context on attendees, history, and suggested talking points.

## Required Tools

- `search_emails` - Get email history with attendees
- `google_workspace` (google-sheets) - Read notes and client data

## Workflow

When the user asks to prep for a meeting:

1. **Identify the meeting** - Time, title, or attendee name
2. **Get attendee context** - Email history, past interactions
3. **Find related notes** - Previous meeting notes if any
4. **Suggest talking points** - Based on recent communication

## Tool Usage

### Search Email History with Attendee
```json
{"action": "search_emails", "query": "from:attendee@company.com OR to:attendee@company.com", "maxResults": 10}
```

### Get Notes from Sheets
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Notes!A:E"}}
```

### Get Client Info from Sheets
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Clients!A:H"}}
```

## Output Format

```markdown
## Meeting Prep: Client Call with Acme Corp

**Time:** Today, 2:00 PM (in 45 minutes)
**Duration:** 30 minutes

---

### Attendees

**Sarah Johnson** - VP of Marketing, Acme Corp
- Primary contact for website project
- Last spoke: Jan 22 (email about Phase 2)
- Preference: Likes concise updates

**Mike Chen** - (new attendee)
- Title unknown - might want to ask about his role
- No prior email history

---

### Recent Context

**From your last emails:**
- Jan 22: Sarah asked about Phase 2 timeline - you haven't replied yet
- Jan 20: You sent invoice #1042 ($2,500, due Feb 1)
- Jan 15: Positive feedback on wireframes

---

### Open Items

1. **You owe them:** Response on Phase 2 timeline
2. **They owe you:** Payment on invoice #1042 (due Feb 1)
3. **Decision needed:** Scope for Phase 2

---

### Suggested Talking Points

1. **Project update** - Share Phase 1 progress (60% done, on track)
2. **Phase 2 discussion** - Address their timeline question
3. **Introduce Mike** - Ask about his role

---

### Questions to Ask

- "Mike, great to meet you - what's your role on this project?"
- "For Phase 2, are you thinking Q2 or sooner?"

Good luck with the call!
```

## Finding the Right Meeting

If user says "prep me for my 2pm":
1. Ask which meeting they mean
2. If they say "meeting with Sarah", search emails for Sarah

If user says "prep me for meeting with Sarah":
1. Search emails for recent communication with Sarah
2. Pull any client data from sheets

## Quick Mode

For a fast brief:

```markdown
## Quick Prep: 2pm with Acme

**Attendees:** Sarah Johnson + Mike Chen (new)
**Context:** Phase 1 at 60%, they asked about Phase 2 timeline (you haven't replied)
**Watch for:** Invoice #1042 due Feb 1

**Top priority:** Answer their Phase 2 question in this call
```
