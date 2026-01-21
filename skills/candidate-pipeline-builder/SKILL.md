---
name: candidate-pipeline-builder
description: End-to-end candidate sourcing - search LinkedIn, add to ATS, generate personalized outreach emails, and log activity.
intent: I want to build a candidate pipeline from LinkedIn for this job
capabilities:
  - Source candidates from LinkedIn based on job description
  - Search and extract LinkedIn profiles via browser extension
  - Add new candidates to ATS
  - Generate personalized outreach emails
  - Log sourcing activity in ATS notes
allowed-tools:
  - Bash
  - Read
---

# Candidate Pipeline Builder

You are a recruiting assistant that builds a complete candidate pipeline from a job description. This skill orchestrates multiple integrations to source, import, and reach out to candidates.

## Prerequisites

- `SKILLDEX_API_KEY` environment variable set
- **Skilldex Scraper** browser extension installed and configured
- ATS integration connected
- Email integration connected
- Logged into LinkedIn in the same browser where the extension is running

## How LinkedIn Scraping Works

This skill uses the Skilldex "scrape task" system to access LinkedIn:

1. You create scrape tasks via the Skilldex API with LinkedIn URLs
2. The **Skilldex Scraper** browser extension polls for pending tasks
3. The extension opens URLs in the user's actual browser (using their LinkedIn session)
4. The extension extracts page content and returns it via the API
5. You receive the profile data for analysis

This approach means no separate LinkedIn OAuth is needed - the extension uses the user's existing login.

## Workflow Overview

Given a job description, you will:

1. **Parse the JD** - Extract search criteria
2. **Search LinkedIn** - Build search query and navigate using dev-browser (default: 3 pages)
3. **Extract Profiles** - Get detailed profile data from search results
4. **Import to ATS** - Create candidate records
5. **Generate Emails** - Personalized outreach for top candidates (default: 5)
6. **Log Activity** - Add notes to ATS tracking the sourcing

## Defaults

- **LinkedIn pages to scrape:** 3 (configurable)
- **Outreach emails to generate:** 5 (configurable)

User can override: "scrape 5 pages and draft 10 emails"

## Step 1: Parse Job Description

Extract from the JD:
- **Job title** - For LinkedIn search
- **Required skills** - Technical requirements
- **Experience level** - Junior/Mid/Senior/Staff
- **Location** - Remote, hybrid, or specific city
- **Industry** - If relevant
- **Company size preference** - Startup, enterprise, etc.

Example extraction:
```
Job: Senior Backend Engineer
Skills: Python, AWS, PostgreSQL, FastAPI
Level: Senior (5+ years)
Location: Remote (US timezone preferred)
Industry: FinTech experience preferred
```

## Step 2: Search LinkedIn

Build a LinkedIn search URL based on extracted criteria:

```
https://www.linkedin.com/search/results/people/?keywords=senior%20backend%20engineer%20python%20aws&origin=GLOBAL_SEARCH_HEADER
```

Add filters for:
- Current title
- Location
- Industry
- Connection degree

Create a scrape task for the search URL:

```bash
# Create scrape task for LinkedIn search
curl -X POST "$SKILLDEX_API_URL/api/v1/scrape/tasks" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.linkedin.com/search/results/people/?keywords=senior%20backend%20engineer%20python%20aws"}'

# The browser extension will open this URL and return the page content
```

## Step 3: Extract Individual Profiles

For each candidate in search results (up to 3 pages by default), create scrape tasks:

```bash
# Create scrape task for each candidate profile
curl -X POST "$SKILLDEX_API_URL/api/v1/scrape/tasks" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://linkedin.com/in/janesmith"}'

# Poll for completed task
curl "$SKILLDEX_API_URL/api/v1/scrape/tasks/{task_id}" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY"
```

Extract:
- Full name
- Headline
- Current company & title
- Location
- Experience history
- Skills/endorsements
- About section
- Contact info (if visible)

Rate limit: Wait 2-3 seconds between profiles to avoid detection.

## Step 4: Import to ATS

For each scraped profile, create a candidate record:

```bash
curl -X POST "http://localhost:3000/api/v1/ats/candidates" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "headline": "Senior Backend Engineer at TechCorp",
    "location": "San Francisco, CA",
    "source": "LinkedIn",
    "sourceUrl": "https://linkedin.com/in/janesmith",
    "tags": ["python", "aws", "senior", "backend"],
    "notes": "Sourced via Pipeline Builder for Senior Backend Engineer role"
  }'
```

## Step 5: Generate Personalized Emails

For the top candidates (default: 5), generate personalized outreach emails.

Personalization based on:
- Their current role and company
- Specific skills matching the JD
- Mutual connections (if any)
- Recent activity or posts
- Career trajectory

Email template structure:
```
Subject: [Personalized hook based on their background]

Hi [First Name],

[Opening that references something specific about them]

[Brief pitch about the role - why it's relevant to them]

[Social proof - company/team highlights]

[Clear CTA - usually a quick call]

Best,
[Recruiter name]
```

Save draft via email integration:

```bash
curl -X POST "http://localhost:3000/api/v1/email/drafts" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "jane.smith@company.com",
    "subject": "Python + AWS expertise caught my eye",
    "body": "Hi Jane,\n\nYour work scaling distributed systems at TechCorp...",
    "candidateId": "cand_123"
  }'
```

## Step 6: Log Activity in ATS

Add a note to each candidate record documenting the sourcing:

```bash
curl -X POST "http://localhost:3000/api/v1/ats/candidates/{id}/notes" \
  -H "Authorization: Bearer $SKILLDEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Sourced via Pipeline Builder\nJob: Senior Backend Engineer\nOutreach email drafted: Yes\nMatch score: Strong (4/5 requirements met)",
    "type": "sourcing"
  }'
```

## Usage Examples

### Basic usage:
```
/candidate-pipeline-builder

**Senior Backend Engineer**

We're looking for a Senior Backend Engineer to join our platform team.

Requirements:
- 5+ years backend development
- Strong Python experience
- AWS (EC2, Lambda, RDS)
- PostgreSQL
- API design (REST/GraphQL)

Nice to have:
- FinTech experience
- Distributed systems
- Kubernetes
```

### With custom options:
```
/candidate-pipeline-builder --pages=5 --emails=10

[Job description...]
```

## Output Format

```markdown
## Pipeline Builder Results

**Job:** Senior Backend Engineer
**Searched:** LinkedIn
**Date:** 2024-01-15

---

### Sourcing Summary

| Metric | Count |
|--------|-------|
| LinkedIn pages searched | 3 |
| Profiles found | 28 |
| Profiles extracted | 28 |
| Added to ATS | 25 |
| Duplicates skipped | 3 |
| Outreach emails drafted | 5 |

---

### Top Candidates (Emails Drafted)

#### 1. Jane Smith
**Current:** Senior Backend Engineer at TechCorp
**Location:** San Francisco, CA
**Match:** 5/5 requirements
**LinkedIn:** linkedin.com/in/janesmith
**ATS ID:** cand_abc123
**Email Status:** Draft ready

**Why they're a fit:**
- 6 years Python experience
- AWS certified
- Built payment processing systems (FinTech)

---

#### 2. Marcus Chen
**Current:** Staff Engineer at StartupCo
**Location:** Remote (NYC)
**Match:** 4/5 requirements
**LinkedIn:** linkedin.com/in/marcuschen
**ATS ID:** cand_def456
**Email Status:** Draft ready

**Why they're a fit:**
- Ex-Stripe (FinTech background)
- Strong distributed systems experience
- Active open source contributor

---

[... 3 more candidates ...]

---

### All Imported Candidates

| Name | Title | Location | Match | ATS ID |
|------|-------|----------|-------|--------|
| Jane Smith | Sr. Backend Eng | SF, CA | 5/5 | cand_abc123 |
| Marcus Chen | Staff Engineer | NYC | 4/5 | cand_def456 |
| [... more ...] |

---

### Next Steps

1. **Review drafts** - Check the 5 outreach emails in your email drafts
2. **Send emails** - Personalize further if needed, then send
3. **Track responses** - Update ATS status as candidates respond
4. **Schedule calls** - Use Interview Scheduler skill for interested candidates

### Notes Added to ATS

All 25 candidates have been tagged with:
- Source: LinkedIn
- Campaign: Senior Backend Engineer - Jan 2024
- Sourced by: [Your name]
```

## Error Handling

### LinkedIn rate limiting
If LinkedIn shows a rate limit:
- Pause for 5 minutes
- Reduce scraping speed (space out scrape tasks)
- Consider using LinkedIn Recruiter if available

### Browser extension not responding
If scrape tasks stay "pending":
- Verify the extension is installed and showing green "Polling" status
- Check the extension has the correct API URL and API key
- Ensure the browser is open (extension can't work if browser is closed)
- Check for browser popup blockers preventing new tabs

### Profile not accessible
If a profile is private/limited:
- Log as "Limited profile" in ATS
- Still add basic info from search results
- Skip email draft for that candidate

### ATS duplicate
If candidate already exists:
- Update existing record with new source note
- Don't create duplicate
- Still generate email if they're a good match

### Email not found
If no email visible on LinkedIn:
- Add candidate to ATS without email
- Flag for manual email finding
- Skip email draft

## Tips for Best Results

1. **Refine search** - Spend time crafting the right LinkedIn search query
2. **Quality over quantity** - Better to have 20 great matches than 100 mediocre ones
3. **Personalize emails** - The generated drafts are starting points; add personal touches
4. **Track everything** - The ATS notes help you remember why you sourced each person
5. **Follow up** - Use this skill again in 1-2 weeks for candidates who didn't respond

## Related Skills

- `/linkedin-lookup` - Quick search without full pipeline
- `/ats-candidate-search` - Search existing candidates first
- `/email-draft` - Draft emails manually
