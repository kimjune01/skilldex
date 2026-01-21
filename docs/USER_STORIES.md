# Skilldex User Stories

## Overview

This document captures user stories for the Skilldex platform from two primary personas:
- **Recruiter**: End user who uses Claude Code skills to perform recruiting tasks
- **Admin/Consultant**: Sets up and manages the Skilldex instance for a company

Each story follows the format: *As a [persona], I want to [action], so that [benefit].*

---

## Section 1: Admin/Consultant Setup Stories

### Story 1.1: Initial Platform Deployment
**Persona:** Admin/Consultant
**Phase:** Setup

> As an admin, I want to deploy Skilldex using Docker Compose, so that I can quickly set up the platform for a client company.

**Acceptance Criteria:**
- [ ] Single `docker-compose up` command starts all services
- [ ] Environment variables are documented in `.env.example`
- [ ] Health check endpoints confirm all services are running
- [ ] No external dependencies required beyond Docker

**Notes:** This is typically done once per client company by the consultant.

---

**Status:** ✅ Approved

---

### Story 1.2: Configure Integration Providers
**Persona:** Admin/Consultant
**Phase:** Setup

> As an admin, I want to configure OAuth credentials for integrations (LinkedIn, ATS, Calendar), so that recruiters can connect their accounts securely.

**Acceptance Criteria:**
- [ ] Admin panel has "Integration Providers" configuration page
- [ ] Can add OAuth client ID/secret for each provider
- [ ] Credentials stored securely (encrypted or via Nango)
- [ ] Can test connection before enabling for users
- [ ] Providers can be enabled/disabled globally

**Notes:** Nango handles the OAuth flow complexity. Admin only needs to input credentials from each provider's developer console.

**Status:** ✅ Approved

---

### Story 1.3: Create Recruiter Accounts
**Persona:** Admin/Consultant
**Phase:** Setup

> As an admin, I want to create user accounts for recruiters, so that they can access the platform and use skills.

**Acceptance Criteria:**
- [ ] Admin panel has "Users" management page
- [ ] Can create new user with email, name, temporary password
- [ ] Can assign roles to users (recruiter, viewer, admin)
- [ ] Can disable/enable user accounts
- [ ] User receives welcome email with login instructions (Phase 2)

**Notes:** MVP uses simple password auth. Future phases may add SSO/SAML for enterprise clients.

**Status:** ✅ Approved

---

### Story 1.4: Manage Skills and Role Assignments
**Persona:** Admin/Consultant
**Phase:** Setup

> As an admin, I want to assign skills to roles, so that users with specific roles have access to the appropriate skills.

**Acceptance Criteria:**
- [ ] Admin panel has "Skills" management page
- [ ] Can view all available skills with descriptions
- [ ] Can assign skills to one or more roles (many-to-many relationship)
- [ ] Can see which roles have access to each skill
- [ ] Users only see skills associated with their assigned roles
- [ ] Can see which integrations each skill requires

**Notes:** Skills ↔ Roles is a many-to-many relationship. A "Senior Recruiter" role might have access to more skills than a "Junior Recruiter" role.

**Status:** ✅ Approved

---

## Section 2: Recruiter Setup Stories

### Story 2.1: First-Time Login and Password Change
**Persona:** Recruiter
**Phase:** Setup

> As a recruiter, I want to log in with my temporary password and set a new one, so that my account is secure.

**Acceptance Criteria:**
- [ ] Can log in with email and temporary password from admin
- [ ] Prompted to change password on first login
- [ ] Password requirements clearly displayed (min length, complexity)
- [ ] Redirected to dashboard after successful password change

**Notes:** Simple email/password flow for MVP. No email verification required initially.

**Status:** ✅ Approved

---

### Story 2.2: Connect Personal Integrations
**Persona:** Recruiter
**Phase:** Setup

> As a recruiter, I want to connect my LinkedIn, calendar, and email accounts, so that skills can access these services on my behalf.

**Acceptance Criteria:**
- [ ] Dashboard shows "Integrations" page with available providers
- [ ] Can initiate OAuth flow for each provider (LinkedIn, Google Calendar, etc.)
- [ ] Clear status indicator: Connected / Disconnected / Error
- [ ] Can disconnect an integration at any time
- [ ] Shows last sync time for connected integrations

**Notes:** OAuth handled by Nango. Recruiter only clicks "Connect" and completes the provider's auth flow.

**Status:** ✅ Approved

---

### Story 2.3: Generate API Key for Claude Desktop
**Persona:** Recruiter
**Phase:** Setup

> As a recruiter, I want to generate an API key, so that I can authenticate skills running in Claude Desktop.

**Acceptance Criteria:**
- [ ] Dashboard shows "API Keys" page
- [ ] Can generate a new API key with a descriptive name
- [ ] Can view full key anytime (with copy to clipboard button)
- [ ] Clear instructions on where to store the key (`SKILLDEX_API_KEY` env var)
- [ ] Can view list of existing keys with full key visible
- [ ] Can revoke keys at any time

**Notes:** Full API key is stored and can be retrieved anytime by the user.

**Status:** ✅ Approved

---

### Story 2.4: Download Sync Skill and Sync All Skills
**Persona:** Recruiter
**Phase:** Setup

> As a recruiter, I want to download a single "sync" skill that fetches all my available skills, so that I can easily keep my skills up to date.

**Acceptance Criteria:**
- [ ] Dashboard shows a single "Download Sync Skill" button
- [ ] Sync skill file includes instructions for placement (`~/.claude/commands/skilldex/`)
- [ ] When executed, sync skill uses `SKILLDEX_API_KEY` to authenticate
- [ ] Sync skill calls API to fetch all skills available to user's role(s)
- [ ] Sync skill writes/updates skill files to `~/.claude/commands/skilldex/`
- [ ] Sync skill removes skills that user no longer has access to

**Notes:** Only one download required. Running `/skilldex-sync` in Claude Desktop keeps all skills current with the server.

**Status:** ✅ Approved

---

## Section 3: Recruiter Operation Stories

### Story 3.1: Search Candidates in ATS
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to search for candidates in the ATS using natural language in Claude Desktop, so that I can quickly find relevant candidates.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/ats-candidate-search` in Claude Desktop
- [ ] Skill accepts natural language queries (e.g., "senior engineers in San Francisco")
- [ ] Skill calls Skilldex API with search parameters
- [ ] Results displayed in readable format with key candidate info
- [ ] Can refine search with follow-up prompts

**Notes:** Skill authenticates via `SKILLDEX_API_KEY`. API proxies to connected ATS.

**Status:** ✅ Approved

---

### Story 3.2: Create and Update Candidates
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to create and update candidate records via Claude Desktop, so that I can manage candidates without switching to the ATS UI.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/ats-candidate-crud` in Claude Desktop
- [ ] Can create new candidate with name, email, phone, resume notes
- [ ] Can update existing candidate fields
- [ ] Skill confirms changes before submitting to ATS
- [ ] Success/failure feedback displayed clearly

**Notes:** Write operations require appropriate role permissions.

**Status:** ✅ Approved

---

### Story 3.3: Look Up Candidate on LinkedIn
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to look up a candidate's LinkedIn profile, so that I can gather additional information about them.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/linkedin-lookup` in Claude Desktop
- [ ] Can search by name, company, or LinkedIn URL
- [ ] Skill uses dev-browser for browser automation and data extraction
- [ ] Returns profile summary, current role, experience highlights
- [ ] Works with recruiter's existing LinkedIn session in browser

**Notes:** Uses the dev-browser skill for LinkedIn scraping via browser automation. No separate extension needed.

**Status:** ✅ Approved

---

### Story 3.4: Draft Outreach Email
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to draft personalized outreach emails to candidates, so that I can engage them efficiently.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/email-draft` in Claude Desktop
- [ ] Can specify candidate name, role, and key talking points
- [ ] Skill generates personalized email draft based on context
- [ ] Can iterate on tone, length, and content with follow-up prompts
- [ ] Can copy final draft to clipboard or send via connected email

**Notes:** Stub skill for MVP. Full implementation would integrate with email provider via Nango.

**Status:** ✅ Approved

---

### Story 3.5: Schedule Interview
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to schedule interviews by finding available time slots, so that I can coordinate between candidates and hiring managers.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/interview-scheduler` in Claude Desktop
- [ ] Can specify candidate, interviewer(s), duration, and date range
- [ ] Skill checks calendar availability via connected calendar integration
- [ ] Suggests available time slots that work for all parties
- [ ] Can create calendar invite with meeting details

**Notes:** Stub skill for MVP. Full implementation would integrate with Google Calendar/Outlook via Nango.

**Status:** ✅ Approved

---

### Story 3.6: Capture Meeting Notes
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to capture and summarize interview meeting notes, so that I can document candidate feedback efficiently.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/meeting-notes` in Claude Desktop
- [ ] Can input raw meeting notes or transcript
- [ ] Skill generates structured summary (key points, strengths, concerns, next steps)
- [ ] Can save summary to ATS candidate record
- [ ] Supports various input formats (bullet points, free text, transcript)

**Notes:** Stub skill for MVP. Could integrate with Granola or similar meeting transcription tools in future.

**Status:** ✅ Approved

---

## Section 4: Admin Operation Stories

### Story 4.1: View Skill Usage Analytics
**Persona:** Admin
**Phase:** Operation

> As an admin, I want to view skill usage analytics, so that I can understand how recruiters are using the platform.

**Acceptance Criteria:**
- [ ] Admin panel shows "Usage" dashboard
- [ ] Can see total skill executions over time (daily/weekly/monthly)
- [ ] Can filter by skill, user, or date range
- [ ] Shows success/failure rates per skill
- [ ] Can export usage data as CSV

**Notes:** Usage logs captured via API when skills make authenticated calls.

**Status:** ✅ Approved

---

### Story 4.2: Manage Roles and Permissions
**Persona:** Admin
**Phase:** Operation

> As an admin, I want to create and manage roles with specific skill assignments, so that I can control access based on job function.

**Acceptance Criteria:**
- [ ] Admin panel shows "Roles" management page
- [ ] Can create new roles with name and description
- [ ] Can assign skills to roles (many-to-many)
- [ ] Can assign roles to users
- [ ] Default roles provided: Admin, Recruiter, Viewer
- [ ] Changes take effect on next skill sync for affected users

**Notes:** RBAC enforced server-side. Users only receive skills for their assigned roles when syncing.

**Status:** ✅ Approved

---

### Story 4.3: Monitor Integration Health
**Persona:** Admin
**Phase:** Operation

> As an admin, I want to monitor the health of user integrations, so that I can proactively identify and resolve connection issues.

**Acceptance Criteria:**
- [ ] Admin panel shows "Integrations" overview
- [ ] Can see all users' integration statuses (Connected/Disconnected/Error)
- [ ] Can filter by provider or status
- [ ] Shows last successful sync time for each integration
- [ ] Can trigger re-authentication prompt for users with expired connections

**Notes:** Helps admin support recruiters who may not notice their OAuth token expired.

**Status:** ✅ Approved

---

### Story 4.4: Revoke User Access
**Persona:** Admin
**Phase:** Operation

> As an admin, I want to revoke a user's access immediately, so that I can respond to offboarding or security incidents.

**Acceptance Criteria:**
- [ ] Can disable user account from admin panel
- [ ] Disabling user automatically revokes all their API keys
- [ ] Disabled user cannot log in to web UI
- [ ] Disabled user's skills stop working immediately (API key invalid)
- [ ] Can re-enable user account if needed

**Notes:** Important for security and compliance when employees leave the company.

**Status:** ✅ Approved

---

### Story 4.5: Propose New Skill (User)
**Persona:** Recruiter
**Phase:** Operation

> As a recruiter, I want to propose a new skill idea, so that the platform can be extended to support my workflow needs.

**Acceptance Criteria:**
- [ ] Can invoke skill via `/propose-new-skill` in Claude Desktop (available to all users)
- [ ] Can describe the desired skill functionality in natural language
- [ ] Skill submits proposal to Skilldex API with user context
- [ ] User receives confirmation that proposal was submitted
- [ ] Can view status of own proposals in dashboard

**Notes:** Encourages bottom-up innovation. Proposals stored for admin review.

---

### Story 4.6: Review and Approve Skill Proposals (Admin)
**Persona:** Admin
**Phase:** Operation

> As an admin, I want to review and approve/deny skill proposals from users, so that I can curate which skills are added to the platform.

**Acceptance Criteria:**
- [ ] Admin panel shows "Skill Proposals" queue
- [ ] Can view proposal details (description, proposer, date)
- [ ] Can approve proposal (creates draft skill for editing)
- [ ] Can deny proposal with optional feedback to user
- [ ] Approved skills can be edited, assigned to roles, and published
- [ ] Proposer notified of approval/denial status

**Notes:** Admin can refine the proposal into a working skill before publishing.

**Status:** ✅ Approved

---

## Summary

| Section | Stories | Status |
|---------|---------|--------|
| 1. Admin Setup | 1.1 - 1.4 | ✅ All Approved |
| 2. Recruiter Setup | 2.1 - 2.4 | ✅ All Approved |
| 3. Recruiter Operation | 3.1 - 3.6 | ✅ All Approved |
| 4. Admin Operation | 4.1 - 4.6 | ✅ All Approved |

**Total: 20 User Stories**

### Key Design Decisions Captured
- Skills ↔ Roles: Many-to-many relationship (Story 1.4)
- API Keys: Full key visible anytime, not hashed-only (Story 2.3)
- Skill Distribution: Single sync skill downloads all user's skills (Story 2.4)
- LinkedIn Integration: Uses dev-browser skill for browser automation (Story 3.3)
- Skill Proposals: Bottom-up from users, approved by admin (Stories 4.5, 4.6)
