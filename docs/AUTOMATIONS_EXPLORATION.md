# Automations: Cron Jobs & Event Triggers

> **Purpose**: Exploratory document analyzing how Skillomatic could support automated workflows beyond user-initiated prompts.
>
> **Status**: Exploration / RFC
>
> **Last Updated**: January 2026

---

## Executive Summary

Currently, Skillomatic workflows are **user-initiated**: a recruiter asks Claude to "find React developers" or "draft an email to candidate X." This document explores adding **automation triggers** that run skills without user prompts:

1. **Scheduled (Cron)**: "Every Monday at 9am, generate a pipeline report"
2. **Event-driven (Webhooks)**: "When a candidate moves to 'Interview' stage, send prep materials"
3. **Polling-based**: "Check for new candidates every 15 minutes and notify me"

---

## Part 1: User Perspective

### What Users Want

Based on common recruiting workflows, users would benefit from:

| Automation Type | Example Use Cases |
|-----------------|-------------------|
| **Daily/Weekly Reports** | Pipeline summary every Monday, sourcing activity recap daily |
| **Stage Change Reactions** | Send interview prep when candidate advances, alert hiring manager on offer acceptance |
| **New Candidate Alerts** | Notify when new applicants match criteria, flag high-priority candidates |
| **Calendar-driven** | Pre-meeting candidate briefing 30 min before interview, post-interview follow-up |
| **SLA Monitoring** | Alert if candidate hasn't been contacted in X days, flag stale applications |

### User Experience Vision

#### Setting Up Automations

**Option A: Natural Language Configuration**
```
User: "Every Monday at 9am, send me a summary of my pipeline"
Claude: "I'll set up a weekly automation. Here's what I understood:
         - Trigger: Every Monday at 9:00 AM (America/Los_Angeles)
         - Action: Run 'daily-report' skill
         - Output: Email to you@company.com
         Confirm to activate?"
```

**Option B: UI-based Configuration**
- Web dashboard with automation builder
- Select trigger type (schedule, event, condition)
- Select skill to run
- Configure output destination (email, Slack, in-app notification)
- Set conditions/filters

**Option C: Hybrid**
- Create via natural language in Claude
- Manage/edit via web dashboard
- Both sync to same automation records

#### Managing Automations

Users need to:
- **View** active automations and their status
- **Pause/Resume** automations temporarily
- **Edit** schedules or conditions
- **View History** of past runs and outputs
- **Debug** failed runs (why didn't it fire? what error occurred?)

#### Receiving Automation Output

Where does the output go?
1. **Email** - Most universally accessible, async-friendly
2. **In-app Notification** - If user is on web dashboard
3. **Slack/Teams** - Integrates into existing workflow
4. **Claude Desktop** - Push to their Claude Code inbox (future)
5. **Webhook** - For power users integrating with other systems

### Pricing Considerations

Automations have infrastructure cost (compute, LLM tokens, API calls). Options:
- **Free tier**: Limited automations (e.g., 5 active, daily minimum frequency)
- **Pro tier**: Unlimited automations, minute-level scheduling
- **Per-execution pricing**: Pay per automation run (complexity-based)
- **Bundled with existing tiers**: Part of organization subscription

---

## Part 2: Technical Architecture

### Current State Analysis

Skillomatic currently has:
- **Hono API on Lambda** - Stateless, request-driven
- **No background workers** - Everything is synchronous HTTP
- **SQLite/Turso DB** - No job queue tables
- **EventEmitter for scraping** - `apps/api/src/lib/scrape-events.ts` uses in-memory events
- **Skill execution** - Rendered at download time, executed by Claude client

Key architectural constraint: **Ephemeral architecture** means we avoid storing PII on servers. Automation outputs need careful design to maintain this principle.

### Architecture Options

#### Option 1: AWS EventBridge Scheduler + Lambda

**How it works:**
- User creates automation → Store in `automations` table
- Create corresponding EventBridge schedule via AWS SDK
- Schedule triggers dedicated Lambda function
- Lambda executes skill logic and delivers output

**Pros:**
- Native AWS integration (already using Lambda/SST)
- Highly scalable (millions of schedules)
- Built-in retry policies and DLQ
- Per-execution pricing ($1/million invocations)
- Timezone and DST handling built-in

**Cons:**
- EventBridge schedules must be managed via AWS SDK (more code)
- Minimum 1-minute granularity
- Need to sync DB state with EventBridge state

**Implementation complexity**: Medium

**References:**
- [AWS Lambda EventBridge Scheduling](https://docs.aws.amazon.com/lambda/latest/dg/with-eventbridge-scheduler.html)
- [Serverless Scheduling Architecture](https://aws.amazon.com/blogs/architecture/serverless-scheduling-with-amazon-eventbridge-aws-lambda-and-amazon-dynamodb/)

#### Option 2: Inngest (Event-Driven Workflow Platform)

**How it works:**
- Define functions that respond to events or cron schedules
- Inngest handles queuing, retries, and execution
- HTTP-based invocation works with existing Lambda setup
- Fan-out patterns for event-driven workflows

**Pros:**
- Purpose-built for this exact use case
- Excellent DX with TypeScript SDK
- Built-in step functions (multi-step workflows with retries)
- Works with serverless (no workers to manage)
- Local dev server for testing
- Event-driven core enables webhook → multi-action fan-out

**Cons:**
- Third-party dependency (vendor risk)
- Pricing at scale (free tier: 50k runs/month)
- Another service to monitor

**Implementation complexity**: Low-Medium

**Example code:**
```typescript
import { Inngest } from "inngest";

const inngest = new Inngest({ id: "skillomatic" });

// Scheduled automation
export const weeklyReport = inngest.createFunction(
  { id: "weekly-pipeline-report" },
  { cron: "0 9 * * MON" }, // Every Monday 9am
  async ({ event, step }) => {
    const user = await step.run("get-user", () => getUser(event.data.userId));
    const report = await step.run("generate-report", () =>
      executeSkill("daily-report", user)
    );
    await step.run("send-email", () =>
      sendEmail(user.email, "Weekly Pipeline Report", report)
    );
  }
);

// Event-triggered automation
export const onCandidateStageChange = inngest.createFunction(
  { id: "candidate-stage-change" },
  { event: "ats/candidate.stage.changed" },
  async ({ event, step }) => {
    if (event.data.newStage === "interview") {
      await step.run("send-prep", () =>
        executeSkill("interview-prep", event.data)
      );
    }
  }
);
```

**References:**
- [Inngest Background Jobs](https://www.inngest.com/docs/guides/background-jobs)
- [Inngest Architecture](https://github.com/inngest/inngest)

#### Option 3: Trigger.dev

**How it works:**
- Similar to Inngest but with focus on easier self-hosting
- Define jobs with triggers (cron, event, webhook)
- Execution managed by Trigger.dev cloud or self-hosted

**Pros:**
- Great TypeScript DX
- Can self-host to reduce vendor dependency
- Simpler architecture than Inngest

**Cons:**
- Smaller ecosystem than Inngest
- Less mature event-driven patterns

**Implementation complexity**: Low-Medium

#### Option 4: DIY - EventBridge Tick + DB Queue (Recommended for MVP)

**How it works:**
- Store automations in `automations` table with `nextRunAt`
- EventBridge triggers Lambda every minute (serverless, no persistent worker)
- Lambda queries for due jobs, executes them, updates `nextRunAt`

**Pros:**
- Full control, no external dependencies
- Simple to understand and debug (~200 LOC)
- Works with existing SQLite/Turso
- Fully serverless (no worker to manage)
- Zero additional cost beyond existing Lambda usage

**Cons:**
- Must implement retry logic manually (but it's straightforward)
- No built-in observability (add logging/metrics yourself)
- Scaling: fine for thousands of jobs/day, may need batching at 10k+

**Implementation complexity**: Low-Medium

#### Option 5: Hybrid - EventBridge for Cron + Webhooks for Events

**How it works:**
- Scheduled automations use EventBridge Scheduler
- Event-driven automations receive webhooks from ATS providers
- Unified `automations` table tracks both types

**Pros:**
- Best tool for each job
- Real-time event handling (no polling delay)
- Scales independently

**Cons:**
- Two systems to maintain
- Webhook reliability varies by ATS provider
- Must handle webhook security (HMAC signatures)

**Implementation complexity**: Medium

### Handling ATS Events

ATS providers have varying webhook support:

| Provider | Webhook Support | Events Available |
|----------|-----------------|------------------|
| **Greenhouse** | Good | Candidate created, stage changed, offer extended, hired |
| **Lever** | Good | Similar to Greenhouse |
| **Ashby** | Limited | Fewer event types |
| **Workable** | Basic | Application created |
| **Zoho Recruit** | Variable | Depends on plan |

**Webhook Implementation Pattern:**
```typescript
// apps/api/src/routes/webhooks/ats.ts
app.post('/webhooks/ats/:provider', async (c) => {
  const provider = c.req.param('provider');
  const signature = c.req.header('X-Webhook-Signature');
  const payload = await c.req.json();

  // Verify webhook authenticity
  if (!verifyWebhookSignature(provider, signature, payload)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Normalize event across providers
  const event = normalizeATSEvent(provider, payload);

  // Find matching automations
  const automations = await findAutomationsForEvent(event);

  // Queue executions (don't block webhook response)
  await queueAutomationRuns(automations, event);

  return c.json({ received: true });
});
```

**Fallback: Virtual Webhooks via Polling**

For providers with poor webhook support, implement "virtual webhooks":
- Poll ATS API periodically (every 5-15 minutes)
- Compare with last known state
- Generate synthetic events for changes
- Same downstream automation triggers

This matches patterns used by [Merge.dev](https://www.merge.dev/blog/webhooks-vs-polling) and [unified.to](https://unified.to/blog/polling_vs_webhooks_when_to_use_one_over_the_other).

### Database Schema Changes

```typescript
// packages/db/src/schema.ts

export const automations = sqliteTable('automations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  organizationId: text('organization_id').references(() => organizations.id),

  // What to run
  name: text('name').notNull(),
  skillSlug: text('skill_slug').notNull().references(() => skills.slug),
  skillParams: text('skill_params'), // JSON - parameters to pass to skill

  // Trigger configuration
  triggerType: text('trigger_type').notNull(), // 'cron' | 'event' | 'poll'
  cronExpression: text('cron_expression'), // "0 9 * * MON"
  cronTimezone: text('cron_timezone').default('UTC'),
  eventType: text('event_type'), // "ats.candidate.stage_changed"
  eventFilter: text('event_filter'), // JSON - conditions to match
  pollIntervalMinutes: integer('poll_interval_minutes'),

  // Output configuration
  outputDestination: text('output_destination').notNull(), // 'email' | 'slack' | 'webhook'
  outputConfig: text('output_config'), // JSON - email address, webhook URL, etc.

  // State
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),

  // External IDs (for EventBridge, Inngest, etc.)
  externalScheduleId: text('external_schedule_id'),

  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const automationRuns = sqliteTable('automation_runs', {
  id: text('id').primaryKey(),
  automationId: text('automation_id').notNull().references(() => automations.id),

  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  triggeredBy: text('triggered_by').notNull(), // 'schedule' | 'event' | 'manual'
  triggerData: text('trigger_data'), // JSON - event payload or schedule info

  // Execution details
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),

  // Output (ephemeral - consider TTL cleanup)
  outputSummary: text('output_summary'), // Brief summary, no PII
  errorCode: text('error_code'),

  // For debugging
  retryCount: integer('retry_count').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }),
});
```

### Ephemeral Architecture Considerations

Challenge: Automations produce outputs, but we avoid storing PII.

**Solutions:**
1. **Email delivery** - Output goes directly to user's email, not stored
2. **Output TTL** - Store summaries briefly (24h) for debugging, then delete
3. **Client-side storage** - Push to user's Claude Desktop inbox (future)
4. **Output hash** - Store hash of output for deduplication, not content

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMATION EXECUTION FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRIGGER                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ EventBridge  │  │ ATS Webhook  │  │ Poll Worker  │              │
│  │  (cron)      │  │  (event)     │  │  (interval)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         └────────────┬────┴─────────────────┘                       │
│                      │                                              │
│                      ▼                                              │
│  QUEUE         ┌──────────────┐                                     │
│                │ Inngest /    │                                     │
│                │ SQS Queue    │                                     │
│                └──────┬───────┘                                     │
│                       │                                             │
│                       ▼                                             │
│  EXECUTE       ┌──────────────┐                                     │
│                │ Automation   │                                     │
│                │ Lambda       │                                     │
│                └──────┬───────┘                                     │
│                       │                                             │
│         ┌─────────────┼─────────────┐                               │
│         │             │             │                               │
│         ▼             ▼             ▼                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ Get OAuth│  │ Execute  │  │ Deliver  │                          │
│  │ Token    │  │ Skill    │  │ Output   │                          │
│  │ (Nango)  │  │ Logic    │  │ (Email)  │                          │
│  └──────────┘  └──────────┘  └──────────┘                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Skill Execution Without Claude

Current skills are Claude Code prompts. For server-side automation, we need:

**Option A: Server-side LLM Call**
- Automation Lambda calls Anthropic/OpenAI API directly
- Pass skill instructions as system prompt
- Execute tool calls server-side

**Pros:** Works today, uses existing LLM infrastructure
**Cons:** Token costs, latency, may produce variable output

**Option B: Deterministic Skill Variants**
- Create "automation mode" versions of skills
- No LLM interpretation, direct API calls
- Structured output templates

**Pros:** Fast, predictable, cheap
**Cons:** Less flexible, must maintain two versions

**Option C: Hybrid**
- Simple skills run deterministically
- Complex skills use LLM
- Flag in skill frontmatter: `automationMode: 'deterministic' | 'llm'`

### Recommended Architecture

**Start with DIY: Lambda + EventBridge + DB Queue**

At Skillomatic's current scale, a simple homegrown solution is the right call:

```typescript
// apps/api/src/jobs/automation-worker.ts
// Triggered by EventBridge every minute

export async function processAutomationQueue() {
  const dueJobs = await db
    .select()
    .from(automations)
    .where(and(
      eq(automations.isEnabled, true),
      lte(automations.nextRunAt, new Date())
    ))
    .limit(50); // Process in batches

  for (const job of dueJobs) {
    try {
      // Mark as running (prevent duplicate pickup)
      await db.update(automations)
        .set({ status: 'running' })
        .where(eq(automations.id, job.id));

      // Execute the skill
      const result = await executeAutomation(job);

      // Log success, schedule next run
      await db.update(automations)
        .set({
          status: 'idle',
          lastRunAt: new Date(),
          nextRunAt: calculateNextRun(job.cronExpression, job.cronTimezone),
          consecutiveFailures: 0,
        })
        .where(eq(automations.id, job.id));

      await logAutomationRun(job.id, 'completed', result);

    } catch (err) {
      // Retry logic: exponential backoff, max 3 attempts
      const failures = job.consecutiveFailures + 1;
      const backoffMinutes = Math.min(Math.pow(2, failures), 60);

      await db.update(automations)
        .set({
          status: failures >= 3 ? 'failed' : 'idle',
          consecutiveFailures: failures,
          nextRunAt: failures < 3
            ? new Date(Date.now() + backoffMinutes * 60 * 1000)
            : job.nextRunAt, // Don't reschedule if max retries hit
        })
        .where(eq(automations.id, job.id));

      await logAutomationRun(job.id, 'failed', null, err.message);
    }
  }
}
```

**Why DIY first:**
1. **~200 lines of code** - Not complex
2. **No vendor dependency** - Full control
3. **No extra cost** - Just Lambda invocations you're already paying for
4. **Good enough** - Handles cron + basic retries for 90% of use cases
5. **Easy to understand** - New devs can grok it immediately

**EventBridge schedule (in SST):**
```typescript
// sst.config.ts
new Cron(stack, "AutomationWorker", {
  schedule: "rate(1 minute)",
  job: "apps/api/src/jobs/automation-worker.handler",
});
```

**Graduate to Inngest/Trigger.dev when you need:**
- Multi-step workflows with partial failure recovery
- Concurrency control ("max 5 running")
- Rate limiting ("max 100 ATS calls/min")
- Visual debugging/observability
- Event fan-out (one event → many actions)

### Observability

For MVP, use existing infrastructure:
- **CloudWatch Logs** - Lambda execution logs, errors
- **`/status` endpoint** - Public health check (already implemented)
- **`automationRuns` table** - Query for failure rates, stuck jobs

Add dedicated monitoring later if needed. See `apps/api/src/routes/status.ts` for extending the status endpoint.

### Implementation Phases

### Phase 1: Scheduled Automations (MVP)
- Add `automations` and `automationRuns` tables
- EventBridge 1-minute tick → Lambda worker
- Support cron-triggered skills (daily report, weekly summary)
- Email output delivery via SES
- Basic web UI for creating/managing automations

### Phase 2: Event-Driven Automations
- Implement ATS webhook receivers (`/webhooks/ats/:provider`)
- Normalize events across providers
- Event → automation matching
- Polling fallback for providers without webhooks

### Phase 3: Advanced Features (Consider Inngest Here)
- Slack/Teams output channels
- Multi-step workflows
- Conditional logic (if/then automation rules)
- Automation templates library
- Usage analytics and cost tracking

---

## Part 3: Comparison to Existing Tools

### How Zapier/Make/n8n Work

| Platform | Trigger Model | Execution Model | Pricing |
|----------|---------------|-----------------|---------|
| **Zapier** | Polling (most), webhooks (premium) | Linear, cloud-only | Per-task |
| **Make** | Webhooks + polling | Visual canvas, branching | Per-operation |
| **n8n** | Webhooks + cron | Node-based, self-hostable | Per-execution |

Skillomatic automations would be **simpler and more focused**:
- Domain-specific to recruiting workflows
- LLM-powered interpretation where needed
- Integrated with existing skill ecosystem
- Not a general-purpose automation platform

### Competitive Differentiation

vs. Zapier/Make:
- Recruiting-native (understands ATS concepts)
- LLM-enhanced (can interpret, summarize, draft)
- Part of existing Skillomatic workflow

vs. ATS built-in automations (Greenhouse, Lever):
- Cross-ATS compatibility
- More flexible skill execution
- Claude intelligence layer

---

## Open Questions

1. **Billing model** - Per-automation, per-run, or bundled?
2. **LLM costs** - Who pays for automation LLM calls? Markup or pass-through?
3. **Output storage** - How long to retain run history? PII implications?
4. **Multi-org** - Can org admins create automations for all users?
5. **Approval workflows** - Should some automations require admin approval?
6. **Rate limits** - How to prevent runaway automations?
7. **Testing** - How do users test automations before going live?

---

## Next Steps

1. **Validate with users** - Do recruiting teams want this? Which use cases resonate?
2. **Prototype Inngest integration** - Spike a simple cron → skill → email flow
3. **Survey ATS webhook capabilities** - Document what each provider supports
4. **Design automation UI** - Wireframes for creation/management
5. **Cost modeling** - Estimate infrastructure cost at various scales

---

## References

### AWS & Serverless
- [AWS EventBridge Scheduler Docs](https://docs.aws.amazon.com/lambda/latest/dg/with-eventbridge-scheduler.html)
- [Serverless Scheduling Architecture (AWS Blog)](https://aws.amazon.com/blogs/architecture/serverless-scheduling-with-amazon-eventbridge-aws-lambda-and-amazon-dynamodb/)
- [EventBridge Scheduler Best Practices](https://codewithmukesh.com/blog/schedule-aws-lambda-with-amazon-eventbridge-scheduler/)

### Workflow Orchestration
- [Inngest Documentation](https://www.inngest.com/docs/guides/background-jobs)
- [Inngest vs Temporal vs Trigger.dev](https://medium.com/@matthieumordrel/the-ultimate-guide-to-typescript-orchestration-temporal-vs-trigger-dev-vs-inngest-and-beyond-29e1147c8f2d)
- [Trigger.dev](https://trigger.dev/)

### Webhooks & Event-Driven
- [Webhooks in Event-Driven Architecture](https://hyscaler.com/insights/unpacking-power-of-webhooks/)
- [Red Hat: What is a Webhook?](https://www.redhat.com/en/topics/automation/what-is-a-webhook)
- [Polling vs Webhooks (Merge.dev)](https://www.merge.dev/blog/webhooks-vs-polling)
- [Polling vs Webhooks (unified.to)](https://unified.to/blog/polling_vs_webhooks_when_to_use_one_over_the_other)

### Automation Platforms
- [n8n vs Zapier vs Make Comparison](https://www.digidop.com/blog/n8n-vs-make-vs-zapier)
- [Outgrowing Zapier for AI Agents](https://composio.dev/blog/outgrowing-make-zapier-n8n-ai-agents)
