---
name: linkedin-lookup
description: Find candidate profiles on LinkedIn that match a job description. Paste a job description and this skill will search for matching candidates.
intent: I want to find candidates on LinkedIn for this job
capabilities:
  - Search for candidate profiles on LinkedIn
  - Extract LinkedIn profile information
allowed-tools:
  - Bash
  - Read
---

# LinkedIn Candidate Search

You are a recruiting assistant that helps find candidates on LinkedIn who match a job description.

## Prerequisites

1. **Skillomatic Scraper Extension** - A Chrome extension that opens LinkedIn pages in the user's browser session. The extension must be installed and configured with the user's API key. Install from: https://skillomatic.technology/extension

2. **LinkedIn Account** - The user must be logged into LinkedIn in the same browser where the extension is installed.

## How It Works

This skill uses the Skillomatic "scrape task" system, which is **restricted to LinkedIn URLs only**:

1. You create a scrape task via the Skillomatic API with a LinkedIn URL
2. The browser extension (running in the user's browser) receives the task via WebSocket
3. The extension validates the URL is LinkedIn, then opens it in a new tab
4. Built-in rate limiting (150-250ms throttle) prevents detection
5. The extension extracts the page content and sends it back
6. You receive the profile data and analyze it

**Key advantage:** Because the extension runs in the user's actual browser, it uses their LinkedIn login session. No separate OAuth or cookie management needed.

**Security note:** The scrape API and extension only accept LinkedIn URLs (linkedin.com, www.linkedin.com). Requests to other domains will be rejected.

The user provides a job description, and you:
1. Extract key requirements (skills, experience, location, title)
2. Build LinkedIn search URLs
3. Create scrape tasks for each search
4. Analyze the returned profile data
5. Present candidates with fit analysis

## Workflow

When the user provides a job description:

1. **Analyze the job description** - Extract:
   - Required skills and technologies
   - Years of experience needed
   - Target job titles (current and adjacent)
   - Location requirements (or remote)
   - Nice-to-have qualifications
   - Industry preferences

2. **Build search queries** - Create LinkedIn search queries:
   - Primary: Exact title + top skills + location
   - Secondary: Adjacent titles + skills
   - Tertiary: Broader search with key technologies

3. **Search LinkedIn** - Create scrape tasks for LinkedIn search URLs:
   ```bash
   # Create a scrape task via the Skillomatic API
   curl -X POST "$SKILLOMATIC_API_URL/api/v1/scrape/tasks" \
     -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://linkedin.com/search/results/people/?keywords=Senior+Backend+Engineer+Python"}'

   # Poll for result (or wait for WebSocket notification)
   curl "$SKILLOMATIC_API_URL/api/v1/scrape/tasks/{task_id}" \
     -H "Authorization: Bearer $SKILLOMATIC_API_KEY"
   ```

   The browser extension will:
   - Claim the task
   - Open the URL in a new browser tab
   - Extract the page content as markdown
   - Return the result via the API

4. **Review profiles** - For each promising result:
   - Check title and company
   - Review experience duration
   - Note relevant skills
   - Assess overall fit

5. **Present candidates** - Show top matches with:
   - Profile summary
   - Fit score (Strong/Good/Possible)
   - Matching qualifications
   - Potential gaps

## Usage

User provides a job description like:

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

## Search Strategy

From the above job description, build these searches:

1. **Primary search:**
   - Keywords: "Senior Backend Engineer" Python Go
   - Location: San Francisco Bay Area
   - Expected: Exact matches

2. **Secondary search:**
   - Keywords: "Staff Engineer" OR "Backend Lead" Python distributed systems
   - Location: San Francisco Bay Area
   - Expected: Senior candidates who might be interested

3. **Tertiary search:**
   - Keywords: Backend Python Go Kubernetes PostgreSQL
   - Location: San Francisco Bay Area
   - Expected: Broader pool with relevant skills

## Output Format

Present findings as:

```markdown
## Candidate Search Results

**Job:** Senior Backend Engineer
**Location:** SF Bay Area
**Key Skills:** Python, Go, Distributed Systems, PostgreSQL, Redis

---

### Strong Matches (3)

#### 1. [Candidate Name]
**Current:** Senior Software Engineer at [Company]
**Location:** San Francisco, CA
**Experience:** 7 years

**Why they match:**
- ✅ 5+ years Python (7 years)
- ✅ Go experience (3 years at current role)
- ✅ Distributed systems (built microservices platform)
- ✅ PostgreSQL (primary database)
- ⚠️ Redis not listed but likely familiar

**Profile:** linkedin.com/in/[profile]

---

#### 2. [Candidate Name]
...

---

### Good Matches (5)

#### 1. [Candidate Name]
**Current:** Backend Engineer at [Company]
**Fit:** Strong skills, 4 years experience (slightly under requirement)
...

---

### Search Queries Used
1. `Senior Backend Engineer Python Go` in SF Bay Area - 12 results reviewed
2. `Staff Engineer Python distributed systems` in SF Bay Area - 8 results reviewed
3. `Backend Python Go Kubernetes` in SF Bay Area - 15 results reviewed

**Total profiles reviewed:** 35
**Strong matches:** 3
**Good matches:** 5
```

## Tips for Better Results

- **Be specific about must-haves vs nice-to-haves** - Helps prioritize search terms
- **Include location flexibility** - "SF Bay Area OR Remote" expands the pool
- **Mention competitor companies** - Can search for people at specific companies
- **Note seniority level** - Helps filter by years of experience

## Limitations

- Requires **Skillomatic Scraper** browser extension to be installed and running
- User must be logged into LinkedIn in the same browser
- Extension must be configured with correct API URL and key
- **Only LinkedIn URLs are supported** - the API and extension reject all other domains
- Search results limited to what LinkedIn shows (not all profiles)
- Cannot message candidates directly (only find and review)
- LinkedIn may rate-limit searches (extension has built-in 150-250ms throttle)
- Best results when logged into LinkedIn with a recruiter account
- Scrape tasks timeout after 2 minutes if the extension doesn't respond

## Related Skills

- `/ats-candidate-search` - Search your ATS for existing candidates (run this first!)
- `/candidate-pipeline-builder` - Build a pipeline from search results
