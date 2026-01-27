---
name: meeting-prep
description: Prepare for an upcoming meeting with full context - attendee info, email history, past notes, and suggested talking points. Use when someone asks "prep me for my 2pm" or "get ready for meeting with [person]."
intent: I want to prepare for a meeting, prep me for my call, get ready for meeting
capabilities:
  - Pull meeting details from calendar
  - Gather email history with attendees
  - Find past meeting notes
  - Suggest talking points and agenda
requires:
  calendar: read-only
  email: read-only
  airtable: read-only
allowed-tools:
  - Bash
  - Read
---

# Meeting Prep

You help users walk into every meeting fully prepared with context on attendees, history, and suggested talking points.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Google Calendar and Gmail connected via Skillomatic dashboard

## Workflow

When the user asks to prep for a meeting:

1. **Identify the meeting** - Time, title, or attendee name
2. **Pull meeting details** - Time, attendees, any description/agenda
3. **Get attendee context** - Email history, past interactions
4. **Find related notes** - Previous meeting notes if any
5. **Suggest talking points** - Based on recent communication

## API Endpoints

### Get Meeting Details
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/calendar/events?date=today"
```

### Search Email History
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "from:attendee@company.com OR to:attendee@company.com", "maxResults": 10}'
```

### Get Notes from Airtable
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/airtable/records?base=...&table=Notes&filter=client=Acme"
```

## Output Format

```markdown
## Meeting Prep: Client Call with Acme Corp

**Time:** Today, 2:00 PM (in 45 minutes)
**Duration:** 30 minutes
**Location:** Zoom (link in calendar)

---

### Attendees

**Sarah Johnson** - VP of Marketing, Acme Corp
- Primary contact for website project
- Last spoke: Jan 22 (email about Phase 2)
- Preference: Likes concise updates, decisions over discussion

**Mike Chen** - (new attendee)
- Title unknown - might want to ask about his role
- No prior email history

---

### Recent Context

**From your last emails:**
- Jan 22: Sarah asked about Phase 2 timeline - you haven't replied yet
- Jan 20: You sent invoice #1042 ($2,500, due Feb 1)
- Jan 15: Positive feedback on wireframes

**Project status:**
- Website redesign Phase 1: 60% complete
- Dev review milestone coming up Feb 5

---

### Open Items

1. **You owe them:** Response on Phase 2 timeline
2. **They owe you:** Payment on invoice #1042 (due Feb 1)
3. **Decision needed:** Scope for Phase 2

---

### Suggested Talking Points

1. **Project update** - Share Phase 1 progress (60% done, on track)
2. **Phase 2 discussion** - Address their timeline question
3. **Introduce Mike** - Ask about his role and involvement going forward
4. **Invoice reminder** - Gentle mention of upcoming due date if appropriate

---

### Questions to Ask

- "Mike, great to meet you - what's your role on this project?"
- "For Phase 2, are you thinking Q2 or sooner?"
- "Any concerns about the current timeline?"

---

### Quick Reference

- **Their company:** B2B SaaS, 50 employees, Series A
- **How they found you:** LinkedIn post in March 2024
- **Total revenue from them:** $10,000 to date

Good luck with the call!
```

## Finding the Right Meeting

If user says "prep me for my 2pm":
1. Look for meetings at 2:00 PM today
2. If multiple, ask: "Which one? [2pm - Acme call] or [2pm - Team sync]?"

If user says "prep me for meeting with Sarah":
1. Search today's calendar for meetings with Sarah
2. If none today, check this week
3. If found, proceed with prep

## Minimal Prep (Quick Mode)

For a fast brief:

```markdown
## Quick Prep: 2pm with Acme

**Attendees:** Sarah Johnson + Mike Chen (new)
**Context:** Phase 1 at 60%, they asked about Phase 2 timeline (you haven't replied)
**Watch for:** Invoice #1042 due Feb 1

**Top priority:** Answer their Phase 2 question in this call
```
