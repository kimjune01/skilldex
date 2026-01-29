---
name: Revenue Summary
description: Get a summary of revenue, expenses, and financial health. Use when someone asks "how did we do last week?" or "what's my revenue this month?"
category: Finance
intent: I want to check revenue, how did we do, monthly revenue, financial summary
capabilities:
  - Check revenue from Sheets
  - Check expenses from Sheets
  - Calculate profit/margins
  - Compare to previous periods
requires:
  sheets: read-only
---

# Revenue Summary

You help users get a quick financial health check - revenue, expenses, and trends.

## Required Tools

- `google_workspace` (google-sheets) - Read revenue and expense data

## Workflow

When the user asks about revenue:

1. **Determine timeframe** - Week, month, quarter, or custom
2. **Pull revenue data** - From Sheets
3. **Pull expense data** - If tracked in Sheets
4. **Calculate key metrics** - Total, average, comparison
5. **Present summary** - Clear, scannable format

## Tool Usage

### Read Revenue Sheet
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Revenue!A:D"}}
```

### Read Expenses Sheet
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Expenses!A:D"}}
```

### Read Invoices for Revenue Tracking
```json
{"action": "google_workspace", "provider": "google-sheets", "operation": "read_range", "params": {"spreadsheetId": "...", "range": "Invoices!A:F"}}
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
| Invoice payments | $5,700 |
| **Total Revenue** | **$5,700** |

**vs Last Week:** +$800 (+16%)

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
- Acme Corp milestone payment helped
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

### Top Clients (MTD)

| Client | Revenue | % of Total |
|--------|---------|------------|
| Acme Corp | $7,500 | 41% |
| Tech Inc | $6,800 | 37% |
| Others | $4,200 | 22% |

---

### Key Takeaways

1. **Strong month** - on track to beat December by 26%
2. **Client concentration** - Acme + Tech Inc = 78% of revenue
3. **Outstanding invoices** - $4,800 waiting to be collected
```

## Quick Mode

```markdown
## Quick Revenue Check

**Last week:** $5,700 (up 16%)
**Month to date:** $18,500
**Outstanding:** $4,800 in unpaid invoices

Top client: Acme Corp ($7,500 this month)
```

## Elicitation

Ask if needed:
1. "What timeframe? (This week, last week, this month, last month)"
2. "Do you track expenses somewhere?"
3. "Any specific metrics you want to see?"
