---
name: Add Task
description: Quickly add a task to your task list. Use when someone says "remind me to..." or "add task..." or "I need to..."
category: Tasks
intent: I want to add a task, remind me to, I need to, create task, new task
capabilities:
  - Add tasks to Sheets
  - Set due dates
  - Assign priority
requires:
  sheets: read-write
allowed-tools:
  - Bash
  - Read
---

# Add Task

You help users quickly capture tasks to their spreadsheet without context switching.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Google Sheets connected via Skillomatic dashboard

## Expected Sheet Structure

Users track tasks in Sheets with columns like:
- Task, Due Date, Status, Priority, Notes

## Workflow

When the user wants to add a task:

1. **Extract task description**
2. **Parse due date** - If mentioned
3. **Infer priority** - If mentioned or obvious
4. **Append to task sheet**
5. **Confirm briefly**

## API Endpoints

### Append Task
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/append" \
  -d '{
    "spreadsheetId": "...",
    "range": "Tasks!A:E",
    "values": [["Call insurance company", "2025-01-27", "Pending", "Medium", ""]]
  }'
```

## Usage Examples

### Simple
**User:** "Remind me to call the insurance company"

**Response:**
```markdown
## Task Added ✓

**Call the insurance company**
Due: Tomorrow (default)

Added to your task list.
```

### With Due Date
**User:** "Add task: Send proposal to Acme by Friday"

**Response:**
```markdown
## Task Added ✓

**Send proposal to Acme**
Due: Friday, Jan 31

Added to your task list.
```

### With Priority
**User:** "I need to review the contract ASAP"

**Response:**
```markdown
## Task Added ✓

**Review the contract**
Due: Today
Priority: High

Added to your task list.
```

### Multiple Tasks
**User:** "Add tasks: email John, update website, order supplies"

**Response:**
```markdown
## 3 Tasks Added ✓

1. **Email John** - Due: Tomorrow
2. **Update website** - Due: Tomorrow
3. **Order supplies** - Due: Tomorrow

All added to your task list.
```

## Date Parsing

Understand natural language dates:

| User says | Interpreted as |
|-----------|----------------|
| "today" | Jan 26 |
| "tomorrow" | Jan 27 |
| "Friday" | Jan 31 |
| "next week" | Feb 3 |
| "end of month" | Jan 31 |
| "ASAP" | Today, High priority |
| (no date) | Tomorrow |

## Priority Detection

Infer priority from language:

| User says | Priority |
|-----------|----------|
| "urgent", "ASAP", "critical" | High |
| "when you get a chance", "eventually" | Low |
| (default) | Medium |

## Quick Capture Mode

For rapid task entry:

**User:**
```
add tasks:
- call landlord
- finish report by Thursday
- buy printer ink
- schedule dentist appointment
```

**Response:**
```markdown
## 4 Tasks Added ✓

| Task | Due |
|------|-----|
| Call landlord | Tomorrow |
| Finish report | Thursday |
| Buy printer ink | Tomorrow |
| Schedule dentist | Tomorrow |

All added to your task list. 8 tasks now pending.
```

## Current Task Count

Always show helpful context:

```markdown
## Task Added ✓

**Review Q1 budget**
Due: Friday

You now have 12 pending tasks (3 due today).
```

## Mark Complete (Bonus)

User can also mark tasks done:

**User:** "Done with the insurance call"

**Response:**
```markdown
## Task Complete ✓

**Call insurance company** - Done!

11 tasks remaining.
```

## Elicitation

If task is vague:

**User:** "Add a task"

**Response:**
```
What's the task? (I'll add it to your list)
```

**User:** "Remind me about the thing"

**Response:**
```
Got it - what's "the thing"? I'll add it with whatever details you give me.
```

## Tips

- Keep confirmations brief - user is in capture mode
- Default to tomorrow for tasks without dates
- Recognize common patterns ("call X", "email Y", "buy Z")
- Don't over-ask - make reasonable defaults
- If they say "remind me", treat it as "add task"
