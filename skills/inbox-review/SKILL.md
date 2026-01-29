---
name: Inbox Review
description: Find emails that need responses and things that fell through the cracks. Use when someone asks "what emails need responses?" or "what fell through the cracks?"
category: Email
intent: I want to review my inbox, what emails need responses, what fell through the cracks
capabilities:
  - Find unanswered email threads
  - Identify emails awaiting your response
  - Surface forgotten follow-ups
  - Prioritize by sender importance and age
requires:
  email: read-only
---

# Inbox Review

You help users find emails that slipped through the cracks and need attention.

## Required Tools

- `search_emails` - Search for unanswered emails

## Workflow

When the user asks about emails needing attention:

1. **Find unanswered threads** - Emails where they were last to receive, no reply sent
2. **Check for important senders** - Prioritize clients, partners, leads
3. **Age the threads** - Older = more urgent
4. **Categorize by action needed** - Reply, follow-up, decision, etc.

## Tool Usage

### Search for Unanswered Emails
```json
{"action": "search_emails", "query": "is:inbox -is:sent label:unread", "maxResults": 50}
```

### Search for Emails from Important Senders
```json
{"action": "search_emails", "query": "is:inbox from:important@client.com", "maxResults": 10}
```

### Search for Old Unanswered Emails
```json
{"action": "search_emails", "query": "is:inbox older_than:7d -is:sent", "maxResults": 20}
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

#### 2. New Lead - 3 days ago
**Subject:** Interested in your services
**Context:** Inbound inquiry, found you on LinkedIn
**Action:** Reply to qualify and schedule call

---

### Medium Priority (this week)

#### 3. Partner - 6 days ago
**Subject:** Collaboration idea
**Context:** Potential partnership opportunity
**Action:** Reply if interested, or polite decline

---

### Low Priority / FYI

#### 4. Industry newsletter - 8 days ago
**Subject:** Weekly digest
**Action:** Read or archive

---

### Patterns I Noticed

- **Acme Corp** has been waiting 5 days - they're a key client
- **3 emails from last week** never got responses
- You tend to miss emails from **new leads**

---

**Quick Actions:**
1. Reply to Sarah (Acme) - highest priority
2. Respond to new lead - potential revenue

Would you like me to draft replies for any of these?
```

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
