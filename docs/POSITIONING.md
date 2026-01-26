# Skillomatic Positioning

> **Purpose**: Define Skillomatic's market positioning to inform website messaging, marketing, and product strategy.
>
> **Last Updated**: January 2025

---

## One-Liner

**Skillomatic helps businesses automate repetitive workflows using AI.**

---

## The Insight

People are already using Claude Desktop, ChatGPT, and other AI tools daily. But these tools can only *suggest* — they can't actually *do* things in your business systems.

Skillomatic bridges that gap. We connect your AI to your tools (ATS, CRM, email, calendar, etc.) so it can actually take action.

Some people want to set this up themselves. Others want someone to build it for them. We offer both.

---

## What We Are

| We Are | We Are Not |
|--------|------------|
| Automation consulting + self-serve platform | A recruiting platform |
| Integration layer for AI tools | Another SaaS dashboard |
| Vertical-agnostic (recruiting, sales, ops, etc.) | Locked to one industry |
| For SMBs who can just say yes | Enterprise sales (not yet) |

---

## Business Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        SKILLOMATIC                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Consulting (PRIMARY)                Self-Serve (AVAILABLE)     │
│   ────────────────────                ──────────────────────     │
│                                                                  │
│   "We build your                      "DIY if you prefer"        │
│    automation"                                                   │
│                                                                  │
│   - Discovery call                    - Sign up                  │
│   - Custom build                      - Connect integrations     │
│   - Ongoing support                   - Use with Claude/ChatGPT  │
│                                                                  │
│   $5-10K + retainer                   $0-99/mo                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Consulting First

| Benefit | Why It Matters |
|---------|----------------|
| **Learn** | Deep access to real workflows and real pain |
| **Get paid** | Revenue from day one |
| **Validate** | Same problem 3x = productize it |
| **Compound** | Each build makes the platform better |

Self-serve stays available — no gatekeeping. But consulting is the focus.

---

## Target Customers

### Who

| Customer | Why They'd Pay |
|----------|----------------|
| **Startups (10-50 people)** | No ops team, founders doing everything manually |
| **Small agencies** | Recruiting, marketing, PR — lots of repetitive work |
| **Professional services** | Accountants, lawyers, consultants — admin overhead |
| **Ops people at mid-size companies** | Budget to pay, drowning in manual work |

### Who NOT (for now)

| Customer | Why Not |
|----------|---------|
| **Enterprise** | Security reviews, legal, procurement — can't just say yes |
| **Non-AI users** | Need to already be using Claude/ChatGPT |

---

## Workflows We Can Automate

Not limited to recruiting. Examples:

| Vertical | Workflows |
|----------|-----------|
| **Recruiting** | Source candidates, outreach, follow-ups, scheduling |
| **Sales** | Lead enrichment, follow-ups, CRM updates |
| **Ops** | Invoice chasing, data entry, report generation |
| **Support** | Ticket triage, response drafting, escalation |
| **General** | Email management, calendar coordination, notifications |

Recruiting has existing integrations. Others can be built per client (and then productized).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI CLIENTS                                │
│                                                                  │
│   Claude Desktop    ChatGPT     Cursor     Custom Apps           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ MCP Protocol
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SKILLOMATIC MCP SERVER                          │
│                                                                  │
│   Tools for whatever integrations the client needs               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ OAuth via Nango
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATIONS                                │
│                                                                  │
│   ATS        CRM        Email      Calendar     Whatever         │
│   Greenhouse Salesforce Gmail      Google Cal   Custom APIs      │
│   Lever      HubSpot    Outlook    Calendly     Webhooks         │
│   Ashby      Pipedrive  ...        ...          ...              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pricing

### Self-Serve

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 500 tool calls/month, basic integrations |
| **Pro** | $29/mo | 5,000 calls, all integrations |
| **Team** | $99/mo | 25,000 calls, multiple users |

### Consulting

| Service | Price |
|---------|-------|
| **Discovery** | $500-1K (2-hour audit + recommendations) |
| **Automation Build** | $5-10K (one workflow, end-to-end) |
| **Retainer** | $1-3K/mo (ongoing support, tweaks, new workflows) |

### No Gatekeeping

Self-serve is always available. Consulting is for people who value their time over money.

---

## Scaling Plan

```
Phase 1: Solo (now)
├── You do consulting + maintain self-serve
├── Learn what workflows are repeatable
└── Document playbooks

Phase 2: First hire
├── You do sales + discovery
├── Dev(s) build from playbooks
└── Skillomatic infra makes builds faster

Phase 3: Scale
├── Option A: Grow the agency (more devs, more clients)
├── Option B: Productize (patterns become self-serve features)
└── Option C: Both
```

---

## Messaging Framework

### Headline

**"I build AI automations for your business"**

### Subhead

"You tell me what's repetitive and painful. I build an automation that actually does it — connected to your real tools, running in your AI assistant."

### Value Props

| Message | Why It Works |
|---------|--------------|
| "Tell me what's painful" | Consulting framing, not product framing |
| "I build it for you" | Done-for-you, not DIY |
| "Works in Claude/ChatGPT" | Leverages tools they already use |
| "Done in days, not months" | Speed |
| "Or set it up yourself" | Self-serve available, no pressure |

### Tone

- Personal ("I" not "we" — you're a solo consultant for now)
- Direct (no corporate fluff)
- Builder-focused (you ship, not just advise)

---

## Website Structure

Consulting-first, self-serve available.

| Page | Purpose |
|------|---------|
| **/** (Landing) | "I build AI automations for your business" — consulting pitch |
| **/how-it-works** | The process: Discovery → Build → Deliver |
| **/pricing** | Consulting rates + "Or DIY with self-serve" |
| **/examples** | Workflows I can build (recruiting, sales, ops) |
| **/self-serve** | For DIYers: Free / Pro / Team tiers |

### Pages to Remove

| Page | Action |
|------|--------|
| `/for-recruiters` | Remove — too narrow |
| `/for-it` | Remove — enterprise isn't the buyer |
| `/security` | Remove or minimal — SMBs don't need a whole page |

### Primary CTA

Every page:

> **"Let's talk about what you want to automate"** → [Book a call](/contact)

### Secondary CTA

Below the fold:

> "Prefer to do it yourself? [Try self-serve](/self-serve)"

---

## Finding Clients

| Channel | Effort | Notes |
|---------|--------|-------|
| **Your network** | Low | Anyone running a small biz? |
| **LinkedIn outreach** | Medium | "I help automate [X] workflows" |
| **Communities** | Medium | Indie hackers, startup Slacks, niche forums |
| **Content** | Slow burn | Write about automations you've built |
| **Referrals** | After first clients | "Know anyone else who needs this?" |
| **Self-serve inbound** | Over time | Users who want more → consulting leads |

---

## Success Metrics

| Metric | Why It Matters |
|--------|----------------|
| **Consulting revenue** | Pays bills, funds development |
| **Self-serve signups** | Validates demand, builds funnel |
| **Workflows built** | Shows what to productize |
| **Repeat clients / retainers** | Sustainable revenue |
| **Referrals** | Product-market fit signal |

---

## What's Next

1. **Update website** with consulting-first messaging
2. **Set up booking link** (Calendly or Cal.com)
3. **Reach out to 10 people** who might have workflow pain
4. **Land first consulting client**
5. **Document the playbook** as you build

---

## Appendix: Competitive Landscape

### Not Competing With

| Company | Why Not Direct Competition |
|---------|---------------------------|
| **Gem** | Recruiting platform — we're automation consulting |
| **Zapier** | Self-serve only, human-triggered — we do AI-native + consulting |
| **Agencies** | Traditional services — we have self-serve + tech leverage |

### Positioning

We're a **developer who ships automation** — not a generic consultant, not a pure SaaS.

Self-serve for people who want to DIY. Consulting for people who want it done.
