# Admin Guide

This guide covers administration tasks for Skillomatic: managing users, configuring integrations, and monitoring usage.

## Accessing the Admin Panel

Admin features are available to users with the admin flag. Log in and you'll see additional navigation items in the sidebar under "Admin":

- **Users** - Manage user accounts
- **Manage Skills** - Enable/disable skills, view skill metadata
- **Analytics** - View usage statistics and trends
- **Proposals** - Review skill proposals from users
- **Settings** - Configure LLM providers and system settings
- **Invites** - Create invite links for new users

## User Management

### Viewing Users

Navigate to **Admin > Users** to see all registered users:

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

### Invite Links

For self-service onboarding:

1. Go to **Admin > Invites**
2. Click **Generate Invite Link**
3. Share the link with new users
4. They create their own accounts

### Deleting Users

1. Find the user in the list
2. Click the trash icon
3. Confirm deletion

**Warning**: Deleting a user also removes:
- Their API keys
- Their integration connections
- Their skill usage history

## LLM Configuration

Navigate to **Admin > Settings** to configure LLM providers for the Chat feature.

### Supported Providers

| Provider | Notes |
|----------|-------|
| **Anthropic** | Claude models (recommended) |
| **OpenAI** | GPT-4 models |
| **Groq** | Fast inference, free tier available |

### Adding an LLM Key

1. Go to **Admin > Settings**
2. Under **LLM Configuration**, select your provider
3. Enter your API key
4. Click **Save**

**Note:** This key is used client-side. It's embedded in rendered skills and sent to the browser, where it's used to make direct API calls to the LLM provider. The key never passes through Skillomatic servers during chat.

### Default Provider

Set a default provider and model. Users will use this unless overridden.

## Skill Management

### Viewing Skills

Navigate to **Admin > Manage Skills** to see all registered skills:

- Skill name and slug (command name)
- Category
- Required integrations
- Enabled/disabled status

### Enabling/Disabling Skills

Click the toggle to enable or disable a skill. Disabled skills:
- Don't appear in the user-facing Skills list
- Can't be loaded via the chat
- Return errors if invoked via API

### Adding New Skills

Skills are stored in the database. To add a new skill:

1. Go to **Admin > Manage Skills**
2. Click **Add Skill**
3. Fill in the metadata:
   - **Slug**: Command name (e.g., `linkedin-lookup`)
   - **Name**: Display name
   - **Description**: Brief description
   - **Category**: sourcing, ats, communication, etc.
   - **Intent**: When should this skill be used?
   - **Capabilities**: What can this skill do? (JSON array)
   - **Instructions**: Full skill instructions in markdown

### Skill Categories

Available categories:
- `sourcing` - Finding candidates (LinkedIn, job boards)
- `ats` - ATS operations (CRUD, pipelines)
- `communication` - Email, messaging
- `scheduling` - Calendar, interviews
- `productivity` - Notes, summaries, misc
- `system` - Platform skills (sync, propose)

### Reviewing Skill Proposals

Users can propose new skills via the Chat. To review proposals:

1. Navigate to **Admin > Proposals**
2. View pending proposals with title, description, and use cases
3. Click **Approve** to accept (then create the skill)
4. Or click **Deny** with feedback

## Role-Based Access Control

### Default Roles

| Role | Description |
|------|-------------|
| Admin | Full access, user management, skill configuration |
| User | Standard recruiter access to skills and integrations |

### Assigning Skills to Roles

Skills can be restricted by role:

1. Go to **Admin > Manage Skills**
2. Select a skill
3. Under **Role Access**, select which roles can use this skill
4. Click **Save**

Users only see skills their role has access to.

## Integration Configuration

### ATS Integration

Connect your ATS via **Admin > Integrations**:

1. Click **Connect ATS**
2. Select your provider (Greenhouse, Lever, etc.)
3. Complete OAuth flow
4. Token is stored securely and fetched fresh for each request

**Note:** ATS data is fetched client-side. The token is embedded in rendered skills.

### Email Integration

For email skills:

1. Click **Connect Email**
2. Select Gmail or Outlook
3. Complete OAuth flow

## Monitoring & Analytics

### Analytics Dashboard

Navigate to **Admin > Analytics** for visual usage statistics:

- Total skill executions over time
- Success/failure rates by skill
- Most active users
- Popular skills

### Usage Logs

All skill invocations are logged:

- Which skill was invoked
- By which user
- When and duration
- Success/failure status

View in **Admin > Analytics > Logs**.

### API Key Usage

Track which API keys are active:

1. Go to **Admin > Users**
2. Click on a user
3. View their API keys and last usage

## Security

### API Key Policies

- Keys can be set to auto-expire
- Admins can revoke any user's keys
- All key usage is logged

### What Gets Logged

| Event | Logged |
|-------|--------|
| User login | Yes |
| Skill invocation | Yes (skill name, duration, status) |
| API key creation/revocation | Yes |
| Chat content | No |
| ATS data accessed | No |

### Data Privacy

Skillomatic uses an ephemeral architecture:

- **Chat content** - Never stored, exists only in browser
- **ATS data** - Fetched direct to client, never stored
- **Scrape results** - Processed client-side, cached in browser
- **Usage logs** - Anonymized (skill name + timestamp only)

## Troubleshooting

### Users Can't Access Skills

1. Check user has a valid API key
2. Verify user's role has access to the skill
3. Ensure skill is enabled in Admin > Manage Skills

### LLM Not Working

1. Verify API key is set in Admin > Settings
2. Check the key is valid (test directly with provider)
3. Ensure user's browser can reach the LLM API

### Integration Not Connecting

1. Check OAuth credentials in Admin > Integrations
2. Try disconnecting and reconnecting
3. Verify the provider's API is accessible

### Skills Not Appearing

1. Check skill is enabled in Admin > Manage Skills
2. Verify user's role has access
3. User should refresh the page

## Best Practices

### User Onboarding

1. Create user account or send invite link
2. User logs in and generates API key
3. User installs browser extension
4. User configures extension with API URL and key
5. User starts using skills in Chat

### Skill Organization

- Use clear, descriptive slugs (`linkedin-lookup` not `ll`)
- Write intent that helps Claude know when to suggest the skill
- Group related skills in the same category
- Disable unused skills to reduce clutter

### Security Checklist

- [ ] Use strong passwords for admin accounts
- [ ] Regularly review user list for inactive accounts
- [ ] Audit API key usage periodically
- [ ] Review skill proposals before approving
- [ ] Monitor analytics for unusual patterns
