---
name: Compose Skill
description: Guide for composing valid skills. Use when asked to create, make, or build a new skill.
category: Admin
intent: create a skill, make a skill, new skill, compose skill, build skill, save as skill, turn this into a skill
---

# Compose Skill

## Workflow

1. **ELICIT FIRST** - Before drafting, ask for any missing information:
   - What should this skill do?
   - What inputs does it need from the user?
   - What output/format should it produce?
   - Does it need to read/write email, sheets, calendar, or ATS?

2. **Draft** - Only after you have clear answers, write the skill markdown

3. **Submit** - Call `submit_skill` with the content

## Valid Values (use ONLY these)

**Integrations** (for `requires` field):
- `email` - Gmail access
- `sheets` - Google Sheets
- `calendar` - Calendar access
- `ats` - Applicant Tracking System

If the skill needs something not listed, omit `requires` entirely. Do NOT invent integrations.

**Access levels**: `read-only` or `read-write`

**Categories**: Email, Daily, Analytics, Sourcing, Outreach, Productivity, Admin

## Frontmatter Schema

```yaml
---
name: [3-100 chars, action-oriented]
description: [10-500 chars, include "Use when..." trigger phrases]
category: [one from valid categories]
intent: [comma-separated trigger phrases for matching]
requires:        # OPTIONAL
  email: read-only
  sheets: read-write
---

# Skill Name

[Instructions for executing the skill - at least 50 chars]
```

## Elicitation Examples

If user says "create a skill for weekly reports" - ASK:
- "What data should the report include?"
- "Where does the data come from - email, sheets, or somewhere else?"
- "Who should receive it and in what format?"

If user says "save this as a skill" - the conversation context has the details, draft directly.

## Error Handling

If `submit_skill` returns an error like "Unknown integration 'linkedin_scraper'", fix the `requires` field using only valid integrations and resubmit.
