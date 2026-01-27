---
name: inbox-review
description: Find emails that need responses and things that fell through the cracks. Use when someone asks "what emails need responses?" or "what fell through the cracks?"
intent: I want to review my inbox, what emails need responses, what fell through the cracks
capabilities:
  - Find unanswered email threads
  - Identify emails awaiting your response
  - Surface forgotten follow-ups
  - Prioritize by sender importance and age
requires:
  email: read-only
allowed-tools:
  - Bash
  - Read
---

# Inbox Review

You help users find emails that slipped through the cracks and need attention.

## Prerequisites

- `SKILLOMATIC_API_KEY` environment variable set
- Gmail connected via Skillomatic dashboard

## Workflow

When the user asks about emails needing attention:

1. **Find unanswered threads** - Emails where they were last to receive, no reply sent
2. **Check for important senders** - Prioritize clients, partners, leads
3. **Age the threads** - Older = more urgent
4. **Categorize by action needed** - Reply, follow-up, decision, etc.

## API Endpoints

### Search for Unanswered Emails
```bash
# Emails received that haven't been replied to
curl -s -X POST -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/search" \
  -d '{"query": "is:inbox -is:sent label:unread", "maxResults": 50}'
```

### Get Thread Details
```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "{{SKILLOMATIC_API_URL}}/api/v1/email/threads/{threadId}"
```

## Output Format

```markdown
## Inbox Review

**Emails needing response:** 8
**Oldest unanswered:** 12 days

---

### High Priority (respond today)

#### 1. Sarah Johnson (Acme Corp) - 5 days ago
**Subject:** Re: Phase 2 timeline question
**Context:** Client asking about next phase timeline
**Action:** Reply with timeline estimate
**Quick draft:** "Hi Sarah, for Phase 2 we're looking at..."

#### 2. New Lead - 3 days ago
**Subject:** Interested in your services
**Context:** Inbound inquiry, found you on LinkedIn
**Action:** Reply to qualify and schedule call
**Quick draft:** "Thanks for reaching out! I'd love to learn more..."

#### 3. Vendor - 4 days ago
**Subject:** Contract renewal
**Context:** Annual renewal, needs signature
**Action:** Review and sign, or ask questions

---

### Medium Priority (this week)

#### 4. Partner - 6 days ago
**Subject:** Collaboration idea
**Context:** Potential partnership opportunity
**Action:** Reply if interested, or polite decline

#### 5. Newsletter subscriber - 7 days ago
**Subject:** Question about your post
**Context:** Reader with follow-up question
**Action:** Brief helpful reply

---

### Low Priority / FYI

#### 6. Industry newsletter - 8 days ago
**Subject:** Weekly digest
**Action:** Read or archive

#### 7. Software update - 10 days ago
**Subject:** New features available
**Action:** Review when free, or archive

---

### Patterns I Noticed

- **Acme Corp** has been waiting 5 days - they're a key client
- **3 emails from last week** never got responses
- You tend to miss emails from **new leads** - consider a faster follow-up process

---

### Quick Actions

1. Reply to Sarah (Acme) - highest priority client
2. Respond to new lead - potential revenue
3. Handle vendor contract - has a deadline

Would you like me to draft replies for any of these?
```

## Finding Unanswered Threads

Logic for identifying emails needing response:
1. Thread where the last message is FROM someone else (not you)
2. No reply sent from you after that message
3. Older than 24 hours (give time for same-day response)
4. Not in spam, promotions, or social tabs

## Priority Scoring

Score emails by:
- **Sender type:** Client (high) > Lead (high) > Partner (medium) > Other (low)
- **Age:** Older = higher priority
- **Subject keywords:** "urgent," "asap," "question," "contract" = boost priority
- **Thread length:** Long threads with no reply = might be forgotten

## Elicitation

Ask if needed:
1. "How far back should I look? (Default: 2 weeks)"
2. "Any senders or domains to always prioritize?"
3. "Want me to draft quick replies as I go?"

## Quick Mode

For a fast scan:

```markdown
## Quick Inbox Check

**Needs response (8 total):**
1. Sarah (Acme) - Phase 2 question - 5 days
2. New lead - Inquiry - 3 days
3. Vendor - Contract - 4 days

**Oldest:** 12 days (industry newsletter - probably fine to skip)

Top priority: Reply to Sarah before your call with them today.
```
