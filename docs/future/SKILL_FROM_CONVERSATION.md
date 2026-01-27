# Create Skill from Conversation Feature

## Overview

Users can create skills from chat conversations using a **meta-skill approach** - no new UI, just the existing skill-builder skill enhanced to work with conversation context.

## How It Works

1. User has a productive conversation (sourcing, outreach, etc.)
2. User says: "save this as a skill" or "turn this into a skill"
3. LLM recognizes intent, loads `skill-builder` skill
4. Skill-builder analyzes conversation (already in LLM context), extracts workflow pattern
5. Generates skill YAML, asks user for confirmation
6. Saves via `create_skill` action/tool

## Architecture

### Module 1: `skill-builder` skill (Intelligence)
- Conversational elicitation and skill design
- Works with conversation context already in LLM context
- Drafts skill structure, iterates with user
- Produces final skill YAML
- Calls `create_skill` to save

### Module 2: `create_skill` action/tool (Mechanics)
- Deterministic tool that upserts skills via API
- Takes `content` (markdown with YAML frontmatter)
- Optional `force` boolean to overwrite existing slug
- Works on both web chat and MCP/Claude Desktop

## Platform Support

| Platform | Conversation Access | create_skill |
|----------|---------------------|--------------|
| Web chat | Already in LLM context | action in action-executor.ts |
| MCP/Claude Desktop | Already in LLM context | tool in MCP server |

No separate "get conversation history" action needed - the LLM always has the current conversation in context.

## Files Involved

| File | Purpose |
|------|---------|
| `apps/web/src/lib/action-executor.ts` | `create_skill` action for web |
| `apps/web/src/lib/skills-client.ts` | System prompt with action |
| `apps/api/src/routes/skills.ts` | POST /skills with `force` upsert |
| `packages/shared/src/types.ts` | `SkillCreateRequest` type |
| `packages/mcp/src/tools/index.ts` | `create_skill` tool for MCP |
| `packages/mcp/src/api-client.ts` | `createSkill` client method |
| `skills/skill-builder/SKILL.md` | Skill with conversation-aware instructions |

## Example User Flow

```
User: [productive conversation finding React developers, checking GitHub, drafting outreach]

User: "save this as a skill"

LLM: Based on this conversation, I see you searched for React developers,
     enriched profiles with GitHub data, and drafted personalized outreach.
     Here's a skill that captures this workflow:

     ---
     name: GitHub-Enriched Sourcing
     description: Find developers matching criteria and enrich with GitHub contributions
     category: Sourcing
     ...
     ---

     Save this, or want to adjust anything?

User: looks good, save it

LLM: [calls create_skill action]

LLM: Done! Skill "GitHub-Enriched Sourcing" created.
     Find it under My Skills on the Skills page.
```

## Benefits

- **No new UI** - uses existing chat interface
- **LLM-powered extraction** - smarter than manual form filling
- **Conversational refinement** - iterate via chat before saving
- **Works everywhere** - same flow on web and Claude Desktop