# Lean Business Canvas - Skillomatic

**Status:** Draft (validated through conversation)
**Last Updated:** 2026-01-28

---

## 1. Problem

**Core problems:**

1. **Fragmented tools, no interop** - Todo apps, CRMs, invoicing tools all have separate data stores. None talk to ChatGPT. AI-powered tools create yet another silo.

2. **Context-switching fatigue** - Alt-tabbing between doing the work and tracking the work. The overhead of "maintaining the system" competes with actual productivity.

3. **Trapped by inertia** - They have a "good enough" system that took forever to set up. It's slow and annoying, but switching to something marginally better isn't worth the migration pain.

**Existing alternatives:**
- HubSpot, Pipedrive (CRM) - overkill, another UI
- QuickBooks, Wave (invoicing) - complex, intimidating
- Asana, Notion (tasks) - yet another tool to check
- Zapier/Make (automation) - complex setup, not conversational
- Virtual assistants - $2-5k/month, async, training required
- Raw ChatGPT/Claude - can't actually update your data

**Opportunity:** They already use ChatGPT daily but haven't realized it could be the control center for everything. No new system to learn, works with what they have.

---

## 2. Customer Segments

| Segment | Status | Evidence |
|---------|--------|----------|
| **You** | User #1 | Building for yourself first |
| Founders/freelancers/consultants with email history | Hypothesis | People like you |
| Mortgage broker (lead gen) | 1 conversation | "interested in lead generation platform" |
| "Anti-SaaS solopreneurs" | Hypothetical | Made up, not validated |

**ICP (for warm contacts skill):** People with years of relationships buried in email who want to activate them without data entry.

**Your edge:** You've lived the founder/freelancer/consultant life. You understand the workflows firsthand.

**Market tailwind:** Economic uncertainty creates more solopreneurs. They'll grow into paid tiers as their needs multiply.

---

## 3. Unique Value Proposition

**Headline:** "Ask ChatGPT to handle your business busywork."

**One-liner:** It reads your email, updates your spreadsheets, sends follow-ups. No setup, no new apps.

**Differentiator:** Automation without configuration. Describe what you want, it happens. No workflow builders, no "if this then that" setup, no hypothesizing about edge cases.

**The journey they experience:**
1. "ChatGPT, do this annoying thing for me" → relief
2. It works → surprise/delight
3. "Wait, it can do this *every week*?" → magic

Automation isn't the pitch. It's the unexpected payoff after they're already happy.

**Branding:** Works with ChatGPT and Claude (any MCP client). Familiar interface, nothing new to learn.

---

## 4. Solution

**Business model:**
- Consulting ($500 one-time) = demand validation signal
- Self-serve ($5-50/month) = the real business
- If you can sell $500 custom work, $50/month product is obvious

**First skill: Warm Contacts CRM**

| Aspect | Detail |
|--------|--------|
| Warm contact = | At least one email each way (mutual exchange) |
| Skill creates | Sheet, columns, everything |
| Data source | Gmail |
| Fields | Name, email, last contact date, campaign stage |

**Campaign stages:**
1. Not contacted
2. Initial email sent
3. Followed up (one follow-up, no reply)
4. Replied
5. Interested
6. Not interested
7. In conversation
8. Converted

**User experience:**
1. "Load my warm contacts" → scans Gmail, creates Sheet, populates it
2. "Show me who I haven't emailed in 6 months" → filters the list
3. "Start outreach to these 20" → tracks campaign stage
4. "Send follow-up to people who haven't replied" → takes action
5. "Do this every Monday" → scheduled automation

---

## 5. Channels

| Channel | Role | Notes |
|---------|------|-------|
| **Warm outreach** | Primary | Use the product to sell the product. First paying customer comes from here. |
| LinkedIn | Secondary | Where ICP hangs out, but they're not looking for AI products |
| Reddit | Tertiary | Astroturfed, low trust, long game at best |

**Key insight:** These people use ChatGPT daily but don't seek out AI products. They won't find you - you have to reach them directly.

**Channel strategy:**
1. Build the warm contacts skill
2. Use it on yourself
3. Reach out to your own network
4. First paying customer validates everything

---

## 6. Revenue Streams

| Tier | Price | Integrations | Limits | Who |
|------|-------|--------------|--------|-----|
| Free | $0 | GSuite (Gmail, Sheets, Calendar), Calendly/Cal.com, time tracking | 10 calls/week, 3 cron jobs | Trying it out |
| Basic | $5/month | Same as free, unlimited | Unlimited calls, unlimited cron jobs | One-person businesses |
| Pro | $50/month | + CRM, ATS, Accounting, Finance (multiplayer tools) | Unlimited | Multi-person businesses |

**Conversion logic:**
- Free: Try everything, capped usage
- $5: You're using it regularly, worth a coffee/month
- $50: You need multiplayer integrations

**Consulting:** $500 one-time custom build. Validates demand for Pro tier.

---

## 7. Cost Structure

| Cost | Notes |
|------|-------|
| Nango | OAuth token management |
| Infra | MCP server hosting (minimal) |
| Your time | Onboarding, support, building |

**Key insight:** User pays for their own ChatGPT/Claude subscription. You're not subsidizing LLM calls. LLM costs trending to zero anyway. Pure margin on subscriptions.

---

## 8. Key Metrics

| Metric | Why |
|--------|-----|
| **Free user retention** | Are they coming back week after week? |
| **Conversion rate (free → paid)** | Non-negligible = signal that value is real |

**Not obsessing over (yet):**
- Revenue
- Growth rate
- Paid user count

**The thesis:** Economic uncertainty creates more solopreneurs. If they're retained on free, they convert when their business grows or needs multiply.

---

## 9. Unfair Advantage

| Factor | Reality |
|--------|---------|
| Defensibility now | None - everything can be copied |
| Edge | Early to MCP, fast execution, B2C AI is underserved |
| Moat over time | User's configured skills + cron jobs |

**Switching cost:** "I have a dozen automations, I'm not rebuilding that."

**The flywheel:**
1. They try a skill (free)
2. They like it, schedule it to repeat (cron job)
3. They add more skills, more automations
4. 12 automations later, they're locked in by their own setup

---

## Onboarding

**ChatGPT setup:** User needs to enable Developer Mode for MCP.

**Plan:**
- Whiteglove onboarding for first 10 paying users
- Instructional videos for self-serve later

---

## Open Questions

1. **What's the activation moment?** First successful skill run? First cron job scheduled?
2. **Time tracking integration** - what tool? Toggl? Harvest? Manual to Sheets?
3. **Mortgage broker** - pursue as pilot or focus on people more like yourself?

---

## Next Steps

- [ ] Build warm contacts CRM skill for yourself
- [ ] Use it to surface your own contacts
- [ ] Run warm outreach campaign using the product
- [ ] Get first paying customer

---

## References

- `docs/marketing/CONTENT_PLAN.md` - Demo strategy (needs update)
- `docs/BARTER_PLAYBOOK.md` - Early customer acquisition approach
