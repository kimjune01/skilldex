---
name: ats-candidate-crud
description: Create, update, and manage candidates in your ATS. Use when the user wants to add a new candidate, update candidate information, or manage applications.
intent: I want to manage candidates in my ATS
capabilities:
  - Create new candidates
  - Update candidate information
  - Move candidates through pipeline
requires:
  ats: read-write
allowed-tools:
  - Bash
  - Read
---

# ATS Candidate Management

You are a recruiting assistant that helps manage candidates in the ATS (Applicant Tracking System).

## Prerequisites

- You need a Skillomatic API key set as `SKILLOMATIC_API_KEY` environment variable
- The Skillomatic API must be running and accessible

## API Endpoints

Base URL: `http://localhost:3000/api/v1/ats` (or your Skillomatic instance)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /candidates/:id | Get candidate details |
| POST | /candidates | Create new candidate |
| PUT | /candidates/:id | Update candidate |
| GET | /jobs | List open jobs |
| GET | /applications | List applications |
| POST | /applications/:id/stage | Move application stage |

## Authentication

```bash
-H "Authorization: Bearer $SKILLOMATIC_API_KEY"
```

## Operations

### Get Candidate Details

```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "http://localhost:3000/api/v1/ats/candidates/cand_001"
```

### Create New Candidate

```bash
curl -s -X POST \
  -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "headline": "Software Engineer",
    "source": "sourced",
    "tags": ["javascript", "react"]
  }' \
  "http://localhost:3000/api/v1/ats/candidates"
```

### Update Candidate

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Senior Software Engineer",
    "tags": ["javascript", "react", "senior"]
  }' \
  "http://localhost:3000/api/v1/ats/candidates/cand_001"
```

### Move Application Stage

```bash
curl -s -X POST \
  -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "Technical Interview",
    "status": "interview"
  }' \
  "http://localhost:3000/api/v1/ats/applications/app_001/stage"
```

### List Open Jobs

```bash
curl -s -H "Authorization: Bearer $SKILLOMATIC_API_KEY" \
  "http://localhost:3000/api/v1/ats/jobs?status=open"
```

## Output Formats

### Candidate Created
```markdown
## Candidate Created Successfully

- **ID:** [candidate_id]
- **Name:** [firstName] [lastName]
- **Email:** [email]
- **Headline:** [headline]

The candidate has been added to your ATS.
```

### Candidate Updated
```markdown
## Candidate Updated

Updated [field1], [field2] for [Name].
```

### Application Stage Changed
```markdown
## Application Stage Updated

Moved [Candidate Name] from "[old stage]" to "[new stage]" for [Job Title].
```

## Candidate Fields

| Field | Required | Description |
|-------|----------|-------------|
| firstName | Yes | First name |
| lastName | Yes | Last name |
| email | Yes | Email address |
| phone | No | Phone number |
| headline | No | Professional headline |
| summary | No | Summary/bio |
| location | No | Object: {city, state, country} |
| source | No | applied, sourced, referral, agency |
| tags | No | Array of skill/attribute tags |

## Error Handling

- **401 Unauthorized**: API key missing or invalid
- **404 Not Found**: Candidate/application doesn't exist
- **400 Bad Request**: Missing required fields
