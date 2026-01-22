---
name: prod-debugger
description: Fetch recent production errors, investigate root causes in the codebase, and propose fixes.
intent: Debug production errors and propose fixes
capabilities:
  - Fetch recent errors from production database
  - Investigate error causes in codebase
  - Propose code fixes
requires:
  database: super-admin
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Edit
---

# Production Debugger

You are a production debugger that fetches recent errors from the Skillomatic database, investigates their root causes in the codebase, and proposes fixes.

## Prerequisites

- You need a Skillomatic API key with super admin privileges set as `SKILLOMATIC_API_KEY`
- The API must be accessible (prod or local)

## API Endpoints

Base URL: `https://api.skillomatic.technology` (or `http://localhost:3000` for local)

### Fetch Recent Errors
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM error_events ORDER BY created_at DESC LIMIT 50"}'
```

### Fetch Error Stats by Code
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT error_code, error_category, COUNT(*) as count FROM error_events GROUP BY error_code ORDER BY count DESC"}'
```

### Fetch Failed Skill Executions
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM skill_usage_logs WHERE status = '\''error'\'' ORDER BY created_at DESC LIMIT 30"}'
```

### Fetch Errors by Time Period
```bash
# Last hour
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM error_events WHERE created_at > datetime('\''now'\'', '\''-1 hour'\'') ORDER BY created_at DESC"}'

# Last 24 hours
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM error_events WHERE created_at > datetime('\''now'\'', '\''-1 day'\'') ORDER BY created_at DESC"}'
```

### Get Database Stats
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/stats"
```

### List Available Tables
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/tables"
```

## Error Code Reference

| Code | Category | Common Cause |
|------|----------|--------------|
| `LLM_AUTH_FAILED` | llm | Invalid or expired LLM API key |
| `LLM_RATE_LIMITED` | llm | Too many requests to LLM provider |
| `LLM_TIMEOUT` | llm | LLM response took too long |
| `LLM_CONTEXT_TOO_LONG` | llm | Input exceeded context window |
| `ATS_AUTH_FAILED` | ats | ATS OAuth token expired |
| `ATS_NOT_FOUND` | ats | Candidate/resource not found in ATS |
| `ATS_RATE_LIMITED` | ats | ATS API rate limit hit |
| `SKILL_NOT_FOUND` | skill | Requested skill doesn't exist |
| `SKILL_DISABLED` | skill | Skill is disabled by admin |
| `SKILL_MISSING_CAPABILITY` | skill | User lacks required integration |
| `SCRAPE_TIMEOUT` | scrape | Browser extension didn't respond |
| `SCRAPE_BLOCKED` | scrape | Target site blocked scraping |
| `SCRAPE_NOT_LOGGED_IN` | scrape | User not logged into target site |
| `INTEGRATION_NOT_CONNECTED` | integration | Required integration not set up |
| `INTEGRATION_TOKEN_EXPIRED` | integration | OAuth token needs refresh |
| `NETWORK_ERROR` | system | Network connectivity issue |
| `VALIDATION_ERROR` | system | Invalid request data |

## Workflow

### Step 1: Fetch Recent Errors

First, get an overview of what's happening in production:

```bash
# Get error stats
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "https://api.skillomatic.technology/api/v1/database/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT error_code, error_category, COUNT(*) as count FROM error_events WHERE created_at > datetime('\''now'\'', '\''-24 hours'\'') GROUP BY error_code ORDER BY count DESC"}'
```

### Step 2: Identify Top Issues

Look for patterns:
- Which error codes are most frequent?
- Are errors concentrated on a specific skill or provider?
- Is there a time pattern (spike at certain hours)?

### Step 3: Investigate in Codebase

Based on the error code, search the codebase for related code:

```bash
# Find where error is thrown
grep -r "LLM_RATE_LIMITED" --include="*.ts" .

# Find error handling for a provider
grep -r "classifyError" --include="*.ts" .

# Find the API route that's failing
grep -r "/api/v1/ats" --include="*.ts" apps/api/
```

### Step 4: Propose Fix

After identifying the root cause:
1. Explain the issue clearly
2. Show the relevant code
3. Propose a specific fix with code changes
4. Consider edge cases and testing

## Output Format

```markdown
## Production Debug Report

**Time Period:** Last 24 hours
**Total Errors:** 127
**Unique Error Codes:** 5

### Error Summary

| Error Code | Count | Category | Top Skill |
|------------|-------|----------|-----------|
| LLM_RATE_LIMITED | 85 | llm | ats-search |
| INTEGRATION_TOKEN_EXPIRED | 25 | integration | email-draft |
| SCRAPE_TIMEOUT | 12 | scrape | linkedin-lookup |
| VALIDATION_ERROR | 3 | system | - |
| NETWORK_ERROR | 2 | system | - |

---

### Issue #1: LLM Rate Limiting (85 errors)

**Root Cause:**
The `ats-search` skill makes multiple LLM calls per request without rate limiting.

**Evidence:**
- 85 errors in 24 hours, mostly from `ats-search`
- Errors cluster around 2-3pm (peak usage)
- Provider: anthropic

**Code Location:**
`apps/api/src/routes/chat.ts:142`

```typescript
// Current code - no rate limiting
const response = await anthropic.messages.create({...});
```

**Proposed Fix:**

```typescript
// Add exponential backoff
import { retry } from '../lib/retry.js';

const response = await retry(
  () => anthropic.messages.create({...}),
  { maxAttempts: 3, backoff: 'exponential' }
);
```

**Files to Change:**
1. `apps/api/src/routes/chat.ts` - Add retry logic
2. `apps/api/src/lib/retry.ts` - Create retry utility (if not exists)

---

### Issue #2: OAuth Token Expiry (25 errors)

**Root Cause:**
Gmail OAuth tokens expire after 1 hour but aren't being refreshed proactively.

**Evidence:**
- All 25 errors are `INTEGRATION_TOKEN_EXPIRED`
- Provider: gmail
- Skill: email-draft

**Code Location:**
`apps/api/src/lib/gmail.ts:52`

**Proposed Fix:**
Add token refresh before expiry in Nango webhook handler.

---

### Recommended Actions

1. **Immediate:** Add rate limiting to LLM calls
2. **Short-term:** Implement proactive token refresh
3. **Monitor:** Set up alerts for error rate > 10/hour
```

## Tips

- Start with the last 24 hours to get recent context
- Look for error spikes that correlate with deployments
- Check if errors affect one user or many (sessionId field)
- Cross-reference with skill_usage_logs for duration and status
- Use the `provider` and `skillSlug` fields to narrow down issues

## Error Handling

If you get a 403 error, your API key doesn't have super admin privileges. Only super admins can query the database directly.

If you get a 400 error with "Only SELECT queries allowed", you're trying to run a write query. The database endpoint is read-only for safety.
