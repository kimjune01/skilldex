# Skill Creation Architecture

This document describes how skills are created through chat and optionally scheduled via cron.

## Overview

Skills are created through a two-step process:

1. **Composition** - LLM loads the `compose-skill` skill which provides validation rules, valid integration names, and examples
2. **Submission** - LLM calls `submit_skill` to send the skill to the API, which validates and stores it

This separation ensures the LLM has explicit guidance on valid values (deterministic rules) while the API provides a safety net with server-side validation.

## Data Flow

```
User: "create a skill for X"
        ↓
LLM loads compose-skill via load_skill
        ↓
compose-skill provides:
├─→ Valid integrations: email, sheets, calendar, ats
├─→ Valid access levels: read-only, read-write
├─→ Valid categories
├─→ Complete example
└─→ Validation checklist
        ↓
LLM drafts skill following the rules
        ↓
LLM calls submit_skill(content)
        ↓
POST /skills API endpoint
        ↓
├─→ Validates frontmatter (name, description, intent)
├─→ Validates requires field (rejects unknown integrations)
├─→ Validates cron expression
├─→ Creates skill record in database
└─→ If cron provided:
    ├─→ Sets automationEnabled: true
    └─→ Creates automation record with nextRunAt
```

## Components

### 1. Composition Skill: compose-skill
**File:** `skills/compose-skill/SKILL.md`

A filesystem skill that provides:
- List of valid integration names (email, sheets, calendar, ats)
- Valid access levels (read-only, read-write)
- Valid categories
- Complete example of a valid skill
- Validation checklist to verify before submission

### 2. MCP Tool: submit_skill
**File:** `packages/mcp/src/tools/index.ts`

Simplified tool that just submits the skill to the API:

```typescript
server.tool(
  'submit_skill',
  `Submit a skill to Skillomatic.

   IMPORTANT: Load 'compose-skill' first for validation rules and examples.`,
  {
    content: z.string(),      // Full skill markdown with YAML frontmatter
    force: z.boolean(),       // Overwrite existing skill with same slug
    cron: z.string(),         // Optional schedule (e.g., "0 9 * * 1")
  },
  async (args) => { ... }
);
```

### 3. API Client
**File:** `packages/mcp/src/api-client.ts`

Sends the request to the API:

```typescript
async createSkill(content: string, force?: boolean, cron?: string): Promise<SkillPublic>
```

### 4. API Endpoint
**File:** `apps/api/src/routes/skills.ts`

`POST /skills` handler:
- Parses markdown and extracts YAML frontmatter
- Validates required fields (name, description, intent)
- Validates `requires` field - rejects unknown integrations with helpful error
- Validates cron expression using `cron-parser`
- Creates skill record with `automationEnabled` flag
- If cron provided, creates automation record

### 5. Skill Validator
**File:** `apps/api/src/lib/skill-validator.ts`

Server-side validation includes:
- Required fields: name (3-100 chars), description (10-500 chars), intent
- Integration validation: only allows `email`, `sheets`, `calendar`, `ats`
- Access level validation: only allows `read-only`, `read-write`
- Returns helpful errors like: `Unknown integration 'linkedin_scraper'. Valid: email, sheets, calendar, ats`

### 6. Shared Types
**File:** `packages/shared/src/types.ts`

```typescript
interface SkillCreateRequest {
  content: string;
  category?: SkillCategory;
  visibility?: SkillVisibility;
  force?: boolean;
  cron?: string;  // e.g., "0 9 * * 1" for Mondays at 9am
}
```

## Cron Scheduling

When a skill is created with a `cron` parameter:

1. **Validation:** Cron expression is validated using `cron-parser`
2. **Skill Flag:** `automationEnabled` is set to `true` on the skill
3. **Automation Record:** Created in `automations` table with:
   - `skillSlug` pointing to the skill
   - `cronExpression` for scheduling
   - `outputEmail` from user's email (inferred)
   - `nextRunAt` calculated from cron expression
   - `isEnabled: true`

4. **Execution:** The automation worker Lambda runs every minute, checks for automations where `nextRunAt <= now`, executes them via Gemini, and emails results.

### Common Cron Patterns

| Pattern | Meaning |
|---------|---------|
| `0 9 * * *` | Daily at 9am |
| `0 9 * * 1` | Every Monday at 9am |
| `0 9 * * 1-5` | Weekdays at 9am |
| `0 0 1 * *` | First of each month at midnight |
| `*/15 * * * *` | Every 15 minutes |

## Files That Must Stay In Sync

When updating skill submission parameters, update ALL of these files:

| File | What to Update |
|------|----------------|
| `skills/compose-skill/SKILL.md` | Validation rules, valid integrations, examples |
| `packages/shared/src/types.ts` | `SkillCreateRequest` interface |
| `apps/api/src/routes/skills.ts` | POST /skills handler logic |
| `apps/api/src/lib/skill-validator.ts` | `VALID_INTEGRATIONS`, `VALID_ACCESS_LEVELS` |
| `packages/mcp/src/api-client.ts` | `createSkill()` method signature |
| `packages/mcp/src/tools/index.ts` | `submit_skill` tool registration |

Each file has a `SYNC` comment listing the related files.

## Example Conversation

```
User: I need a skill that sends me a weekly summary of new candidates

Claude: Got it - a weekly candidate summary skill. Here's what I have:

- Name: Weekly Candidate Summary
- Description: Summarize new candidates added during the week
- Category: Analytics
- Requires: ATS (read-only)

I still need:
- Instructions: What details should be included? Just counts, or names and roles too?

User: Include candidate names, roles they applied for, and current stage.

Claude: Here's the complete skill:

[Shows skill markdown preview]

Save this skill? Would you also like it to run automatically -
for example, every Monday morning?

User: Yes, run it Monday at 9am

Claude: [Calls submit_skill with cron: "0 9 * * 1"]

Skill "Weekly Candidate Summary" created successfully.
Scheduled: Every Monday at 9am
Results will be emailed to you automatically.
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System architecture
- [Skills and Capabilities](./SKILLS_AND_CAPABILITIES.md) - Skill system details
- [Automations Plan](../future/AUTOMATIONS_EXPLORATION.md) - Automation system design