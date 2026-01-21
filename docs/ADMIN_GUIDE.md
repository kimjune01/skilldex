# Admin Guide

This guide covers administration tasks for Skilldex: managing users, configuring integrations, creating skills, and monitoring usage.

## Accessing the Admin Panel

Admin features are available to users with the `isAdmin` flag. Log in and you'll see additional navigation items in the sidebar under "Admin":

- **Users** - Manage user accounts
- **Manage Skills** - Enable/disable skills, view skill metadata
- **Analytics** - View usage statistics and trends
- **Proposals** - Review skill proposals from users
- **Settings** - Configure LLM providers and system settings
- **Deployment** - View deployment status and configuration

## User Management

### Viewing Users

Navigate to **Users** in the admin section to see all registered users:

- Name and email
- Role (Admin or User)
- Account creation date

### Creating Users

1. Click **Add User**
2. Fill in the user details:
   - **Name**: Display name
   - **Email**: Login email (must be unique)
   - **Password**: Initial password
   - **Admin privileges**: Check to grant admin access
3. Click **Create**

Share the credentials with the user and recommend they generate their own API key.

### Deleting Users

1. Find the user in the list
2. Click the trash icon
3. Confirm deletion

**Warning**: Deleting a user also removes:
- Their API keys
- Their integration connections
- Their skill usage history

## Skill Management

### Viewing Skills

Navigate to **Manage Skills** to see all registered skills:

- Skill name and slug (command name)
- Category
- Required integrations
- Enabled/disabled status

### Enabling/Disabling Skills

Skills can be globally enabled or disabled. Disabled skills:
- Don't appear in the user-facing Skills list
- Can't be downloaded
- Return errors if invoked via API

To toggle a skill's status, use the database directly or seed script (UI toggle coming soon).

### Adding New Skills

Skills are defined as markdown files with YAML frontmatter. No separate JSON file is needed:

1. Create a new folder in `skills/`:
   ```
   skills/my-new-skill/
   └── SKILL.md      # Claude Code skill definition with frontmatter
   ```

2. Create `SKILL.md` with YAML frontmatter at the top:
   ```markdown
   ---
   name: my-new-skill
   description: Brief description for the skill list
   intent: I want to do X with this skill
   capabilities:
     - Capability one
     - Capability two
     - Capability three
   allowed-tools:
     - Skill
     - Read
     - Bash
   ---

   # My New Skill

   You are an assistant that helps with X, Y, and Z.

   ## Prerequisites

   - List any required integrations or setup
   - SKILLDEX_API_KEY environment variable (if calling Skilldex API)

   ## How It Works

   Explain the workflow...

   ## Usage

   Describe how to use the skill with examples...

   ## Limitations

   - Note any limitations
   ```

3. Run the seed script to register the skill in the database:
   ```bash
   pnpm db:seed
   ```

**Note:** The frontmatter fields (`name`, `description`, `intent`, `capabilities`, `allowed-tools`) are parsed when the skill is loaded. The `intent` field helps Claude understand when to suggest this skill to users.

### Skill Categories

Available categories:
- `sourcing` - Finding candidates (LinkedIn, job boards)
- `ats` - ATS operations (CRUD, pipelines)
- `communication` - Email, messaging
- `scheduling` - Calendar, interviews
- `productivity` - Notes, summaries, misc
- `system` - Platform skills (sync, propose)

### Reviewing Skill Proposals

Users can propose new skills via `/propose-new-skill`. To review proposals:

1. Navigate to **Admin > Proposals** in the sidebar
2. View pending proposals with title, description, and use cases
3. Approve by clicking "Approve" and then creating the skill
4. Or deny with feedback explaining why

**Web UI workflow (recommended):**
1. Go to Admin > Proposals
2. Click on a pending proposal to view details
3. Click "Approve" or "Deny"
4. If denying, provide feedback for the user

**Database queries (advanced):**
```sql
-- View pending proposals
SELECT * FROM skill_proposals WHERE status = 'pending';

-- Approve (after creating the skill)
UPDATE skill_proposals
SET status = 'approved',
    reviewed_by = 'your-user-id',
    reviewed_at = unixepoch(),
    created_skill_id = 'new-skill-id'
WHERE id = 'proposal-id';

-- Deny with feedback
UPDATE skill_proposals
SET status = 'denied',
    reviewed_by = 'your-user-id',
    reviewed_at = unixepoch(),
    review_feedback = 'Reason for denial'
WHERE id = 'proposal-id';
```

## System Settings

### LLM Provider Configuration

Navigate to **Admin > Settings** to configure LLM providers for the Chat feature:

1. **Groq** (default) - Free tier LLM for chat/analysis
   - Get API key from: https://console.groq.com
   - Enter key in Settings > LLM Provider > Groq API Key

2. **Other providers** - Support for additional providers can be configured

**Note:** LLM keys are stored encrypted in the `system_settings` table with `is_secret = true`.

### Demo Mode

Skilldex includes a Demo Mode for trials and demonstrations:

- Toggle in the sidebar (Flask icon)
- When enabled, uses mock data instead of real API calls
- Stored in `localStorage` as `skilldex_demo_mode`
- Also can be triggered via `X-Demo-Mode: true` header

This is useful for showing Skilldex to prospects without connecting real integrations.

## Integration Configuration

### Supported Integrations

| Provider | Type | Notes |
|----------|------|-------|
| ATS | OAuth | Generic ATS patterns (Greenhouse/Lever-like) |
| LinkedIn | Browser | Uses dev-browser skill for automation, no OAuth needed |
| Email | OAuth | Gmail/Outlook |
| Calendar | OAuth | Google Calendar/Outlook |
| Granola | API Key | Meeting notes sync |

### Nango Setup (Self-Hosted OAuth)

Skilldex uses Nango for OAuth management:

1. Start Nango via Docker Compose:
   ```bash
   docker-compose up nango nango-db
   ```

2. Access Nango dashboard at `http://localhost:3003`

3. Configure providers:
   - Add OAuth credentials for each provider
   - Set callback URLs to your Skilldex instance

4. Update `.env` with Nango credentials:
   ```
   NANGO_HOST=http://localhost:3003
   NANGO_SECRET_KEY=your-secret-key
   NANGO_PUBLIC_KEY=your-public-key
   ```

### Mock ATS (Development)

For development, a mock ATS is included:

```bash
pnpm dev:ats  # Starts on port 3001
```

The mock ATS provides:
- Realistic candidate data (20+ profiles)
- Job requisitions
- Pipeline stages
- Standard CRUD endpoints

## Role-Based Access Control

### Current Roles

| Role | Description |
|------|-------------|
| Admin | Full access, user management, skill configuration |
| User | Standard recruiter access to skills and integrations |

### Role-Skill Assignments

Skills can be associated with roles (many-to-many):

```sql
-- Assign skill to role
INSERT INTO role_skills (role_id, skill_id, assigned_at)
VALUES ('role-id', 'skill-id', unixepoch());

-- View role's skills
SELECT s.* FROM skills s
JOIN role_skills rs ON s.id = rs.skill_id
WHERE rs.role_id = 'role-id';
```

### Future: Custom Roles

The schema supports custom roles and permissions:

```sql
-- Create a custom role
INSERT INTO roles (id, name, description)
VALUES ('sourcer', 'Sourcer', 'Sourcing team member');

-- Assign permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'sourcer', id FROM permissions
WHERE resource = 'candidates' AND action = 'read';
```

## Monitoring & Logging

### Analytics Dashboard

Navigate to **Admin > Analytics** for visual usage statistics:

- Total skill executions over time
- Success/failure rates by skill
- Most active users
- Popular skills

### Scrape Tasks

Web scraping tasks (used by LinkedIn lookup) are tracked with caching:

```sql
-- View recent scrape tasks
SELECT
  st.url,
  st.status,
  u.email,
  datetime(st.created_at, 'unixepoch') as created,
  datetime(st.completed_at, 'unixepoch') as completed
FROM scrape_tasks st
JOIN users u ON st.user_id = u.id
ORDER BY st.created_at DESC
LIMIT 20;

-- Check cache hit rate (completed tasks reused)
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN result IS NOT NULL THEN 1 ELSE 0 END) as with_cached_result
FROM scrape_tasks
WHERE created_at > unixepoch() - 86400;
```

**Scrape task lifecycle:**
- Tasks are cached for 24 hours (`expires_at`)
- Stale tasks (processing > 30 seconds) are auto-expired
- Results are deduplicated by URL hash

### Skill Usage Logs

All skill invocations are logged:

```sql
-- View recent usage
SELECT
  u.name as user_name,
  s.name as skill_name,
  sul.status,
  sul.duration_ms,
  datetime(sul.created_at, 'unixepoch') as invoked_at
FROM skill_usage_logs sul
JOIN users u ON sul.user_id = u.id
JOIN skills s ON sul.skill_id = s.id
ORDER BY sul.created_at DESC
LIMIT 100;

-- Usage by skill
SELECT
  s.name,
  COUNT(*) as invocations,
  AVG(sul.duration_ms) as avg_duration_ms
FROM skill_usage_logs sul
JOIN skills s ON sul.skill_id = s.id
GROUP BY s.id
ORDER BY invocations DESC;

-- Errors in last 24 hours
SELECT * FROM skill_usage_logs
WHERE status = 'error'
AND created_at > unixepoch() - 86400;
```

### API Key Usage

Track which API keys are active:

```sql
-- Active keys with last usage
SELECT
  u.name as user_name,
  ak.name as key_name,
  datetime(ak.last_used_at, 'unixepoch') as last_used,
  datetime(ak.created_at, 'unixepoch') as created
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
WHERE ak.revoked_at IS NULL
ORDER BY ak.last_used_at DESC;
```

## Database Operations

### Backup (SQLite Local)

```bash
# Simple copy
cp data/skilldex.db data/skilldex-backup-$(date +%Y%m%d).db

# While running (WAL mode)
sqlite3 data/skilldex.db ".backup 'data/backup.db'"
```

### Backup (Turso Production)

```bash
# Export database
turso db shell skilldex .dump > backup.sql

# Or use Turso's built-in backups
turso db replicate skilldex --location <region>
```

### Running Migrations

```bash
# Local
pnpm db:migrate

# Turso
turso db shell skilldex < packages/db/src/migrate.sql
```

### Re-seeding Data

```bash
# Warning: This may duplicate data, use with caution
pnpm db:seed
```

## Deployment Operations

### Checking Deployment Status

```bash
# SST status
npx sst status

# View outputs (URLs)
npx sst outputs
```

### Updating Secrets

```bash
# Update a secret
npx sst secret set JwtSecret "new-secret-value"

# Redeploy to apply
npx sst deploy
```

### Viewing Logs

```bash
# Tail Lambda logs (requires AWS CLI)
aws logs tail /aws/lambda/skilldex-Api --follow

# Or use SST console
npx sst console
```

### Rolling Back

SST doesn't have built-in rollback. Options:
1. Redeploy a previous git commit
2. Restore database from backup
3. Use AWS Lambda versioning manually

## Troubleshooting

### Users Can't Connect Integrations

1. Check Nango is running: `docker-compose ps`
2. Verify Nango credentials in `.env`
3. Check provider OAuth configuration in Nango dashboard
4. Look at API logs for errors

### Skills Not Appearing

1. Verify skill is in `skills/` directory
2. Check `skill.json` is valid JSON
3. Run `pnpm db:seed` to register
4. Check `isEnabled` is `true` in database

### API Errors

1. Check API logs: `docker-compose logs api`
2. Verify database connection
3. Check JWT_SECRET is consistent between API and tokens
4. Verify API key hasn't been revoked

### Performance Issues

1. Check database indexes exist
2. Monitor Lambda cold starts (SST console)
3. Consider Turso read replicas for global distribution
4. Review slow queries in logs

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Restrict CORS origins to your domain
- [ ] Regularly audit API key usage
- [ ] Set up database backups
- [ ] Review skill proposals before approving
- [ ] Monitor for unusual usage patterns
