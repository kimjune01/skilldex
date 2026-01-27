---
name: log-job
description: Log a completed job with details and payment status. For trades and service businesses. Use when someone says "log today's job" or "finished the Johnson job."
intent: I want to log a job, record completed work, finished job, log service call
capabilities:
  - Add completed job to Sheets
  - Track payment status
  - Calculate running totals
  - Log materials used
requires:
  sheets: read-write
allowed-tools:
  - Bash
  - Read
---

# Log Job

You help trades and service businesses quickly log completed jobs to their spreadsheet.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Google Sheets connected via Skillomatic dashboard

## Expected Sheet Structure

Users track jobs in Sheets with columns like:
- Date, Client, Job Type, Address
- Amount, Paid (Yes/No), Payment Date
- Materials, Notes

## Workflow

When the user wants to log a job:

1. **Extract details** - Client, job type, amount
2. **Ask for missing info** - Amount if not provided
3. **Append to jobs sheet**
4. **Confirm with summary**

## API Endpoints

### Append Job
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/append" \
  -d '{
    "spreadsheetId": "...",
    "range": "Jobs!A:H",
    "values": [["2025-01-26", "Johnson", "Bathroom repair", "123 Oak St", "450", "No", "", "Fixed leaky faucet and replaced valve"]]
  }'
```

### Get Month Stats
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/read?spreadsheetId=...&range=Jobs!A:F"
```

## Usage Examples

### Quick Log
**User:** "Finished Johnson job, $450"

**Response:**
```markdown
## Job Logged ✓

**Client:** Johnson
**Amount:** $450
**Date:** Jan 26, 2025
**Paid:** Not yet

Added to your jobs sheet.

---

**January so far:** 18 jobs, $8,240 total
```

### With Details
**User:** "Log the Williams kitchen - 456 Elm Ave, $1,500 for cabinet install, they paid cash"

**Response:**
```markdown
## Job Logged ✓

| Field | Value |
|-------|-------|
| Client | Williams |
| Job | Cabinet install |
| Address | 456 Elm Ave |
| Amount | $1,500 |
| Paid | ✓ Yes (cash) |
| Date | Jan 26, 2025 |

Added to your jobs sheet.

---

**January:** 19 jobs, $9,740 total | $7,640 collected
```

### With Materials
**User:** "Did a water heater install for Garcia, $850, used $120 in parts"

**Response:**
```markdown
## Job Logged ✓

**Client:** Garcia
**Job:** Water heater install
**Amount:** $850
**Materials:** $120
**Net:** $730
**Paid:** Not yet

Added to your jobs sheet.
```

### Multiple Jobs
**User:** "Log 3 jobs today: Anderson leak repair $150 paid, Baker toilet install $275, Chen faucet replace $125 paid"

**Response:**
```markdown
## 3 Jobs Logged ✓

| Client | Job | Amount | Paid |
|--------|-----|--------|------|
| Anderson | Leak repair | $150 | ✓ |
| Baker | Toilet install | $275 | - |
| Chen | Faucet replace | $125 | ✓ |

**Today's total:** $550 | $275 collected, $275 pending

All added to your jobs sheet.
```

## Mark Job Paid

**User:** "Baker paid" or "Mark Baker as paid"

```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/update" \
  -d '{
    "spreadsheetId": "...",
    "range": "Jobs!F23",
    "values": [["Yes"]]
  }'
```

**Response:**
```markdown
## Payment Logged ✓

**Baker** - $275 marked as paid.

**Outstanding:** $1,840 (down from $2,115)
```

## Quick Stats

**User:** "How did I do this week?"

**Response:**
```markdown
## This Week (Jan 20-26)

**Jobs completed:** 8
**Total billed:** $3,450
**Collected:** $2,875
**Outstanding:** $575

| Day | Jobs | Revenue |
|-----|------|---------|
| Mon | 2 | $425 |
| Tue | 1 | $275 |
| Wed | 2 | $1,100 |
| Thu | 1 | $150 |
| Fri | 2 | $1,500 |

**Avg per job:** $431
**Best job:** Williams cabinet install ($1,500)
```

## Monthly Summary

**User:** "How much did I make this month?"

**Response:**
```markdown
## January 2025

**Jobs:** 19
**Total billed:** $9,740
**Collected:** $7,640
**Outstanding:** $2,100

| Week | Jobs | Revenue |
|------|------|---------|
| Jan 1-5 | 3 | $1,240 |
| Jan 6-12 | 5 | $2,450 |
| Jan 13-19 | 6 | $2,600 |
| Jan 20-26 | 5 | $3,450 |

**Top clients:**
- Williams: $2,800 (3 jobs)
- Garcia: $1,450 (2 jobs)
- Johnson: $890 (3 jobs)

**Still owed:** $2,100 from 6 jobs
```

## Elicitation

If user gives minimal info:

**User:** "Log a job"

**Response:**
```
Got it - logging a job. Quick questions:

1. **Client name?**
2. **Amount?**
3. **Job type?** (optional)
4. **Paid?** (yes/no)
```

## Tips

- Default payment status to "No" unless user says paid
- Remember frequent clients and addresses
- Track materials separately when mentioned
- Celebrate milestones ("Nice - your 20th job this month!")
