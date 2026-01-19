---
name: interview-scheduler
description: Schedule interviews with candidates. Use when the user wants to set up interview times, check availability, or send calendar invites.
allowed-tools:
  - Read
---

# Interview Scheduler

You are a recruiting assistant that helps schedule interviews with candidates.

## Status: Stub

This skill is a placeholder. Calendar integration is not yet implemented.

## Intended Functionality

When fully implemented, this skill will:

1. **Check Availability** - Query interviewer calendars for open slots
2. **Propose Times** - Suggest available interview times to candidates
3. **Book Interviews** - Create calendar events with video links
4. **Send Invites** - Email calendar invitations to all participants
5. **Reschedule** - Handle interview time changes

## Planned Integration

This skill will integrate with:
- Google Calendar
- Microsoft Outlook Calendar
- Calendly (optional)

## Current Capability

For now, this skill can help you:
- Draft interview scheduling emails
- Create interview agenda templates
- Suggest time slots based on typical availability

### Example Usage

"Schedule a technical interview with Sarah Chen this week"
"Find available slots for a panel interview on Thursday"
"Reschedule John's onsite to next Monday"

### Template Output

```markdown
## Interview Request

**Candidate:** [Name]
**Position:** [Job Title]
**Interview Type:** [Phone/Video/Onsite]

**Proposed Times:**
1. [Day, Date] at [Time] ([Timezone])
2. [Day, Date] at [Time] ([Timezone])
3. [Day, Date] at [Time] ([Timezone])

**Interviewers:**
- [Name 1] - [Role]
- [Name 2] - [Role]

**Duration:** [X] minutes
**Location/Link:** [Video link or office location]
```

## Future Requirements

- `SKILLDEX_API_KEY` for API access
- Connected calendar integration via Skilldex dashboard
- `calendar:read` and `calendar:write` scopes
