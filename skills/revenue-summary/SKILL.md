---
name: revenue-summary
description: Get a summary of revenue, expenses, and financial health. Use when someone asks "how did we do last week?" or "what's my revenue this month?"
intent: I want to check revenue, how did we do, monthly revenue, financial summary
capabilities:
  - Pull revenue from Stripe
  - Check expenses from Sheets
  - Calculate profit/margins
  - Compare to previous periods
requires:
  stripe: read-only
  sheets: read-only
allowed-tools:
  - Bash
  - Read
---

# Revenue Summary

You help users get a quick financial health check - revenue, expenses, and trends.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Stripe and/or Google Sheets connected via Skillomatic dashboard

## Workflow

When the user asks about revenue:

1. **Determine timeframe** - Week, month, quarter, or custom
2. **Pull revenue data** - From Stripe and/or Sheets
3. **Pull expense data** - If tracked in Sheets
4. **Calculate key metrics** - Total, average, comparison
5. **Present summary** - Clear, scannable format

## API Endpoints

### Get Stripe Revenue
```bash
# Get charges for a date range
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/stripe/charges?startDate=2025-01-01&endDate=2025-01-31"
```

### Get Stripe Balance
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/stripe/balance"
```

### Query Expense Sheet
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/query" \
  -d '{"spreadsheetId": "...", "range": "Expenses!A:D"}'
```

## Output Format

### Weekly Summary

```markdown
## Weekly Revenue Summary

**Period:** Jan 20 - Jan 26, 2025

---

### Revenue

| Source | Amount |
|--------|--------|
| Stripe payments | $4,200 |
| Invoice payments | $1,500 |
| **Total Revenue** | **$5,700** |

**vs Last Week:** +$800 (+16%)
**vs Same Week Last Month:** +$1,200 (+27%)

---

### Breakdown by Client

| Client | Amount | Type |
|--------|--------|------|
| Acme Corp | $2,500 | Project milestone |
| Tech Inc | $1,700 | Monthly retainer |
| StartupCo | $1,500 | Invoice payment |

---

### Expenses (if tracked)

| Category | Amount |
|----------|--------|
| Software/Tools | $350 |
| Contractors | $800 |
| Other | $150 |
| **Total Expenses** | **$1,300** |

---

### Bottom Line

| Metric | Amount |
|--------|--------|
| Revenue | $5,700 |
| Expenses | $1,300 |
| **Net Profit** | **$4,400** |
| **Margin** | 77% |

---

### Insights

- Best week in January so far
- Acme Corp milestone payment helped - another milestone due Feb 15
- Expenses in line with average

Looking good this week!
```

### Monthly Summary

```markdown
## January 2025 Revenue Summary

**Period:** Jan 1 - Jan 26, 2025 (month to date)

---

### Revenue Overview

| Metric | Amount |
|--------|--------|
| Total Revenue | $18,500 |
| Projected Month-End | $21,200 |
| Last Month (Dec) | $16,800 |
| **vs Last Month** | **+$4,400 (+26%)** |

---

### Weekly Breakdown

| Week | Revenue | Notes |
|------|---------|-------|
| Jan 1-5 | $3,200 | Slow start (holidays) |
| Jan 6-12 | $4,100 | - |
| Jan 13-19 | $5,500 | Acme payment |
| Jan 20-26 | $5,700 | Strong finish |

---

### Top Clients (MTD)

| Client | Revenue | % of Total |
|--------|---------|------------|
| Acme Corp | $7,500 | 41% |
| Tech Inc | $6,800 | 37% |
| Others | $4,200 | 22% |

---

### Cash Position

| Status | Amount |
|--------|--------|
| Available (Stripe) | $8,200 |
| Pending (Stripe) | $2,500 |
| Outstanding invoices | $4,800 |

---

### Key Takeaways

1. **Strong month** - on track to beat December by 26%
2. **Client concentration** - Acme + Tech Inc = 78% of revenue
3. **Outstanding invoices** - $4,800 waiting to be collected
```

## For Trades

Simpler format for contractors/trades:

```markdown
## How'd You Do Last Month?

**January 2025**

| Jobs completed | 18 |
| Total revenue | $12,400 |
| Average per job | $689 |

**vs December:** +$1,800 (you did 3 more jobs)

**Best jobs:**
- Kitchen remodel (Williams) - $2,800
- Bathroom repair (Johnson) - $1,500

**Still owed:** $1,200 from 2 jobs

Not bad! Busiest January in a while.
```

## Elicitation

Ask if needed:
1. "What timeframe? (This week, last week, this month, last month)"
2. "Do you track expenses somewhere? (Sheets, Wave, etc.)"
3. "Any specific metrics you want to see?"

## Quick Mode

```markdown
## Quick Revenue Check

**Last week:** $5,700 (up 16%)
**Month to date:** $18,500
**Outstanding:** $4,800 in unpaid invoices

Top client: Acme Corp ($7,500 this month)
```
