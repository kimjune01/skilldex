# Outbound Sales Campaign Demo

Mobile-first demo showing solopreneurs/freelancers how to run outbound campaigns from their phone.

## Purpose

Dual-purpose:
1. **Product demo** - Show Skillomatic's value prop
2. **Actual outreach** - Use it to acquire customers

## Target Audience

| Segment | Gmail Signals | Pain Point |
|---------|---------------|------------|
| Freelancers | Invoices, client emails, project threads | "Chasing leads while doing the work" |
| Solopreneurs | Newsletter replies, customer support, sales convos | "No time for follow-up" |
| Small agencies | Multiple client threads, proposals, contracts | "Leads go cold while servicing clients" |

## The Pitch

> "Set it up from your phone in 2 minutes. It runs every day without you."

## Demo Flow (Single Device)

Record mobile screen, switch between chat app and Sheets:

### Scene 1: Find Warm Contacts
- **Chat**: "Find warm contacts in my Gmail I haven't talked to in 30 days"
- **Switch to Sheets**: See prospects populated with names, emails, last contact date

### Scene 2: Start Campaign
- **Chat**: "Add them to my outbound campaign, send opening emails tomorrow at 9am"
- **Switch to Sheets**: See campaign with "scheduled" status

### Scene 3: Next Day (or fake timestamp)
- **Chat**: "Check my campaign"
- **Response**: Shows emails sent, 2 replies received
- **Switch to Sheets**: Pipeline updated, stages moved automatically

## Campaign Stages

Simple funnel that matches real outbound:

1. **Prospect** - Warm contact identified
2. **Opening Email** - First touch sent
3. **Follow-up** - No reply, follow-up sent
4. **Replied** - Got a response
5. **Qualified** - Fits criteria, interested
6. **Meeting Scheduled** - Call booked
7. **Closed** - Won or lost

## Skills Required

### 1. Warm Prospector (to build)
- Scan Gmail for warm contacts (past convos, no recent activity)
- Filter by days since last contact
- Output: Name, email, context snippet, last contact date

### 2. Campaign Manager (to build)
- Add prospects to campaign Sheet
- Draft personalized opening emails using conversation history
- Track stages, update based on replies
- Schedule sends via cron

### 3. Daily Outbound (to build - scheduled)
- Runs automatically via cron
- "Send opening emails to new prospects"
- "Follow up with anyone who hasn't replied in 3 days"
- "Check for replies and update pipeline"

## Google Sheet Template

Keep it simple for mobile viewing:

| Name | Email | Stage | Last Touch | Next Action |
|------|-------|-------|------------|-------------|
| Jane Smith | jane@acme.co | Opening Email | Jan 28 | Follow-up Jan 31 |
| Bob Chen | bob@startup.io | Replied | Jan 27 | Send qualifier |

## Recording Tips

- [ ] Close other apps (clean app switcher)
- [ ] Pre-open Sheet to correct tab
- [ ] Turn on Do Not Disturb
- [ ] Full battery or hide status bar
- [ ] Use WiFi (faster API responses)
- [ ] Keep it casual - real usage, not polished ad

## Distribution

- Twitter/X (solopreneur audience)
- LinkedIn (freelancers, small agencies)
- Indie Hackers
- Reddit (r/freelance, r/entrepreneur, r/smallbusiness)

## Technical Notes

- Cron jobs already set up for scheduled skills
- Works with Claude (via MCP) or ChatGPT (via API)
- Sheet updates happen server-side, visible on any device
