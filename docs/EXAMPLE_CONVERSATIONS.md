# Example Conversations - Manual Test Scenarios

Manual test scenarios for each workflow category. Each conversation demonstrates realistic prompts, expected AI behavior, and natural follow-ups.

---

## Sales & CRM

### Scenario 1: Lead Enrichment

**User:** I just got back from the SaaStr conference. I have a list of 15 companies I talked to - can you enrich them with contact info for their heads of sales?

**Expected behavior:**
- AI asks for the list (or accesses from a shared doc/CRM if already connected)
- Calls Apollo/LinkedIn to find Head of Sales or VP Sales at each company
- Returns enriched data with names, titles, emails, LinkedIn URLs

**AI response:** Found contacts for 14 of the 15 companies. Here's what I got:

| Company | Contact | Title | Email | LinkedIn |
|---------|---------|-------|-------|----------|
| Acme Corp | Sarah Chen | VP Sales | sarah.chen@acme.com | linkedin.com/in/sarahchen |
| TechFlow | Mike Rodriguez | Head of Sales | mike.r@techflow.io | linkedin.com/in/mikerodriguez |
... (etc)

Couldn't find a sales lead for "Stealth Startup" - they might not have public profiles yet. Want me to add these to your CRM?

**User:** Yes, add them to HubSpot as new leads. Tag them all with "SaaStr 2026"

**Expected behavior:**
- Creates 14 new contacts in HubSpot
- Adds "SaaStr 2026" tag to each
- Confirms completion with link to HubSpot view

---

### Scenario 2: Automated Follow-ups

**User:** Check my pipeline for deals that have gone cold - no activity in the last 2 weeks. Draft follow-up emails for each.

**Expected behavior:**
- Queries CRM for deals with no logged activity in 14+ days
- Reviews previous conversation context for each deal
- Drafts personalized follow-ups referencing last interaction

**AI response:** Found 4 deals with no activity in 2+ weeks:

**1. DataSync Inc** (Last contact: Jan 10 - sent proposal)
> Subject: Following up on the DataSync proposal
>
> Hi Jennifer, wanted to check in on the proposal I sent over two weeks ago. I know Q1 planning can get hectic - is there anything I can clarify or adjust to help move things forward?

**2. CloudMetrics** (Last contact: Jan 8 - demo call)
> Subject: Thoughts after the demo?
>
> Hi Tom, it's been a couple weeks since our demo. I'm curious if you've had a chance to discuss with your team. Happy to do a follow-up session if there are questions I can help with.

... (2 more)

Want me to send these, or would you like to edit any first?

**User:** The DataSync one is good, send it. Let me tweak the CloudMetrics one - they mentioned budget concerns, so add something about our startup pricing.

**Expected behavior:**
- Sends DataSync email immediately via Gmail
- Waits for user to provide edited version for CloudMetrics
- Logs activity in CRM for sent email

---

### Scenario 3: CRM Hygiene

**User:** I need to clean up my Salesforce. Find all opportunities that are still marked "Active" but haven't had any activity in 30 days.

**Expected behavior:**
- Queries Salesforce for Active opportunities
- Filters to those with no logged calls, emails, or meetings in 30+ days
- Returns list with deal value and owner

**AI response:** Found 7 opportunities marked Active with no activity in 30+ days:

| Opportunity | Amount | Owner | Last Activity | Days Stale |
|-------------|--------|-------|---------------|------------|
| Globex Corp - Enterprise | $85,000 | You | Dec 20 - Email | 37 days |
| Initech - Pro Plan | $12,000 | You | Dec 15 - Call | 42 days |
| Umbrella LLC - Team | $24,000 | Jamie | Dec 28 - Meeting | 29 days |
... (4 more)

Total pipeline at risk: $203,000. Want me to change these to "At Risk" stage, or flag them some other way?

**User:** Change them all to At Risk, and send me a Slack message with this summary every Monday morning.

**Expected behavior:**
- Updates all 7 opportunities to "At Risk" stage in Salesforce
- Creates a scheduled job for Monday 9am Slack summary
- Confirms both actions

---

## Customer Support

### Scenario 1: Ticket Triage

**User:** I have 23 new tickets from overnight. Categorize them and tell me if any are from enterprise customers.

**Expected behavior:**
- Fetches new/unassigned tickets from Zendesk
- Categorizes by type (billing, technical, feature request, etc.)
- Cross-references with CRM to identify enterprise accounts
- Prioritizes accordingly

**AI response:** Categorized 23 new tickets:

**🔴 Enterprise customers (handle first):**
- #4521 - Acme Corp (Enterprise, $50k ARR) - "API returning 500 errors" - Technical/Urgent
- #4519 - GlobalTech (Enterprise, $35k ARR) - "Need to add 10 more seats" - Billing/Normal

**Technical issues (8):**
- #4520 - Integration not syncing (3 reports of this - possible bug)
- #4517 - Password reset not working
- #4515 - Mobile app crash on iOS 17
... (5 more)

**Billing (5):**
- #4518 - Invoice question
- #4514 - Downgrade request
... (3 more)

**Feature requests (6):**
- #4516 - Dark mode request (12th request this month)
... (5 more)

**Spam/junk (2):** Already marked for deletion.

Want me to assign the enterprise tickets to senior support, and auto-respond to the feature requests with our roadmap link?

**User:** Yes, and also create a bug ticket for the integration sync issue since 3 people reported it.

**Expected behavior:**
- Assigns enterprise tickets to senior support queue
- Sends templated response to feature request tickets
- Creates internal bug ticket linking the 3 related support tickets

---

### Scenario 2: Response Drafting

**User:** Ticket #4521 from Acme Corp - they're getting API 500 errors. Check our status page and their recent API usage, then draft a response.

**Expected behavior:**
- Fetches ticket details and customer history
- Checks internal status page for known issues
- Pulls customer's recent API logs if available
- Drafts informed response

**AI response:** Here's what I found:

**Ticket:** Acme Corp reporting 500 errors on /api/v2/sync endpoint since 6am
**Status page:** No current incidents posted
**Their API usage:** Spike in requests starting 5:47am - went from ~100/min to ~2000/min
**Account tier:** Enterprise - 1000 req/min limit

Looks like they're hitting rate limits but getting 500s instead of 429s (that's a bug on our side).

**Draft response:**
> Hi Jennifer,
>
> Thanks for reporting this. I looked into your API usage and see a significant spike starting around 5:47am. You're currently exceeding your rate limit of 1,000 requests/minute.
>
> You should be getting 429 (rate limit) responses rather than 500 errors - I've flagged that for our engineering team to fix.
>
> In the meantime, I can:
> 1. Temporarily increase your rate limit to 2,500/min while you adjust your integration
> 2. Help you implement exponential backoff in your code
>
> Let me know which would help!

Want me to send this and bump their rate limit?

**User:** Send it, bump their limit, and create an internal ticket about the 500 vs 429 bug.

**Expected behavior:**
- Sends response via Zendesk
- Updates customer's rate limit in admin panel
- Creates bug ticket for engineering with details

---

### Scenario 3: Customer Health Check

**User:** Which customers have submitted 3 or more support tickets this week? I want to check if anyone's struggling.

**Expected behavior:**
- Queries support platform for ticket volume by customer (last 7 days)
- Filters to 3+ tickets
- Enriches with account details from CRM

**AI response:** Found 5 customers with 3+ tickets this week:

| Customer | Tickets | Account Type | ARR | Topics |
|----------|---------|--------------|-----|--------|
| Initech | 6 | Pro | $8,400 | API errors (3), billing (2), feature question (1) |
| Dunder Co | 4 | Team | $2,400 | Onboarding questions (all 4) |
| Pied Piper | 3 | Pro | $6,000 | Integration issues (3) |
| Hooli | 3 | Enterprise | $42,000 | Same user, password resets (3) |
| Bluth Co | 3 | Team | $3,600 | Billing disputes (3) |

**Concerning patterns:**
- **Initech** - 6 tickets is a lot, mostly technical. Might be churn risk.
- **Bluth Co** - 3 billing disputes could mean they're unhappy with pricing.
- **Hooli** - Same user can't log in, might be a specific account issue.

Want me to draft outreach for any of these? Or pull up their full ticket history?

**User:** Draft a check-in email for Initech from me (not support). And look into the Hooli login issue - is it the same person each time?

**Expected behavior:**
- Drafts personal outreach email for Initech
- Investigates Hooli tickets to find pattern

---

## Recruiting

### Scenario 1: Candidate Sourcing

**User:** I need to find senior backend engineers in Austin who have experience with Go. Find me 10 good candidates.

**Expected behavior:**
- Searches LinkedIn with filters (Senior, Backend, Austin, Go)
- Filters for relevant experience and seniority signals
- Returns profiles with key highlights

**AI response:** Found 10 senior backend engineers in Austin with Go experience:

**Strong matches:**

1. **Alex Rivera** - Staff Engineer at Cloudflare (4 yrs)
   - Go, Rust, distributed systems
   - Previously: Senior at DigitalOcean
   - UT Austin CS grad
   - [LinkedIn](example.com)

2. **Priya Sharma** - Senior Backend at Stripe (3 yrs)
   - Go, Python, payments infrastructure
   - Open source contributor to go-redis
   - [LinkedIn](example.com)

3. **Marcus Johnson** - Backend Lead at Indeed (5 yrs)
   - Go, Kubernetes, 50+ person team experience
   - Actively posting about Go patterns
   - [LinkedIn](example.com)

... (7 more)

I also found 4 people who aren't explicitly "backend" but have strong Go contributions - want to see those too?

**User:** These look great. Add the top 5 to Greenhouse and draft outreach for them.

**Expected behavior:**
- Creates 5 candidate profiles in Greenhouse ATS
- Drafts personalized outreach based on each profile
- Queues for review before sending

---

### Scenario 2: Outreach Sequences

**User:** I have 8 candidates in my "Contacted" stage who haven't responded in a week. Send personalized follow-ups based on their backgrounds.

**Expected behavior:**
- Pulls candidates from ATS in "Contacted" stage
- Checks last contact date (7+ days ago)
- Reviews original outreach and candidate profile
- Drafts unique follow-ups

**AI response:** Found 8 candidates with no response in 7+ days. Here are the follow-ups:

**1. Alex Rivera** (Original: mentioned Cloudflare work)
> Hi Alex - wanted to bump this in case it got buried. I noticed you've been working on Cloudflare's edge computing stuff - we're solving similar problems at a smaller scale and would love to chat about the challenges you've tackled. Even a 15-min coffee chat would be great.

**2. Priya Sharma** (Original: mentioned open source contributions)
> Hi Priya - following up on my note from last week. I checked out your go-redis contributions - really clean code. We're building our caching layer right now and could use someone who thinks about these problems the way you do. Any interest in learning more?

**3. Marcus Johnson** (Original: mentioned team leadership)
> Hi Marcus - circling back on this. I know Indeed keeps you busy, but if you're ever curious about leading a smaller, faster-moving team, I'd love to chat. No pressure, just an open door.

... (5 more)

Want me to send all of these, or review them one by one?

**User:** Send all except Marcus - I want to personalize that one more. He went to UT Austin right? Mention that I'm an alum too.

**Expected behavior:**
- Sends 7 follow-up emails via Gmail
- Logs outreach in ATS
- Waits for user's custom Marcus email

---

### Scenario 3: Interview Scheduling

**User:** I need to schedule phone screens for the 4 candidates who passed the take-home. Check my calendar and the hiring manager's calendar for slots this week.

**Expected behavior:**
- Identifies candidates who passed take-home stage
- Checks both calendars for availability
- Finds overlapping 30-min slots
- Proposes options

**AI response:** Found 4 candidates ready for phone screens. Checking your calendar and Jamie's (hiring manager)...

**Available slots this week (both of you free):**
- Tuesday 2pm, 3pm, 4pm
- Wednesday 10am, 2pm
- Thursday 11am, 2pm, 3pm
- Friday 10am, 11am

**Candidates to schedule:**
1. Alex Rivera - Prefers afternoons (from his LinkedIn activity)
2. Priya Sharma - No preference stated
3. Marcus Johnson - No preference stated
4. Lisa Chen - Mentioned mornings work better in her application

**Suggested assignments:**
- Alex → Tuesday 3pm
- Priya → Wednesday 2pm
- Marcus → Thursday 2pm
- Lisa → Thursday 11am

Want me to send calendar invites with a Google Meet link? I'll include the standard phone screen prep doc.

**User:** Looks good, but move Lisa to Friday 10am - Thursday is getting crowded. Then send them all.

**Expected behavior:**
- Adjusts Lisa to Friday 10am
- Sends 4 calendar invites with video links
- Attaches prep doc
- Updates ATS with scheduled interviews

---

## Operations & Admin

### Scenario 1: Invoice Follow-up

**User:** Check QuickBooks for invoices that are overdue by more than 7 days. Send polite reminder emails to each.

**Expected behavior:**
- Queries QuickBooks for overdue invoices
- Filters to 7+ days overdue
- Pulls client contact info
- Drafts appropriate reminders based on amount and relationship

**AI response:** Found 6 invoices overdue by 7+ days:

| Client | Invoice # | Amount | Due Date | Days Late |
|--------|-----------|--------|----------|-----------|
| Acme Corp | INV-2024-089 | $4,500 | Jan 15 | 11 days |
| TechFlow | INV-2024-092 | $1,200 | Jan 18 | 8 days |
| DataSync | INV-2024-088 | $8,000 | Jan 12 | 14 days |
| CloudMetrics | INV-2024-091 | $950 | Jan 17 | 9 days |
| Globex | INV-2024-087 | $12,000 | Jan 10 | 16 days |
| Initech | INV-2024-093 | $600 | Jan 19 | 7 days |

Total outstanding: $27,250

**Draft emails:**

**Acme Corp ($4,500, 11 days):**
> Subject: Invoice #INV-2024-089 - Friendly reminder
>
> Hi Sarah, hope you're doing well! Just a quick note that invoice #INV-2024-089 for $4,500 was due on January 15th. If there are any questions about the invoice, let me know - otherwise, I'd appreciate payment when you get a chance.

**Globex ($12,000, 16 days):** [More urgent tone given amount and lateness]
> Subject: Invoice #INV-2024-087 - Payment follow-up
>
> Hi Tom, following up on invoice #INV-2024-087 for $12,000, which was due on January 10th. Please let me know if there's anything holding this up or if you need me to resend the invoice.

... (4 more with appropriate urgency levels)

Ready to send these?

**User:** Send all of them except Initech - they just signed a new contract so I'll handle that one personally. Also mark Globex as priority follow-up for next week if they don't pay.

**Expected behavior:**
- Sends 5 reminder emails
- Creates calendar reminder for Globex follow-up
- Logs outreach in QuickBooks notes

---

### Scenario 2: Report Generation

**User:** Generate a weekly pipeline summary for the sales team. Include new leads, deals closed, and deals lost this week.

**Expected behavior:**
- Queries CRM for leads created this week
- Finds deals moved to Closed Won and Closed Lost
- Calculates totals and compares to prior week
- Formats as readable summary

**AI response:** Here's the weekly pipeline summary (Jan 20-26):

## 📊 Weekly Pipeline Summary

**New Leads: 34** (↑ 12% from last week)
- Inbound: 22
- Outbound: 8
- Referral: 4

**Deals Closed Won: 6 ($89,500)** (↓ from 8 last week)
- Acme Corp - Enterprise - $45,000
- TechFlow - Pro - $12,000
- DataSync - Team - $8,500
- CloudMetrics - Pro - $12,000
- 2 others totaling $12,000

**Deals Lost: 3 ($28,000)**
- Globex - Enterprise - $18,000 (Lost to competitor)
- Initech - Pro - $6,000 (Budget cut)
- Umbrella - Team - $4,000 (Went silent)

**Pipeline Value:** $412,000 (↑ 8% from last week)

**Stale deals (no activity 14+ days):** 5 deals worth $67,000

---

Want me to post this to #sales on Slack? I can also set this up to run automatically every Monday morning.

**User:** Yes, post to Slack now. And set it up for every Monday at 9am. Include a comparison to the same week last month too.

**Expected behavior:**
- Posts summary to #sales Slack channel
- Creates scheduled job for Monday 9am
- Updates report template to include month-over-month comparison

---

### Scenario 3: Cross-Tool Sync

**User:** When a deal closes in Salesforce, I need a project automatically created in Notion with the client details. Can you set that up?

**Expected behavior:**
- Explains what the automation will do
- Confirms Notion database structure
- Sets up trigger/webhook

**AI response:** I can set that up. Here's what I'll create:

**Trigger:** Salesforce opportunity moves to "Closed Won"

**Action:** Create Notion page in your Projects database with:
- Page title: [Company Name] - [Deal Name]
- Client contact: From Salesforce contact
- Deal value: From opportunity amount
- Close date: Today
- Sales rep: Opportunity owner
- Status: "Kickoff"

**Questions before I set this up:**
1. Which Notion database should I use? I see "Projects", "Client Work", and "Active Deals"
2. Should I also create a kickoff task assigned to anyone?
3. Any other Salesforce fields you want pulled into Notion?

**User:** Use the "Projects" database. Yes, create a kickoff task assigned to Jamie (our onboarding lead). Also pull in the "Implementation Notes" field from Salesforce if it exists.

**Expected behavior:**
- Sets up Salesforce webhook for Closed Won
- Creates automation to generate Notion page
- Includes task creation for Jamie
- Maps Implementation Notes field

**AI response:** Done. Here's what I set up:

✅ **Trigger:** Salesforce opportunity → Closed Won
✅ **Notion page:** Created in "Projects" database with all fields
✅ **Task:** "Kickoff call with [Client]" assigned to Jamie, due 3 days after close
✅ **Implementation Notes:** Mapped to Notion "Notes" property

Want me to test it with a fake deal, or wait for the next real close?

---

## Development & DevOps

### Scenario 1: PR Management

**User:** Summarize the changes in PR #247 and post a summary to #engineering in Slack.

**Expected behavior:**
- Fetches PR details from GitHub
- Analyzes diff and commit messages
- Generates human-readable summary
- Posts to Slack

**AI response:** Here's the summary for PR #247:

## PR #247: Add rate limiting to API endpoints

**Author:** @sarahdev
**Branch:** feature/rate-limiting → main
**Files changed:** 12 (+340 / -45)

**Summary:**
This PR adds rate limiting to all public API endpoints using a Redis-backed token bucket algorithm. Key changes:

- New `RateLimiter` middleware in `src/middleware/rateLimit.ts`
- Default limits: 100 req/min for free tier, 1000 req/min for paid
- Custom limits configurable per-endpoint
- Returns 429 with `Retry-After` header when exceeded
- Added Redis connection pooling for performance

**Breaking changes:** None

**Tests:** 14 new tests added, all passing

**Review status:** 2 approvals, no requested changes

---

Posted to #engineering. Want me to also notify anyone specific?

**User:** Thanks. Can you also check if there are any other PRs ready for review that have been waiting more than 2 days?

**Expected behavior:**
- Queries GitHub for open PRs with no recent review activity
- Filters to 2+ days old
- Returns list with reviewers and status

**AI response:** Found 3 PRs waiting for review for 2+ days:

| PR | Title | Author | Waiting | Requested Reviewers |
|----|-------|--------|---------|---------------------|
| #244 | Fix memory leak in worker process | @marcus | 4 days | @jamie (no response) |
| #241 | Update auth flow for SSO | @priya | 5 days | @alex (approved), waiting for @jamie |
| #238 | Refactor database queries | @alex | 6 days | No reviewers assigned |

Looks like Jamie might be the bottleneck - they have 2 pending reviews. Want me to send them a nudge on Slack?

---

### Scenario 2: Issue Triage

**User:** Look at new GitHub issues from the last 24 hours. Label them and assign to the right team.

**Expected behavior:**
- Fetches issues created in last 24 hours
- Analyzes content to determine type and priority
- Applies labels
- Assigns based on team rules

**AI response:** Found 8 new issues in the last 24 hours. Here's how I categorized them:

**Bugs (3):**
- #892 "Login fails on Safari" → `bug`, `priority:high`, `team:frontend` → Assigned to @sarah
- #890 "API timeout on large exports" → `bug`, `priority:medium`, `team:backend` → Assigned to @marcus
- #889 "Broken link in docs" → `bug`, `priority:low`, `team:docs` → Assigned to @docs-team

**Feature Requests (3):**
- #893 "Dark mode support" → `enhancement`, `needs-triage` → No assignment (12th request for dark mode)
- #891 "Export to CSV" → `enhancement`, `priority:medium`, `team:backend` → Assigned to @alex
- #888 "Mobile app request" → `enhancement`, `out-of-scope` → Closed with template response

**Questions (2):**
- #894 "How to use webhooks?" → `question`, `docs` → Responded with docs link
- #887 "Pricing for enterprise" → `question`, `sales` → Forwarded to sales@

**Potential duplicates:**
- #890 might be related to #845 (same timeout error pattern)

Labels and assignments applied. Want me to post a summary to #engineering?

**User:** Yes, post it. And link #890 to #845 as potentially related.

**Expected behavior:**
- Posts triage summary to Slack
- Adds comment to #890 referencing #845
- Possibly adds "duplicate?" label

---

### Scenario 3: Documentation Updates

**User:** I just merged the rate limiting PR. Can you update the API docs in Notion to reflect the new rate limits?

**Expected behavior:**
- Checks the merged PR for details
- Finds relevant Notion doc pages
- Updates with new rate limit information

**AI response:** I'll update the API docs. Looking at PR #247...

Found the relevant Notion pages:
- "API Reference" - Main endpoint docs
- "Authentication & Rate Limits" - Dedicated page for limits
- "Error Codes" - Needs 429 error added

**Updates I'll make:**

**1. Authentication & Rate Limits page:**
- Add new section explaining token bucket algorithm
- Document limits: 100 req/min (free), 1000 req/min (paid)
- Explain `Retry-After` header behavior

**2. API Reference page:**
- Add rate limit info to endpoint header template
- Note that all endpoints are rate limited

**3. Error Codes page:**
- Add 429 "Too Many Requests" with example response
- Include recommended retry logic

Ready to apply these updates?

**User:** Yes, apply them. Also add a code example showing how to handle 429 errors properly.

**Expected behavior:**
- Updates all three Notion pages
- Adds code example with exponential backoff
- Confirms changes

---

## Analytics & Reporting

### Scenario 1: Ad-hoc Queries

**User:** How many new signups did we get last week, broken down by source?

**Expected behavior:**
- Queries analytics/database for signups in date range
- Groups by acquisition source
- Returns formatted results

**AI response:** Here are signups for last week (Jan 20-26):

**Total new signups: 287** (↑ 18% from prior week)

| Source | Signups | % of Total | vs. Last Week |
|--------|---------|------------|---------------|
| Organic Search | 112 | 39% | ↑ 22% |
| Direct | 68 | 24% | ↑ 15% |
| Twitter/X | 43 | 15% | ↑ 45% |
| LinkedIn | 31 | 11% | ↑ 8% |
| Product Hunt | 18 | 6% | New |
| Referral | 15 | 5% | ↓ 12% |

**Notable:**
- Twitter spike likely from your thread on Wednesday (got 2.3k likes)
- Product Hunt traffic is from the MCP tools collection feature
- Referral down - might want to promote the referral program

Want me to dig deeper into any of these sources?

**User:** Yes, tell me more about the Twitter signups. What thread drove them and what's their activation rate compared to other sources?

**Expected behavior:**
- Correlates signups with specific Twitter activity
- Calculates activation rate (completed onboarding, first action, etc.)
- Compares to other source cohorts

**AI response:** Here's the breakdown on Twitter signups:

**Traffic source:** Your thread about "MCP use cases that actually work" posted Wednesday 2pm
- 2,347 likes, 412 retweets, 89 replies
- Link clicks: 1,847
- Signups: 43 (2.3% conversion)

**Activation comparison (completed first workflow):**

| Source | Signups | Activated | Rate |
|--------|---------|-----------|------|
| Organic Search | 112 | 67 | 60% |
| Twitter | 43 | 31 | 72% ⭐ |
| LinkedIn | 31 | 16 | 52% |
| Direct | 68 | 38 | 56% |
| Product Hunt | 18 | 8 | 44% |

Twitter signups have the highest activation rate - makes sense since they saw specific use cases before signing up and knew what to do.

Product Hunt has the lowest - probably more tire-kickers. Worth doing some targeted onboarding for that cohort.

---

### Scenario 2: Scheduled Reports

**User:** Set up a daily revenue report that goes to my email every morning at 8am.

**Expected behavior:**
- Confirms what metrics to include
- Sets up scheduled job
- Shows example of what report will look like

**AI response:** I'll set that up. What would you like included in the daily revenue report?

**Suggested metrics:**
- Yesterday's revenue (new + recurring)
- MRR as of yesterday
- New paying customers
- Churned customers
- Trial conversions
- Comparison to same day last week/month

**Format options:**
- Email with inline summary
- Email with attached spreadsheet
- Email with link to live dashboard

What combination works for you?

**User:** All of those metrics, inline in the email. Also add a section showing the top 3 new customers by deal size.

**Expected behavior:**
- Creates report template with all requested metrics
- Schedules for 8am daily
- Sends test report

**AI response:** Done. Here's what the daily report will look like:

---

**Subject: Daily Revenue Report - Jan 26, 2026**

## Yesterday's Numbers

| Metric | Value | vs. Last Week |
|--------|-------|---------------|
| Revenue | $2,847 | ↑ 12% |
| New MRR | $1,200 | ↑ 8% |
| Churned MRR | $0 | - |
| Net MRR | $1,200 | ↑ 8% |

**Total MRR:** $48,500

**New paying customers:** 4
**Churned:** 0
**Trial conversions:** 6

## Top 3 New Customers

1. **Acme Corp** - Enterprise - $500/mo
2. **TechFlow** - Pro - $79/mo
3. **DataSync** - Pro - $79/mo

---

Scheduled for 8am daily to june@june.kim. Want me to send a test report now?

**User:** Looks great. Yes, send a test now. And can you also set up a weekly version with more detail that goes to the team on Mondays?

**Expected behavior:**
- Sends test daily report immediately
- Creates weekly report template with expanded metrics
- Schedules for Monday mornings
- Asks which team channel/email to send to

---

### Scenario 3: Anomaly Alerts

**User:** Alert me if daily signups drop more than 30% compared to our 7-day average.

**Expected behavior:**
- Sets up monitoring job
- Confirms alert channel (Slack, email, etc.)
- Explains threshold logic

**AI response:** I'll set that up. Here's the monitoring rule:

**Metric:** Daily signups
**Baseline:** 7-day rolling average (currently ~41/day)
**Threshold:** 30% below baseline
**Current trigger point:** If signups drop below 29 in a day

**Alert will fire:**
- Immediately when threshold is crossed
- With context: actual vs. expected, trend over past 3 days
- Won't repeat for same incident (resets after 24 hours above threshold)

Where do you want the alert?
- Slack DM
- Slack channel (which one?)
- Email
- SMS (requires phone number)

**User:** Slack DM for now. Also set up a similar alert if error rate on the API goes above 1%.

**Expected behavior:**
- Creates signup drop alert → Slack DM
- Creates API error rate alert → Slack DM
- Confirms both are active

**AI response:** Done. Two alerts now active:

✅ **Signup drop alert**
- Trigger: Daily signups < 29 (30% below 7-day avg)
- Channel: Slack DM to you

✅ **API error rate alert**
- Trigger: Error rate > 1% (5-minute rolling window)
- Channel: Slack DM to you
- Current error rate: 0.03%

Both alerts will include context and a link to the relevant dashboard. Want me to set up a summary of all active alerts you can review weekly?

---

## Notes for Testing

When running these scenarios:

1. **Mock data requirements:**
   - CRM with sample contacts, deals, and activity history
   - Support platform with sample tickets
   - Calendar with availability
   - Email with conversation history
   - GitHub with PRs and issues
   - Analytics data with realistic patterns

2. **Expected AI behaviors to verify:**
   - Asks clarifying questions when needed
   - Provides counts and summaries before taking action
   - Waits for confirmation before destructive/bulk actions
   - Offers to do more after completing a task
   - Handles edge cases gracefully

3. **Common failure modes to watch for:**
   - AI takes action without confirmation
   - Misunderstands which system to query
   - Returns data in wrong format
   - Doesn't handle "not found" cases well
   - Loses context in follow-up questions
