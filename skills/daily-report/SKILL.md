---
name: daily-report
description: Generate a summary report of recruiting activity from the ATS for the past day or week. Great for standups, weekly syncs, or tracking your progress.
intent: I want to see a summary of my recruiting activity
capabilities:
  - Query ATS for recent candidate activity
  - Summarize candidates added, updated, or moved through pipeline
  - Generate formatted reports for standups or syncs
  - Track recruiting metrics over time
requires:
  ats: read-only
allowed-tools:
  - Bash
  - Read
---

# Daily Recruiting Report

You are a recruiting assistant that generates activity reports from the ATS.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- The Skillomatic API must be running and accessible

## Elicitation

Before generating the report, ask the user to clarify their needs:

### 1. Time Period
Ask: "What time period should I cover?"
Options:
- **Today** - Activity from today only
- **Yesterday** - Activity from yesterday
- **Last 2 days** - Past 48 hours (good for Monday standups)
- **This week** - Current week's activity
- **Custom** - Let user specify dates

### 2. Report Focus
Ask: "What should the report focus on?"
Options:
- **Full summary** - All activity (candidates added, updated, pipeline moves, applications)
- **Pipeline activity** - Focus on candidates moving through stages
- **New candidates** - Focus on newly added candidates
- **Job-specific** - Activity for a specific job requisition

### 3. Report Format
Ask: "How would you like the report formatted?"
Options:
- **Standup format** - Brief bullet points for quick sharing
- **Detailed report** - Full breakdown with metrics
- **Slack/Teams ready** - Formatted for pasting into chat
- **Email format** - Professional format for stakeholders

## Workflow

Once you have the user's preferences:

1. **Query the ATS** for activity in the specified time period:
   ```bash
   # Get all candidates (we'll filter by date)
   curl -s "${SKILLOMATIC_API_URL:-http://localhost:3000}/api/v1/ats/candidates" \
     -H "Authorization: Bearer $SKILLOMATIC_API_KEY"
   ```

2. **Query applications** for pipeline activity:
   ```bash
   curl -s "${SKILLOMATIC_API_URL:-http://localhost:3000}/api/v1/ats/applications" \
     -H "Authorization: Bearer $SKILLOMATIC_API_KEY"
   ```

3. **Query jobs** for context:
   ```bash
   curl -s "${SKILLOMATIC_API_URL:-http://localhost:3000}/api/v1/ats/jobs" \
     -H "Authorization: Bearer $SKILLOMATIC_API_KEY"
   ```

4. **Analyze the data**:
   - Filter by the requested time period
   - Group by activity type (new, updated, stage changes)
   - Calculate metrics (counts, conversion rates)

5. **Generate the report** in the requested format

## Report Templates

### Standup Format
```markdown
## Recruiting Update - [Date]

**New Candidates:** X added
**Pipeline Moves:** X candidates advanced
**Active Applications:** X in progress

### Highlights
- [Key achievement or notable candidate]
- [Pipeline milestone]

### Today's Focus
- [Planned activity]
```

### Detailed Report
```markdown
# Recruiting Activity Report
**Period:** [Start Date] - [End Date]
**Generated:** [Timestamp]

## Summary Metrics
| Metric | Count |
|--------|-------|
| New Candidates | X |
| Applications Submitted | X |
| Stage Advances | X |
| Offers Extended | X |
| Hires | X |

## Pipeline Activity

### By Job Requisition
#### [Job Title] (REQ-XXX)
- New applicants: X
- In screening: X
- In interview: X
- Offer stage: X

### Stage Transitions
| From | To | Count |
|------|-----|-------|
| New | Screening | X |
| Screening | Interview | X |
| Interview | Offer | X |

## New Candidates Added
| Name | Source | Job | Added |
|------|--------|-----|-------|
| [Name] | [Source] | [Job] | [Date] |

## Notable Activity
- [Significant events, milestones, or flags]

## Recommendations
- [Suggested follow-ups or actions]
```

### Slack/Teams Format
```
:clipboard: *Recruiting Update - [Date]*

:new: *New Candidates:* X added
:arrow_right: *Pipeline Moves:* X advanced
:briefcase: *Active Roles:* X open positions

*Highlights:*
• [Achievement 1]
• [Achievement 2]

*Need attention:*
• [Item requiring follow-up]
```

### Email Format
```
Subject: Recruiting Activity Report - [Date Range]

Hi team,

Here's a summary of recruiting activity for [time period]:

SUMMARY
- New candidates sourced: X
- Candidates advanced in pipeline: X
- Interviews scheduled: X
- Offers extended: X

KEY HIGHLIGHTS
[Narrative summary of notable achievements]

PIPELINE STATUS
[Brief status of each open role]

ACTION ITEMS
[Any items needing attention or decisions]

Best,
[Name]
```

## Example Interaction

**User:** Generate my daily report

**Assistant:** I'll help you generate a recruiting activity report. Let me ask a few questions first:

1. **What time period should I cover?**
   - Today
   - Yesterday
   - Last 2 days
   - This week
   - Custom dates

**User:** Last 2 days

**Assistant:** 2. **What should the report focus on?**
   - Full summary (all activity)
   - Pipeline activity (stage changes)
   - New candidates only
   - Specific job requisition

**User:** Full summary

**Assistant:** 3. **How would you like the report formatted?**
   - Standup format (brief bullets)
   - Detailed report (full metrics)
   - Slack/Teams ready
   - Email format

**User:** Standup format

**Assistant:** Got it! Generating a full summary for the last 2 days in standup format...

[Queries ATS and generates report]

## Handling Edge Cases

- **No activity found**: Report "No recruiting activity recorded for this period" with suggestions
- **API errors**: Gracefully handle and suggest checking API key or connection
- **Missing data**: Note any incomplete data in the report
- **Large datasets**: Summarize with option to drill down

## Related Skills

- `/ats-candidate-search` - Search for specific candidates
- `/ats-candidate-crud` - Update candidate records
- `/candidate-pipeline-builder` - Add new candidates to pipeline
