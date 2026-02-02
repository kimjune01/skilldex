# Hypothesis-Driven Validation Framework

**Date:** 2026-01-29
**Purpose:** Repeatable system for validating new vertical ideas

---

## Overview

This framework combines AI-assisted research (fast, broad) with customer discovery best practices (deep, validated). It's designed to go from "I have a vague idea" to "validated hypothesis worth building" in 2-4 weeks.

---

## The Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   PHASE 1: HYPOTHESIS GENERATION (2-4 hours)                    │
│   ──────────────────────────────────────────                    │
│   • AI-assisted research (Claude + web search)                  │
│   • Explore 3-5 verticals rapidly                               │
│   • Identify: pain, buyer, competition, pricing                 │
│   • Output: Lean canvas + testable assumptions                  │
│                                                                 │
│                           ↓                                     │
│                                                                 │
│   PHASE 2: OUTBOUND CAMPAIGN (1-2 weeks)                        │
│   ───────────────────────────────────────                       │
│   • Find targets (scrape listings, LinkedIn, forums)            │
│   • Personalized outreach (AI-generated, pain hook)             │
│   • Auto-schedule via Calendly                                  │
│   • Goal: 5-10 discovery calls booked                           │
│                                                                 │
│                           ↓                                     │
│                                                                 │
│   PHASE 3: CUSTOMER CONVERSATIONS (1-2 weeks)                   │
│   ───────────────────────────────────────────                   │
│   • Mom Test interviews (15-20 min each)                        │
│   • Focus on past behavior, not opinions                        │
│   • Record + transcribe                                         │
│   • Look for commitment signals                                 │
│                                                                 │
│                           ↓                                     │
│                                                                 │
│   PHASE 4: INSIGHT SYNTHESIS                                    │
│   ──────────────────────────                                    │
│   • AI summarizes transcripts                                   │
│   • Pattern extraction                                          │
│   • Score against kill criteria                                 │
│   • Update hypothesis with real data                            │
│                                                                 │
│                           ↓                                     │
│                                                                 │
│   PHASE 5: DECISION                                             │
│   ─────────────────────                                         │
│   • Pursue → Build MVP, onboard pilots                          │
│   • Pivot → Modify hypothesis, re-run Phase 2-3                 │
│   • Kill → Return to Phase 1 with new vertical                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Hypothesis Generation

### What We're Doing
Using AI to rapidly explore verticals and generate testable hypotheses.

### Process
1. Use `/discover-vertical <vertical>` skill or Claude chat
2. Research: pain points, existing solutions, pricing, TAM
3. Pressure test: Is this crowded? Is the pain acute? Can we reach them?
4. Output: Lean canvas with clear assumptions

### Deliverables
- [ ] Lean canvas document
- [ ] List of 3-5 testable assumptions
- [ ] Kill criteria defined
- [ ] Competitive landscape mapped

### Time: 2-4 hours

---

## Phase 2: Outbound Campaign

### What We're Doing
Finding and reaching target customers to book discovery calls.

### Target Identification

| Source | Method | What You Get |
|--------|--------|--------------|
| Craigslist listings | Scrape rental listings | Reply-to email of active landlords |
| Zillow "by owner" | Filter for private landlords | Contact info on listing |
| BiggerPockets | Forum activity, member profiles | DM access |
| Reddit r/landlord | Post history | DM access |
| LinkedIn | Search "landlord" + location | InMail or connection request |
| County tax records | Public property records | Owner name + mailing address |

### Outreach Sequence

**Email 1: Initial Outreach**
```
Subject: Your [2BR on Oak St] - quick question

Hey [Name if available] -

Saw your listing on Craigslist.

Quick question: when you post a rental, how many "is it available?"
messages do you typically get before finding a real tenant?

I'm researching how landlords handle the inquiry flood. Every day a
unit sits empty costs ~$50, and I'm curious how much time gets wasted
on tire-kickers vs. qualified prospects.

Would love 15 min to hear how you handle it. Happy to share what I'm
learning from other landlords.

[Calendly link: "Grab 15 min here →"]

- [Your name]

P.S. Not selling anything - just doing research before building
something that might help.
```

**Email 2: Follow-up (3 days later, if no response)**
```
Subject: Re: Your [2BR on Oak St] - quick question

Hey -

Following up on my note from earlier this week.

I've talked to a few landlords who say they get 30-50 inquiries per
listing, and maybe 5 are real. One guy said he just ignores most of
them now.

Curious if that matches your experience, or if you've found a
better system.

15 min anytime this week: [Calendly link]

- [Your name]
```

**Email 3: Final follow-up (5 days later)**
```
Subject: Last try - landlord research

Hey -

Last note from me. If you're too busy, totally understand.

If you ever want to share how you handle rental inquiries,
I'm all ears: [Calendly link]

Either way, good luck with the listing.

- [Your name]
```

### Automation Stack

| Step | Tool |
|------|------|
| Find targets | Browser extension (scrape CL) |
| Personalize | Claude API |
| Send | Gmail API |
| Schedule | Calendly (Nango integration) |
| Track | Spreadsheet or Airtable |

### Metrics

| Metric | Target |
|--------|--------|
| Outreach sent | 50-100 |
| Response rate | 10-20% |
| Calls booked | 5-10 |

### Time: 1-2 weeks (mostly waiting for responses)

---

## Phase 3: Customer Conversations

### What We're Doing
Mom Test-style interviews to validate problem and willingness to pay.

### The Mom Test Rules

1. **Don't pitch your idea** - They shouldn't know you have a solution
2. **Ask about past behavior** - "Tell me about your last vacancy" not "Would you use X?"
3. **Avoid hypotheticals** - Past behavior predicts future behavior
4. **Look for workarounds** - What have they already tried/paid for?
5. **Seek commitment** - Time, money, or referral = real signal

### Interview Script: Mid-Size Landlords

**Opening (2 min)**
```
Thanks for taking the time. I'm researching how landlords handle
the rental process - not selling anything, just trying to understand
the reality before building something.

Everything you share stays anonymous. Cool if I take notes?
```

**Context Questions (3 min)**
```
• How many units do you manage?
• How long have you been doing this?
• Do you self-manage or use a property manager?
• What platforms do you list on? (CL, Zillow, FB, etc.)
```

**Problem Exploration (8-10 min)**
```
Let's talk about your most recent vacancy.

• Walk me through what happened from "tenant gives notice"
  to "new tenant moves in"

• How long did it take to fill?

• Roughly how many inquiries did you get?

• What percentage would you say were serious vs. tire-kickers?

• How did you handle responding to all of them?

• What was the most frustrating part of the process?

• Did anyone no-show on a scheduled showing?

• How much time total would you estimate you spent on this vacancy?
```

**Current Solutions (3 min)**
```
• What tools do you use today? (TurboTenant, spreadsheets, etc.)

• Have you tried any automation or AI tools?

• Have you ever paid for help with this? (VA, property manager, software)

• What did you pay, and was it worth it?
```

**Workarounds & Pain Intensity (3 min)**
```
• What's your current system for filtering inquiries?

• Have you ever just ignored most messages because there were too many?

• If you could wave a magic wand and fix one part of this process,
  what would it be?

• On a scale of 1-10, how painful is the inquiry/showing process?
```

**Commitment Signals (2 min)**
```
• If a tool existed that auto-responded to inquiries, qualified them,
  and only sent you the serious ones with showings already scheduled -
  would that be interesting?

• What would you expect to pay for something like that?

[If they seem interested:]
• I'm thinking of building something like this. Would you be open to
  trying an early version and giving feedback?

• Do you know other landlords who might have this problem?
  Would you intro me?
```

**Closing (1 min)**
```
This was super helpful. Anything else you think I should know about
being a landlord that I didn't ask about?

Thanks again - I'll keep you posted on what I learn.
```

### What to Listen For

**Strong Signals (Problem is Real):**
- "I get 50 messages and 45 are garbage"
- "I just ignore most of them now"
- "I've lost good tenants because I couldn't respond fast enough"
- "I drove out for a showing and they didn't show up - twice"
- "I'm already paying for [related tool]"
- "Yes, I'd try that" + offers to intro others

**Weak Signals (Problem Isn't Acute):**
- "It's annoying but I manage"
- "I only deal with this once a year, not a big deal"
- "My spouse handles all that"
- "I just call everyone back eventually"
- "Maybe I'd use it if it were free"

**Red Flags (Wrong Customer):**
- Uses a property manager
- Only has 1-2 units
- Rarely has vacancies
- Not price-sensitive (wealthy hobbyist landlord)

### Recording & Transcription

| Tool | Cost | Notes |
|------|------|-------|
| Otter.ai | Free tier | Auto-transcribe |
| Fireflies.ai | Free tier | Joins calls, transcribes |
| Zoom recording | Free | Manual transcription |
| Voice memo + Whisper | Free | DIY transcription |

### Time: 15-20 min per call × 5-10 calls = 2-4 hours + scheduling buffer

---

## Phase 4: Insight Synthesis

### What We're Doing
Extracting patterns from conversations to validate or invalidate hypotheses.

### Process

1. **Compile transcripts** - All interviews in one place

2. **AI summarization prompt:**
```
I conducted [X] customer discovery interviews with mid-size landlords
(5-20 units). Summarize:

1. What problems came up most frequently?
2. What's their current process for handling rental inquiries?
3. What have they already paid for or tried?
4. What objections or concerns did they raise?
5. Who seemed most interested vs. least interested?
6. What commitment signals did I get? (willing to try, intros offered, etc.)
7. Any surprises or things I didn't expect?

Transcripts:
[paste transcripts]
```

3. **Pattern scoring:**

| Assumption | Evidence For | Evidence Against | Verdict |
|------------|--------------|------------------|---------|
| Pain is real | X/10 said top-3 problem | Y/10 said it's fine | ? |
| Will pay $29/mo | X quoted higher, Y quoted lower | Z said "only if free" | ? |
| 5-20 units is right segment | X had the problem | Y didn't | ? |

4. **Update hypothesis document** with real data

### Time: 1-2 hours

---

## Phase 5: Decision

### Kill Criteria

| Assumption | Kill If... |
|------------|------------|
| Pain is real | <3/10 say this is a top-3 problem |
| Willingness to pay | <3/10 would pay $29/mo |
| Right segment | <50% of 5-20 unit landlords have the problem |
| Can reach them | <5% response rate on outreach |
| No blockers | Major technical or legal barrier discovered |

### Decision Matrix

| Signals | Action |
|---------|--------|
| Strong across the board | **Pursue** → Build MVP, onboard 3-5 pilots |
| Mixed signals | **Pivot** → Modify segment, pricing, or positioning; re-run Phase 2-3 |
| Weak signals | **Kill** → Return to Phase 1 with new vertical |

### If Pursuing: Next Steps

1. Build bare-minimum MVP (2-4 weeks)
2. Onboard 3-5 design partners (from interviews)
3. Concierge-style: do things manually at first
4. Iterate based on real usage
5. Charge money ASAP (validates real demand)

---

## Comparison: Our Approach vs. Best Practices

| Best Practice | Our Approach | Status |
|---------------|--------------|--------|
| Start with problem, not solution | Started with solution, pivoted | ⚠️ |
| Talk to real customers | Phase 3 covers this | ✅ Planned |
| Ask about past behavior (Mom Test) | Interview script focuses on this | ✅ Planned |
| Avoid hypotheticals | Script avoids "would you" questions | ✅ Planned |
| Look for existing spend/workarounds | Script asks about this | ✅ Planned |
| Seek commitment | Script asks for pilot + intros | ✅ Planned |
| 5-10 interviews before building | Phase 3 goal | ✅ Planned |
| State hypotheses clearly | Lean canvas + kill criteria | ✅ Done |
| Define kill criteria | Documented | ✅ Done |
| Rapid iteration | AI enables hours, not weeks | ✅ Done |

---

## What AI Research Can and Can't Do

### AI Research Is Good For (Phase 1)
- Rapid exploration of multiple verticals
- Competitive landscape mapping
- Synthesizing public information
- Generating testable hypotheses
- Pressure-testing ideas before customer calls
- Preparing better interview questions

### AI Research Cannot Replace (Phase 2-3)
- Actual customer conversations
- Behavioral data (what they've done, not opinions)
- Emotional intensity of pain
- Commitment signals (money, time, referrals)
- Objections you didn't anticipate
- The "aha" moments that only come from real dialogue

### The Hybrid Advantage

Traditional customer discovery is thorough but slow.

Pure AI research is fast but shallow.

The hybrid approach:
1. **AI first** - Explore broadly, don't waste weeks on dead ends
2. **Humans second** - Validate deeply, get real commitment
3. **AI again** - Synthesize insights, update hypothesis

---

## Sources & References

### Customer Discovery
- [The Mom Test](https://www.momtestbook.com/) - Rob Fitzpatrick
- [Lean B2B - Customer Discovery Guide](https://leanb2bbook.com/blog/customer-discovery-startup-guide/)
- [YC - How to Get and Test Ideas](https://www.ycombinator.com/library/7x-how-to-get-and-test-ideas)

### Market Research
- [AdvanceB2B - Customer Research Guide](https://www.advanceb2b.com/blog/customer-research-guide-b2b-saas)
- [Glorium Tech - Startup Market Research](https://gloriumtech.com/how-to-do-market-research-for-a-startup-without-wasting-your-runway/)

### Validation Frameworks
- [FasterCapital - Lean Startup Customer Validation](https://fastercapital.com/content/Customer-discovery-and-validation--Lean-Startup-Methodology--Customer-Validation-Strategies.html)
- [LinkedIn - Lean Startup Customer Discovery](https://www.linkedin.com/advice/1/how-do-you-use-lean-startup-customer-discovery)

### B2B SaaS Trends
- [ProductLed - State of B2B SaaS 2025](https://productled.com/blog/state-of-b2b-saas-2025-report)
- [AdvanceB2B - B2B Buyer Behavior](https://www.advanceb2b.com/blog/customer-research-guide-b2b-saas)
