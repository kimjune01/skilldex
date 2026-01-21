# Skill-O-Matic: Vision Beyond Recruiting

## The Core Insight

Skill-O-Matic isn't a recruiting tool. It's a **natural language interface to enterprise workflows**.

The recruiting use case validates the platform. But the real value proposition—eliminating tool-switching through conversational AI—applies to any knowledge worker juggling multiple SaaS applications.

Every team has the same problem recruiters have:
- Sales reps switch between CRM, email, LinkedIn, and calendars
- IT ops toggle between ticketing, monitoring, and deployment tools
- Marketing teams bounce between analytics, content calendars, and social platforms
- Customer success manages CRM, support tickets, and health dashboards

**One skill architecture. Unlimited verticals.**

---

## Why This Architecture Scales

### 1. Skills Are Vertical-Agnostic

A skill is just: instructions + required integrations + template variables.

| Recruiting Skill | Sales Equivalent | IT Equivalent |
|------------------|------------------|---------------|
| `ats-candidate-search` | `crm-lead-search` | `ticket-search` |
| `linkedin-lookup` | `linkedin-sales-navigator` | `user-lookup` |
| `email-draft` | `email-sequence-draft` | `incident-response-draft` |
| `interview-scheduler` | `meeting-scheduler` | `oncall-handoff` |
| `daily-report` | `pipeline-report` | `ops-dashboard` |

Same patterns, different APIs.

### 2. Integrations Are Reusable

Nango already supports 200+ OAuth providers. Adding a new vertical means:
- Enable the relevant providers (Salesforce, Jira, HubSpot, etc.)
- Write skill templates that reference them
- Done

No new infrastructure. No new auth flows.

### 3. Ephemeral Architecture Wins Everywhere

Every enterprise buyer asks: "Where does our data go?"

Our answer—"It doesn't. LLM calls run client-side. We can't see your data."—works for:
- **Recruiting**: Candidate PII stays in browser
- **Sales**: Pipeline and prospect data stays in browser
- **IT**: Incident details and credentials stay in browser
- **Finance**: Revenue numbers stay in browser

Compliance is a feature, not a limitation.

### 4. Multi-Tenant by Design

Each organization already has:
- Isolated database
- Own OAuth credentials
- Own LLM API keys
- Role-based skill access

Expansion doesn't require architectural changes—just content.

---

## Ephemeral Architecture: Cross-Vertical Compatibility

The ephemeral architecture was designed for recruiting, but the core principles apply broadly. Here's a detailed analysis of how it maps to other verticals.

### How Ephemeral Works (Quick Recap)

1. **Skills rendered server-side** with credentials embedded as `{{TEMPLATE_VARS}}`
2. **LLM calls from browser** → directly to Anthropic/OpenAI (no server intermediary)
3. **API calls through stateless proxy** → server forwards requests but stores nothing
4. **Scrape results in IndexedDB** → client-side only, 24-hour TTL

**The promise**: "Your data never touches our servers."

### Compatibility Matrix

| Vertical | Ephemeral Compatible? | CORS Proxy Needed? | Notes |
|----------|----------------------|-------------------|-------|
| **Recruiting** | ✅ Yes | Yes (ATS APIs) | Current implementation |
| **Sales** | ✅ Yes | Yes (Salesforce, HubSpot) | Same pattern as ATS |
| **Customer Success** | ✅ Yes | Yes (Gainsight, Zendesk) | Same pattern |
| **Marketing** | ✅ Yes | Partial (some GA client support) | Lower sensitivity |
| **IT/DevOps** | ⚠️ Yes, with caveats | Yes (Jira, PagerDuty, Datadog) | Higher credential risk |
| **Legal** | ⚠️ Depends | Yes | May need audit trails |
| **Finance** | ⚠️ Depends | Yes | May need audit trails |

### The CORS Reality

Enterprise APIs don't support browser CORS. This isn't unique to ATS—it's universal:

| API | Browser CORS? | Why Not |
|-----|---------------|---------|
| Greenhouse/Lever | ❌ No | Basic Auth exposes keys |
| Salesforce | ❌ No | OAuth, but no CORS headers |
| Jira | ❌ No | Enterprise security model |
| PagerDuty | ❌ No | API key auth |
| Datadog | ❌ No | API key auth |
| AWS | ❌ No | SigV4 signing not browser-safe |

**Implication**: The server-side proxy pattern is required for ALL verticals, not just recruiting.

**This is fine.** The proxy is stateless—it forwards requests without logging or storing payloads. Ephemeral goals are still achieved:
- No PII persists on Skill-O-Matic servers
- User's browser holds the data
- We can't be breached for data we don't have

### Credential Sensitivity Tiers

Not all credentials carry the same risk when embedded in browser-rendered skills:

| Tier | Credential Type | Risk if Leaked | Examples |
|------|----------------|----------------|----------|
| **Low** | Read-only API keys | Data exposure (limited scope) | GA read-only, public API keys |
| **Medium** | OAuth tokens (scoped) | Data exposure (user's data) | ATS tokens, Salesforce OAuth, HubSpot |
| **High** | OAuth tokens (admin) | Org-wide data exposure | Salesforce admin, Jira admin |
| **Critical** | Infrastructure credentials | System compromise | AWS keys, GCP service accounts, Datadog |

**Current recruiting model**: Medium tier (ATS tokens expose candidate data for that user).

**Sales/CS expansion**: Same tier—Salesforce OAuth tokens are scoped to user.

**IT/DevOps expansion**: Higher tier—AWS credentials or Datadog API keys can expose logs, infrastructure.

#### Mitigation Strategies

1. **Document credential scoping**: Guide org admins to create minimal-permission credentials
   - "Create a read-only Datadog API key for log search"
   - "Use an IAM role with only `ec2:Describe*` permissions"

2. **Credential tier warnings in admin UI**:
   ```
   ⚠️ This integration uses infrastructure credentials.
   Ensure you've configured minimal permissions.
   [View security best practices]
   ```

3. **Role-based skill access**: High-risk skills (e.g., `deployment-trigger`) only available to specific roles

### LLM Provider Considerations

"Ephemeral" means Skill-O-Matic doesn't store PII. But the LLM provider processes it.

| Data Type | Seen by LLM? | Vertical |
|-----------|--------------|----------|
| Candidate profiles | Yes | Recruiting |
| Sales pipeline | Yes | Sales |
| Customer records | Yes | CS |
| Log output | Yes | IT/DevOps |
| Contract text | Yes | Legal |

**This is inherent to the product**—we're using LLMs to process business data.

#### Enterprise Compliance Positioning

For enterprise buyers, document:

| Provider | Compliance | Zero Retention | Link |
|----------|------------|----------------|------|
| Anthropic | SOC2 Type II, HIPAA eligible | Yes (API) | [Trust Center](https://www.anthropic.com/trust) |
| OpenAI | SOC2 Type II | Yes (API, with opt-out) | [Enterprise](https://openai.com/enterprise) |

**Talking point**: "Your data flows to your LLM provider (Anthropic/OpenAI), which you already trust. Skill-O-Matic never stores or accesses it."

### The Audit Trail Question

Ephemeral's selling point—"we can't see your data"—can be a **problem** for regulated industries:

| Industry | Regulation | Audit Requirement |
|----------|------------|-------------------|
| Finance | SOX | Action logs with timestamps |
| Healthcare | HIPAA | Access logs for PHI |
| Legal | E-discovery | Searchable records |

**Solution: LLM-Level Audit Trails**

Rather than building audit logging into Skill-O-Matic (which would weaken the ephemeral pitch), leverage the LLM provider's existing logging capabilities.

#### How It Works

Anthropic and OpenAI both support user metadata on API requests:

```typescript
// Anthropic
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [...],
  metadata: {
    user_id: "user_123",    // Tracked in Anthropic logs
  }
});

// OpenAI
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [...],
  user: "user_123",         // Tracked in OpenAI logs
});
```

#### What LLM Logs Capture

| Data Point | Captured? | Notes |
|------------|-----------|-------|
| User ID | ✅ | Passed via `metadata.user_id` |
| Timestamp | ✅ | Automatic |
| Full conversation | ✅ | Includes skill instructions + user queries |
| Actions taken | ✅ | Visible in LLM responses |
| Data accessed | ✅ | Part of conversation context |

This is **more comprehensive** than action-level logging—it's the complete audit trail.

#### Implementation for Skill-O-Matic

```typescript
// In apps/web/src/lib/llm-client.ts
async function streamChat(messages, systemPrompt, config) {
  return anthropic.messages.create({
    model: config.model,
    system: systemPrompt,
    messages,
    metadata: {
      user_id: config.userId,      // For audit filtering
      org_id: config.orgId,        // For multi-tenant logs
    },
    stream: true,
  });
}
```

**Skill-O-Matic stays fully ephemeral.** Audit trails live with the LLM provider.

#### Enterprise Compliance Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Compliance Officer needs audit trail                         │
│                                                              │
│ 1. Log into LLM provider console (Anthropic/OpenAI)         │
│ 2. Filter by user_id or org_id                              │
│ 3. Export conversation logs for audit period                │
│ 4. Full record of who accessed what, when                   │
└─────────────────────────────────────────────────────────────┘
```

#### Why This Is Better

| Aspect | Skill-O-Matic Audit | LLM-Level Audit |
|--------|---------------------|-----------------|
| Skillomatic stays ephemeral | ❌ Weakened | ✅ Fully preserved |
| New infrastructure needed | Yes | None |
| Audit completeness | Action metadata only | Full conversations |
| Compliance relationship | New (with Skillomatic) | Existing (with LLM provider) |
| Data residency control | Skillomatic servers | LLM provider (org's choice) |

**Talking point for regulated industries**: "Audit trails are maintained by your LLM provider, which you already have a compliance relationship with. Export logs from their console for SOX/HIPAA audits. We pass user identifiers so you can filter by user."

### Vertical-Specific Considerations

#### Sales (Low friction)
- **Credential risk**: Medium (same as ATS)
- **Audit needs**: Low (sales teams rarely audited)
- **Verdict**: Drop-in compatible, no changes needed

#### Customer Success (Low friction)
- **Credential risk**: Medium
- **Audit needs**: Low
- **Verdict**: Drop-in compatible

#### IT/DevOps (Medium friction)
- **Credential risk**: High (infrastructure access)
- **Audit needs**: Medium (incident postmortems reference actions)
- **Mitigations needed**:
  - Document minimal-permission credential setup
  - Consider read-only skills first (log search, status checks)
  - Write operations (incident create, deploy) require explicit org opt-in

#### Marketing (Low friction)
- **Credential risk**: Low (mostly analytics, read-only)
- **Audit needs**: None
- **Verdict**: Easiest expansion, lower sensitivity than recruiting

#### Legal/Finance (Medium friction)
- **Credential risk**: High
- **Audit needs**: High (regulatory requirement)
- **Mitigations needed**:
  - Document LLM-level audit trail export process
  - Ensure org uses LLM provider with appropriate compliance (Anthropic SOC2, HIPAA BAA)
  - Longer sales cycles expected
- **No Skill-O-Matic changes needed**—audit handled at LLM layer

### Summary: What's Needed for Each Tier

| Vertical Tier | Architecture Changes | Documentation Needed |
|---------------|---------------------|---------------------|
| **Tier 1** (Sales, CS) | None | Vertical-specific skill guides |
| **Tier 2** (IT/DevOps, Marketing) | None | Credential scoping guide, risk acknowledgment |
| **Tier 3** (Legal, Finance) | None | LLM audit trail guide, compliance positioning |

**Key insight**: No architecture changes needed for any tier. Audit requirements handled at LLM provider level.

### Bottom Line

The ephemeral architecture is **compatible with all target verticals**. The concerns are business/compliance, not technical:

1. **Credential sensitivity varies** → Document scoping, warn on high-risk integrations
2. **LLM sees everything** → Point to provider compliance (SOC2, HIPAA BAAs)
3. **Some buyers want audits** → Handled at LLM provider level (no Skill-O-Matic changes)

Expansion to **all tiers requires zero architectural changes**. Skill-O-Matic passes user metadata to LLM providers; regulated industries export audit logs from Anthropic/OpenAI directly.

---

## Target Expansion Verticals

### Tier 1: High Affinity (Similar Workflows to Recruiting)

#### Sales Development Representatives (SDRs)

**Pain point**: SDRs spend 60%+ of their time on research and data entry, not selling.

**Skills to build**:
| Skill | Description |
|-------|-------------|
| `crm-lead-search` | Search Salesforce/HubSpot with natural language |
| `linkedin-sales-nav` | Research prospects on LinkedIn Sales Navigator |
| `lead-enrichment` | Pull company/contact data from Clearbit, ZoomInfo |
| `email-sequence-draft` | Generate personalized cold outreach sequences |
| `meeting-prep` | Summarize all context on a prospect before a call |
| `activity-logger` | Log calls, emails, and meetings without manual entry |
| `pipeline-report` | Generate daily/weekly pipeline summary |

**Integrations needed**: Salesforce, HubSpot, LinkedIn Sales Navigator, Outreach/Salesloft, Clearbit, Gong

**GTM angle**: "10x your SDR team without 10x headcount"

**Example use case**: "Write a personalized cold email to the VP of Engineering at Acme Corp based on their recent funding round"
- **Data source**: LinkedIn Sales Navigator (prospect profile), Clearbit (company data), Google News (funding announcement)
- **Data sink**: Outreach (email sequence draft saved to campaign)

**Why high affinity**: SDRs and recruiters have nearly identical workflows—research, outreach, tracking. Same persona (young, tech-comfortable, quota-driven).

---

#### Customer Success Managers (CSMs)

**Pain point**: CSMs juggle CRM, support tickets, product analytics, and health scores across multiple tools.

**Skills to build**:
| Skill | Description |
|-------|-------------|
| `account-health-check` | Aggregate health signals from multiple sources |
| `ticket-summary` | Summarize recent support tickets for an account |
| `usage-trends` | Pull product usage metrics for account reviews |
| `renewal-prep` | Generate talking points for upcoming renewals |
| `escalation-draft` | Draft internal escalation with context |
| `qbr-generator` | Generate quarterly business review deck outline |
| `churn-risk-alert` | Daily digest of accounts with declining health |

**Integrations needed**: Salesforce, Gainsight/ChurnZero, Zendesk/Intercom, Mixpanel/Amplitude, Google Slides

**GTM angle**: "See the full customer picture without opening 6 tabs"

**Example use case**: "Prepare a renewal summary for TechStart Inc including their support ticket trends and product usage over the last quarter"
- **Data source**: Salesforce (account details, contract dates), Zendesk (support tickets), Mixpanel (product usage analytics)
- **Data sink**: Google Slides (QBR deck outline), Salesforce (renewal notes added to opportunity)

---

### Tier 2: Adjacent (Different Workflow, Same Buyer)

#### IT Operations / DevOps

**Pain point**: On-call engineers switch between monitoring, ticketing, runbooks, and deployment tools during incidents.

**Skills to build**:
| Skill | Description |
|-------|-------------|
| `incident-create` | Create PagerDuty/OpsGenie incident with context |
| `runbook-lookup` | Find relevant runbook for current incident |
| `service-status` | Check health of specific services across tools |
| `deployment-status` | Check recent deployments for a service |
| `log-search` | Search Datadog/Splunk logs with natural language |
| `postmortem-draft` | Generate incident postmortem template |
| `oncall-handoff` | Generate handoff summary for shift change |

**Integrations needed**: PagerDuty, Jira, Datadog, AWS/GCP, GitHub, Slack

**GTM angle**: "Resolve incidents faster with everything in one place"

**Example use case**: "The payments service is throwing 500 errors—find the relevant runbook and check if there were any recent deployments"
- **Data source**: Datadog (error logs, service health), GitHub (recent deployments), Confluence (runbook search)
- **Data sink**: PagerDuty (incident created with context), Slack (status update posted to #incidents channel)

**Why adjacent**: Different persona (engineers vs. recruiters) but sells to the same companies. IT teams in companies using Skill-O-Matic for recruiting are natural expansion targets.

---

#### Marketing Operations

**Pain point**: Marketers context-switch between analytics, content tools, social platforms, and project management.

**Skills to build**:
| Skill | Description |
|-------|-------------|
| `analytics-summary` | Pull key metrics from GA, Mixpanel, HubSpot |
| `content-calendar-check` | Review upcoming content schedule |
| `social-draft` | Draft posts for LinkedIn, Twitter, etc. |
| `competitor-monitor` | Summarize competitor activity from news/social |
| `campaign-performance` | Pull performance metrics for active campaigns |
| `seo-audit` | Check rankings and opportunities for keywords |
| `blog-outline` | Generate content outlines based on research |

**Integrations needed**: Google Analytics, HubSpot, Buffer/Hootsuite, SEMrush/Ahrefs, Notion, WordPress

**GTM angle**: "Execute marketing campaigns without tab fatigue"

**Example use case**: "How did our product launch blog post perform last week? Draft a LinkedIn post highlighting the key stats"
- **Data source**: Google Analytics (page views, time on page, referral sources), HubSpot (form submissions, lead attribution)
- **Data sink**: Buffer (LinkedIn post draft scheduled), Notion (performance summary added to campaign tracker)

---

### Tier 3: Longer-Term (Requires More Product Work)

#### Legal / Compliance

**Skills**: Document search, contract clause lookup, compliance checklist, audit trail generator

**Blockers**:
- High security requirements
- Specialized integrations (Relativity, iManage)
- Longer sales cycles

**Audit requirements**: Handled at LLM level—no Skill-O-Matic changes needed. Document how to export conversation logs from Anthropic/OpenAI for e-discovery.

**Example use case**: "Find all contracts with TechCorp that mention data retention clauses and flag any that expire in the next 90 days"
- **Data source**: iManage (contract document search), Salesforce (account and contract metadata)
- **Data sink**: Relativity (flagged clauses added to review set), Email (summary sent to legal team)

---

#### Finance / FP&A

**Skills**: Report generator, variance analysis, forecast update, budget vs. actual

**Blockers**:
- Extremely sensitive data
- Legacy ERP integrations (SAP, Oracle)
- Longer enterprise sales cycles

**SOX audit requirements**: Handled at LLM level. Org must use LLM provider with appropriate compliance certifications. Document audit log export process.

**Example use case**: "Generate a variance analysis for Q3 marketing spend vs. budget and highlight any line items over 10%"
- **Data source**: NetSuite (actuals by GL code), Adaptive Planning (budget figures), Google Sheets (department allocations)
- **Data sink**: Google Slides (variance chart for CFO deck), Slack (summary posted to #finance-alerts)

---

## The Platform Play

### From Recruiting Tool to Skills Marketplace

**Phase 1: Recruiting** (Now)
- Validate core platform
- Prove ROI with one vertical
- Build reference customers

**Phase 2: Horizontal Expansion** (Next)
- Add Sales and Customer Success skills
- Sell to existing customers ("You love this for recruiting—want it for sales?")
- Maintain single platform, multiple skill sets

**Phase 3: Skills Marketplace** (Future)
- Allow third-party skill creation
- Enable consulting partners to build industry-specific skills
- Skill-O-Matic becomes "App Store for enterprise Claude workflows"

### Revenue Implications

| Model | Recruiting Only | Multi-Vertical |
|-------|----------------|----------------|
| **Addressable users** | ~500K technical recruiters | ~10M knowledge workers |
| **Price per seat** | $79/month | $79/month |
| **Expansion revenue** | Limited (recruiter team only) | High (land → expand to sales, CS, IT) |
| **Stickiness** | Moderate (recruiting only) | High (embedded across functions) |

---

## Go-to-Market for Expansion

### Strategy: Land with Recruiting, Expand to Adjacent Teams

1. **Win recruiting buyer** (current motion)
2. **Measure adoption and ROI** (current infrastructure)
3. **Ask**: "What other teams in your company switch between multiple tools?"
4. **Pilot sales/CS skills** with existing customer
5. **Case study**: "Company X saves $X across recruiting AND sales"
6. **New customer pitch**: "Works for recruiting, sales, and customer success"

### Expansion Triggers

Look for these signals in existing customers:
- Customer says "I wish we had this for [other team]"
- High adoption (>80% of seats active weekly)
- Champion gets promoted or moves teams
- Company raises funding / expands headcount

### Pricing for Multi-Vertical

Options to explore:

| Approach | Pro | Con |
|----------|-----|-----|
| **Same price, more value** | Easy sell, faster expansion | Leaves money on table |
| **Per-vertical pricing** | Higher ARPU | Complex billing |
| **Tiered bundles** | Predictable, enterprise-friendly | May limit adoption |

**Recommendation**: Start with same price for early adopters (reward expansion behavior), introduce bundles once multi-vertical is proven.

---

## What Changes, What Stays

### Stays the Same
- Ephemeral architecture (core principle)
- Skill template format
- API and authentication
- Multi-tenant infrastructure
- Role-based access control
- Admin/user flow

### Changes
- Skill library (new skills for each vertical)
- Integration providers enabled (add Salesforce, Jira, etc.)
- Marketing positioning (from "recruiting tool" to "workflow platform")
- Documentation (vertical-specific guides)
- Personas (add SDR, CSM, DevOps personas)

### Optional Enhancements
- **Credential tier warnings**: Alert admins when configuring high-risk integrations (IT/DevOps)
- **LLM metadata passthrough**: Ensure user_id and org_id passed on all LLM calls (for audit trail filtering)
- **Compliance documentation**: Guide for exporting LLM audit logs, provider compliance references

### Net Assessment

Expansion is a **content problem, not an architecture problem**. The platform is ready. We need:
1. Skills for new verticals
2. Integration provider setup
3. Go-to-market materials
4. First customers in each vertical

For Tier 3 verticals (Legal, Finance), add:
5. Documentation for LLM-level audit log export
6. Ensure LLM metadata passthrough is implemented

**No new features required**—just documentation and minor implementation details.

---

## Reframed Positioning

### Current
> "Skill-O-Matic brings recruiting tools directly into Claude."

### Expanded
> "Skill-O-Matic connects your business tools through natural language. Start a conversation, take action—no switching tabs."

### Tagline Options
- "Your tools. One conversation."
- "The AI layer for enterprise workflows."
- "Stop switching. Start doing."
- "Natural language meets enterprise software."

---

## Next Steps for Validation

### Quick Wins (Can Do Now)
- [ ] Interview 5 existing customers about other teams with tool-switching pain
- [ ] Mock up 3-5 sales/CS skills to test messaging
- [ ] Add Salesforce and HubSpot to Nango integration options

### Medium-Term (Requires Effort)
- [ ] Build MVP sales skill set (3-5 skills)
- [ ] Find one design partner for sales vertical
- [ ] Create sales-focused landing page variant

### For Regulated Industries (Documentation Only)
- [ ] Verify user_id/org_id passed in LLM metadata on all calls
- [ ] Write guide: "Exporting Audit Logs from Anthropic Console"
- [ ] Write guide: "Exporting Audit Logs from OpenAI Enterprise"
- [ ] Document LLM provider compliance certs (Anthropic SOC2, HIPAA BAA)
- [ ] Create credential scoping guide for IT/DevOps integrations

### Signals to Watch
- Do existing recruiting customers express interest in other verticals?
- Can we find sales/CS buyers through recruiting relationships?
- Do sales skills achieve similar ROI to recruiting skills?
- Do IT/DevOps prospects raise credential security concerns?
- Do regulated industry prospects accept LLM-level audit trails?

---

## Summary

Skill-O-Matic's value isn't "AI for recruiting." It's "natural language interface to fragmented enterprise workflows."

Recruiting validates the model. Sales, customer success, IT ops, and marketing are natural expansions that require minimal architectural changes—just new skills and integrations.

The question isn't whether to expand. It's when and how fast.

---

*Last updated: January 2026*

---

## Appendix: Ephemeral Architecture Reference

For full technical details on the ephemeral architecture, see [EPHEMERAL_ARCHITECTURE.md](./EPHEMERAL_ARCHITECTURE.md).
