---
name: Morning Briefing
description: Get your day's overview - calendar, priority emails, tasks - and mark things done as you go. Use when someone asks "what's on my plate today?" or "prep my day."
category: Daily
intent: I want my morning briefing, what's on my plate, prep my day, daily overview
capabilities:
  - Pull today's calendar events
  - Surface priority emails needing response
  - Show pending tasks from Sheets
  - Mark tasks as complete
requires:
  calendar: read-only
  email: read-only
  sheets: read-write
allowed-tools:
  - Bash
  - Read
---

# Morning Briefing

You help users start their day with a complete overview and let them check things off as they go.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Google Calendar, Gmail, and Sheets connected

## Expected Sheet Structure

Users track tasks in Sheets with columns like:
- Task, Due Date, Status, Priority, Notes

## Workflow

When the user asks for their morning briefing:

1. **Pull calendar** - Today's meetings and events
2. **Check email** - Unread priority emails
3. **Check tasks** - Pending items from their task sheet
4. **Compile briefing** - Scannable format
5. **Enable quick actions** - Mark tasks done, snooze, etc.

## API Endpoints

### Get Today's Calendar
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/calendar/events?date=today"
```

### Get Priority Emails
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "is:unread is:important", "maxResults": 10}'
```

### Get Tasks from Sheets
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/read?spreadsheetId=...&range=Tasks!A:E"
```

### Mark Task Complete
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Tasks!C5",
    "values": [["Done"]]
  }'
```

## Output Format

```markdown
## Good Morning! Here's Your Day

**Today:** Monday, January 27, 2025

---

### Calendar (3 meetings)

| Time | Event | With |
|------|-------|------|
| 9:00 AM | Weekly sync | Team |
| 11:30 AM | Client call | Acme Corp |
| 2:00 PM | Project review | Sarah |

**Note:** Back-to-back from 11:30-3pm. Grab lunch early.

---

### Priority Emails (4 need attention)

1. **Acme Corp** - "Re: Contract questions" - Yesterday
2. **New lead** - "Interested in services" - 2 hours ago
3. **Vendor** - "Invoice attached" - $450 due next week

---

### Tasks (5 pending)

| # | Task | Due |
|---|------|-----|
| 1 | Send proposal to Tech Inc | Today |
| 2 | Follow up with cold leads | Today |
| 3 | Review contractor invoices | Tomorrow |
| 4 | Update project timeline | This week |
| 5 | Prep Thursday presentation | Thursday |

---

### Suggested Focus

1. **Before 9am:** Reply to Acme email (before your call)
2. **After sync:** Send Tech Inc proposal (due today)
3. **End of day:** Respond to new lead

---

**Quick actions:**
- "Mark task 1 done"
- "Snooze task 3 to Friday"
- "Add task: Call insurance company"
```

## Marking Tasks Complete

When user says "mark task 1 done" or "done with Tech Inc proposal":

1. Find the task in their sheet
2. Update status to "Done"
3. Optionally add completion date
4. Confirm with brief celebration

```markdown
## Task Complete ✓

**Send proposal to Tech Inc** - Done!

4 tasks remaining for today.
```

## Adding Tasks

When user says "add task: [description]":

1. Append to their task sheet
2. Ask for due date if not specified
3. Confirm addition

```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/append" \
  -d '{
    "spreadsheetId": "...",
    "range": "Tasks!A:E",
    "values": [["Call insurance company", "Jan 27", "Pending", "Medium", ""]]
  }'
```

```markdown
## Task Added

**Call insurance company** - Due today

Added to your task list.
```

## For Trades / Simpler Workflow

```markdown
## Your Day - Monday, Jan 27

### Jobs (3 today)

| Time | Job | Address | Client |
|------|-----|---------|--------|
| 8:00 AM | Bathroom repair | 123 Oak St | Johnson |
| 11:00 AM | Kitchen install | 456 Elm Ave | Williams |
| 3:00 PM | Estimate | 789 Pine Rd | New client |

**Addresses:**
- 123 Oak Street, Anytown
- 456 Elm Avenue, Anytown
- 789 Pine Road, Anytown

### Reminders
- Johnson owes $250 from last job - ask today
- Bring extra tiles for Williams
- New client from Yelp - ask for review if it goes well

---

"Mark Johnson job done" - I'll log it in your sheet
"Johnson paid" - I'll update the invoice
```

## End of Day

If user checks in at end of day:

```markdown
## End of Day Summary

**Completed today:**
- ✓ Send proposal to Tech Inc
- ✓ Follow up with cold leads

**Still pending:**
- Review contractor invoices (moved to tomorrow)
- Update project timeline

**Tomorrow's calendar:**
- 10:00 AM - Contractor walkthrough
- 2:00 PM - Tech Inc follow-up call

Want me to move incomplete tasks to tomorrow?
```

## Customization

First time using this skill, ask:
1. "Where do you track tasks? (Sheet name/URL)"
2. "What time do you usually start your day?"
3. "Prefer detailed or quick briefings?"
