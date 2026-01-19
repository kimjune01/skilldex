# Recruiter Guide

Welcome to Skilldex! This guide walks you through setting up and using Skilldex skills in your daily recruiting workflow.

## What is Skilldex?

Skilldex brings your recruiting tools into Claude Code. Instead of switching between LinkedIn, your ATS, email, and calendar, you can interact with all of them through natural language conversations with Claude.

**Example interactions:**
- "Find senior backend engineers in the Bay Area"
- "Add this candidate to our ATS with notes from our conversation"
- "Draft a follow-up email for candidates who interviewed last week"
- "Schedule an interview with John for next Tuesday"

## Getting Started

### Step 1: Create Your Account

1. Navigate to your company's Skilldex instance (e.g., `https://skilldex.yourcompany.com`)
2. Log in with your company credentials or create an account
3. You'll land on the Dashboard showing available skills and integrations

### Step 2: Connect Your Integrations

Before using skills, connect the services you need:

1. Go to **Integrations** in the sidebar
2. Click **Connect** for each service you want to use:
   - **ATS** - Your Applicant Tracking System
   - **LinkedIn** - For profile lookups (uses browser automation)
   - **Email** - For drafting and sending emails
   - **Calendar** - For scheduling interviews
   - **Granola** - For meeting notes sync

Note: Some integrations require OAuth authorization. You'll be redirected to the service to grant access.

### Step 3: Generate an API Key

Skills authenticate using an API key:

1. Go to **API Keys** in the sidebar
2. Click **Generate Key**
3. Give it a descriptive name (e.g., "Work Laptop")
4. **Copy the key immediately** - you'll need it in the next step

### Step 4: Set Up Your Environment

Add the API key to your shell profile:

```bash
# Add to ~/.zshrc or ~/.bashrc
export SKILLDEX_API_KEY="sk_live_your_key_here"
```

Then reload your shell:
```bash
source ~/.zshrc
```

### Step 5: Download Skills

1. Go to **Skills** in the sidebar
2. Browse available skills by category
3. Click on a skill to see details and requirements
4. Click **Download Skill**
5. Move the downloaded file to your Claude commands directory:

```bash
mv ~/Downloads/linkedin-lookup.md ~/.claude/commands/
```

Repeat for each skill you want to use.

## Using Skills

Once set up, you can use skills in Claude Desktop or Claude Code:

### LinkedIn Candidate Search

Find candidates on LinkedIn matching a job description. Simply paste your JD:

```
/linkedin-lookup

**Senior Backend Engineer**

We're looking for a Senior Backend Engineer to join our platform team.

Requirements:
- 5+ years backend development experience
- Strong Python and Go experience
- Experience with distributed systems
- PostgreSQL and Redis expertise
- Located in SF Bay Area or willing to relocate

Nice to have:
- Kubernetes experience
- Previous startup experience
- Open source contributions
```

Claude will:
1. Analyze the job description to extract key requirements
2. Build multiple LinkedIn search queries
3. Search for matching profiles
4. Present candidates ranked by fit (Strong/Good/Possible matches)

### ATS Candidate Search

Search your ATS for existing candidates who match a job description. Always check your ATS first before sourcing new candidates:

```
/ats-candidate-search

**Product Designer**

We need a Product Designer for our mobile team.

Requirements:
- 3+ years product design experience
- Strong Figma skills
- Mobile app design experience (iOS/Android)
- Experience with design systems
- Portfolio demonstrating user-centered design

Nice to have:
- Motion design / prototyping
- User research experience
- Startup experience
```

Claude will:
1. Extract skills, experience level, and requirements from the JD
2. Run multiple targeted queries against your ATS
3. Score and rank candidates by fit
4. Present results with fit analysis (matching qualifications and potential gaps)

### ATS CRUD Operations

Manage candidates in your ATS:

```
/ats-candidate-crud
```

**Example actions:**
- "Add a new candidate named Jane Doe, email jane@example.com"
- "Update the status of candidate #123 to 'Interview Scheduled'"
- "Add a note to Sarah's profile about our phone screen"

### Email Draft

Draft emails to candidates:

```
/email-draft
```

**Example prompts:**
- "Draft a rejection email for candidates who didn't pass the technical round"
- "Write a follow-up email to schedule a final interview"
- "Create a welcome email for our new hire starting Monday"

### Interview Scheduler

Schedule interviews:

```
/interview-scheduler
```

**Example prompts:**
- "Schedule a 1-hour interview with Mike for next Tuesday afternoon"
- "Find available slots for a panel interview with 3 interviewers"
- "Reschedule tomorrow's interview to Thursday"

## Tips for Effective Use

### Provide Complete Job Descriptions
The more detail in your JD, the better results you'll get:

- ❌ Vague: "Find engineers"
- ✅ Complete JD with requirements, experience level, location, and nice-to-haves

### Distinguish Must-Haves vs Nice-to-Haves
Skills can prioritize better when requirements are clearly categorized:

```
Requirements:
- 5+ years Python experience (must have)
- AWS or GCP experience (must have)

Nice to have:
- Kubernetes experience
- Previous startup experience
```

### Search ATS First, Then LinkedIn
Always check your ATS for existing candidates before sourcing new ones:

1. Paste JD into `/ats-candidate-search` - find warm leads already in your pipeline
2. Review and re-engage promising ATS candidates
3. Use `/linkedin-lookup` with the same JD to find new candidates

### Chain Actions
Claude remembers context within a conversation. You can chain actions:

1. Paste JD to search for candidates
2. "Add the top 3 to our ATS as prospects"
3. "Draft an outreach email for them"

### Use Notes
When adding candidates or updating records, include relevant notes:

- "Add John to ATS with note: Strong React skills, interested in remote work, available to start in 2 weeks"

### Review Before Sending
For emails and calendar invites, Claude will show you a draft before sending. Always review for accuracy and tone.

## Troubleshooting

### "Missing or invalid API key"

Your API key isn't set correctly:
1. Check that `SKILLDEX_API_KEY` is in your shell profile
2. Run `echo $SKILLDEX_API_KEY` to verify it's set
3. Make sure you copied the full key (starts with `sk_live_`)

### "Integration not connected"

The skill requires an integration you haven't set up:
1. Go to **Integrations** in Skilldex
2. Connect the required service
3. Try the skill again

### "Skill not found"

The skill file isn't in the right location:
1. Check that the `.md` file is in `~/.claude/commands/`
2. Verify the filename matches the skill slug

### LinkedIn lookup not working

LinkedIn lookup uses browser automation and requires the Linky Scraper extension:
1. Run `/linky-addon-setup` to install and configure the Linky Scraper browser extension
2. Alternatively, manually install from [linky-scraper-addon](https://github.com/kimjune01/linky-scraper-addon)
3. Make sure you're logged into LinkedIn in your browser
4. Some profiles may be restricted based on your LinkedIn account

## Getting Help

- **Technical issues**: Contact your Skilldex administrator
- **Feature requests**: Use the `/propose-new-skill` skill to suggest new capabilities
- **Bug reports**: Report issues to your admin or the Skilldex team

## Privacy & Security

- Skills only access data you've authorized through integrations
- Your API key is unique to you - never share it
- All API calls are logged for audit purposes
- You can revoke API keys anytime from the dashboard
