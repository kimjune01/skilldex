---
name: Log Expense
description: Log a business expense to your spreadsheet. Use when someone says "log this expense" or "I just spent $X on..."
category: Finance
intent: I want to log an expense, track expense, record purchase, business expense
capabilities:
  - Add expense to Sheets
  - Categorize expenses
  - Track running totals
requires:
  sheets: read-write
allowed-tools:
  - Bash
  - Read
---

# Log Expense

You help users quickly log business expenses to their spreadsheet without opening it.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Google Sheets connected via Skillomatic dashboard

## Expected Sheet Structure

Users track expenses in Sheets with columns like:
- Date, Description, Amount, Category, Notes, Receipt

Common categories:
- Software/Tools
- Contractors
- Office/Supplies
- Travel
- Meals
- Marketing
- Professional Services
- Other

## Workflow

When the user wants to log an expense:

1. **Extract details** - Amount, description, category
2. **Ask for missing info** - Category if unclear
3. **Append to expense sheet**
4. **Confirm with running totals**

## API Endpoints

### Append Expense
```bash
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/append" \
  -d '{
    "spreadsheetId": "...",
    "range": "Expenses!A:F",
    "values": [["2025-01-26", "Adobe Creative Cloud", "54.99", "Software", "Monthly subscription", ""]]
  }'
```

### Get Month-to-Date Total
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/sheets/read?spreadsheetId=...&range=Expenses!A:C"
```

## Usage Examples

### Simple
**User:** "Log $54.99 for Adobe"

**Response:**
```markdown
## Expense Logged

**Amount:** $54.99
**Description:** Adobe
**Category:** Software (assumed)
**Date:** Jan 26, 2025

Added to your expenses sheet.

**January total:** $1,247.50
```

### With Category
**User:** "I just spent $127 on office supplies at Staples"

**Response:**
```markdown
## Expense Logged

**Amount:** $127.00
**Description:** Office supplies - Staples
**Category:** Office/Supplies
**Date:** Jan 26, 2025

Added to your expenses sheet.
```

### Needs Clarification
**User:** "Log $500 payment to John"

**Response:**
```markdown
Got it - $500 to John.

What category?
- Contractors
- Professional Services
- Other

(Or just tell me and I'll add it)
```

## Output Format

After logging:

```markdown
## Expense Logged ✓

| Field | Value |
|-------|-------|
| Amount | $54.99 |
| Description | Adobe Creative Cloud |
| Category | Software |
| Date | Jan 26, 2025 |

---

**This month:** $1,247.50 across 23 expenses
**This category (Software):** $287.96
```

## Bulk Logging

If user has multiple expenses:

**User:** "Log these: $50 lunch with client, $23 Uber, $89 Zoom subscription"

**Response:**
```markdown
## 3 Expenses Logged

| Amount | Description | Category |
|--------|-------------|----------|
| $50.00 | Lunch with client | Meals |
| $23.00 | Uber | Travel |
| $89.00 | Zoom subscription | Software |

**Total added:** $162.00

All added to your expenses sheet.
```

## Quick Stats

User can ask for summaries:

**User:** "How much have I spent this month?"

**Response:**
```markdown
## January Expenses

**Total:** $1,247.50

| Category | Amount | % |
|----------|--------|---|
| Software | $287.96 | 23% |
| Contractors | $450.00 | 36% |
| Meals | $189.54 | 15% |
| Office | $127.00 | 10% |
| Other | $193.00 | 16% |

**Largest expense:** Contractor payment - $450
**Most frequent:** Software subscriptions (8 entries)
```

## For Trades

Simpler format for trades/contractors:

**User:** "Spent $85 on plumbing parts"

**Response:**
```markdown
## Logged ✓

$85 - Plumbing parts (Materials)

**January materials:** $423
```

## Tips

- Default to today's date unless user specifies otherwise
- Auto-categorize common expenses (Adobe = Software, Uber = Travel)
- Keep confirmations brief but informative
- Offer to add receipt link if they mention having one
