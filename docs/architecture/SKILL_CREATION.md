# Skill Creation Architecture

This document describes how skills are created through chat and optionally scheduled via cron.

## Overview

Skills are created through a conversational interface. The Skill Builder skill guides users through defining their skill, then calls the `create_skill` MCP tool to persist it. Optionally, skills can be scheduled to run automatically with results emailed to the user.

## Data Flow

```
User describes skill in chat
        ↓
Skill Builder skill extracts requirements
        ↓
Generates skill markdown with YAML frontmatter
        ↓
Asks user to confirm (and optionally schedule)
        ↓
Calls create_skill MCP tool
        ↓
POST /skills API endpoint
        ↓
├─→ Validates markdown and cron expression
├─→ Creates skill record in database
└─→ If cron provided:
    ├─→ Sets automationEnabled: true
    └─→ Creates automation record with nextRunAt
```

## Components

### 1. Skill Builder Skill
**File:** `skills/skill-builder/SKILL.md`

The non-deterministic prompt that guides the LLM through skill creation:
- Extracts skill details from natural language descriptions
- Identifies missing required fields (name, description, instructions)
- Generates skill markdown with proper YAML frontmatter
- Asks if user wants to schedule the skill
- Calls `create_skill` action with optional `cron` parameter

### 2. MCP Tool: create_skill
**File:** `packages/mcp/src/tools/index.ts`

Registered MCP tool that Claude calls to create skills:

```typescript
server.tool(
  'create_skill',
  'Create or update a skill...',
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
- Validates cron expression using `cron-parser`
- Creates skill record with `automationEnabled` flag
- If cron provided, creates automation record with:
  - `outputEmail` inferred from user's email
  - `nextRunAt` calculated from cron expression
  - `cronTimezone` defaulting to UTC

### 5. Shared Types
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

When updating `create_skill` parameters, update ALL of these files:

| File | What to Update |
|------|----------------|
| `packages/shared/src/types.ts` | `SkillCreateRequest` interface |
| `apps/api/src/routes/skills.ts` | POST /skills handler logic |
| `packages/mcp/src/api-client.ts` | `createSkill()` method signature |
| `packages/mcp/src/tools/index.ts` | `create_skill` tool registration |
| `skills/skill-builder/SKILL.md` | Skill builder instructions |

Each file has a `SYNC` comment listing the related files.

## Example Conversation

```
User: I need a skill that sends me a weekly summary of new candidates

Skill Builder: Got it - a weekly candidate summary skill. Here's what I have:

- Name: Weekly Candidate Summary
- Description: Summarize new candidates added during the week
- Category: Analytics
- Requires: ATS (read-only)

I still need:
- Instructions: What details should be included? Just counts, or names and roles too?

User: Include candidate names, roles they applied for, and current stage.

Skill Builder: Here's the complete skill:

[Shows skill markdown preview]

Save this skill? Would you also like it to run automatically -
for example, every Monday morning?

User: Yes, run it Monday at 9am

Skill Builder: [Calls create_skill with cron: "0 9 * * 1"]

Skill "Weekly Candidate Summary" created successfully.
Scheduled: Every Monday at 9am
Results will be emailed to you automatically.
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System architecture
- [Skills and Capabilities](./SKILLS_AND_CAPABILITIES.md) - Skill system details
- [Automations Plan](../future/AUTOMATIONS_EXPLORATION.md) - Automation system design