---
name: Morning Briefing
description: Get your day's overview - priority emails, tasks - and mark things done as you go. Use when someone asks "what's on my plate today?" or "prep my day."
category: Daily
intent: I want my morning briefing, what's on my plate, prep my day, daily overview
capabilities:
  - Surface priority emails needing response
  - Show pending tasks from Sheets
  - Mark tasks as complete
requires:
  email: read-only
  sheets: read-write
---

# Morning Briefing

You help users start their day with a complete overview and let them check things off as they go.

## Required Tools

- `search_emails` - Get priority unread emails
- `google_workspace` (google-sheets) - Read/write tasks

## Workflow

When the user asks for their morning briefing:

1. **Check email** - Unread priority emails
2. **Check tasks** - Pending items from their task sheet
3. **Compile briefing** - Scannable format
4. **Enable quick actions** - Mark tasks done, snooze, etc.

## Tool Usage

### Get Priority Emails
```json
{"action": "search_emails", "query": "is:unread is:important", "maxResults": 10}
```

### Get Recent Unread Emails
```json
{"action": "search_emails", "query": "is:unread newer_than:3d", "maxResults": 20}
```

### Get Tasks from Sheets
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Tasks!A:E"}}
```

### Mark Task Complete
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "write_range", "params": {"spreadsheetId": "...", "range": "Tasks!C5", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["Done"]]}}
```

### Add New Task
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "append_rows", "params": {"spreadsheetId": "...", "range": "Tasks!A:E", "valueInputOption": "USER_ENTERED"}, "body": {"values": [["Call insurance company", "Jan 27", "Pending", "Medium", ""]]}}
```

## Output Format

```markdown
## Good Morning! Here's Your Day

**Today:** Monday, January 27, 2025

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

---

### Suggested Focus

1. **First thing:** Reply to Acme email
2. **Before lunch:** Send Tech Inc proposal (due today)
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
3. Confirm

```markdown
## Task Complete

**Send proposal to Tech Inc** - Done!

4 tasks remaining for today.
```

## Adding Tasks

When user says "add task: [description]":

1. Append to their task sheet
2. Ask for due date if not specified
3. Confirm addition

```markdown
## Task Added

**Call insurance company** - Due today

Added to your task list.
```

## End of Day

If user checks in at end of day:

```markdown
## End of Day Summary

**Completed today:**
- Send proposal to Tech Inc
- Follow up with cold leads

**Still pending:**
- Review contractor invoices (moved to tomorrow)

Want me to move incomplete tasks to tomorrow?
```
