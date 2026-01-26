# Skillomatic

Connect AI assistants (Claude, ChatGPT) to business tools via MCP. Two offerings:

1. **Consulting** (primary): Custom MCP server builds for clients' specific workflows
2. **Self-serve** (secondary): Users connect their own integrations and use the platform directly

The platform handles OAuth token management, tool execution, and usage tracking. Supports ATS, CRM, email, calendar, and other business tools.

## Why Skillomatic?

- **Natural language interface** - Ask Claude to "find senior engineers in Seattle" instead of clicking through filters
- **Contextual actions** - Claude understands the conversation and can chain actions (search → review → email)
- **No new UI to learn** - Works in your existing Claude Desktop or Claude Code environment
- **Client-side LLM** - Chat runs directly in browser; server is stateless (no PII stored)
- **Self-hostable** - Run your own instance with your own integrations

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           SKILLOMATIC PLATFORM                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │  Web UI     │    │  API        │    │  Nango      │                   │
│  │  (React)    │    │  (Hono)     │    │  (OAuth)    │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
└────────┬────────────────────▲────────────────────────────────────────────┘
         │                    │
    Download skill            │ API calls with SKILLOMATIC_API_KEY
    + API key                 │
         │                    │
         ▼                    │
┌─────────────────────────────┴────────────────────────────────────────────┐
│                         USER'S MACHINE                                    │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  Claude Desktop / Claude Code                                      │   │
│  │  ~/.claude/commands/                                               │   │
│  │    ├── linkedin-lookup.md     ──> Creates scrape tasks             │   │
│  │    ├── ats-search.md              via Skillomatic API                 │   │
│  │    └── ...                                                         │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  Chrome Browser                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │  Skillomatic Scraper Extension                                  │  │   │
│  │  │  • Polls API for pending scrape tasks                       │  │   │
│  │  │  • Opens LinkedIn URLs in new tabs (user's session)         │  │   │
│  │  │  • Extracts page content, returns to API                    │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key insight:** The Skillomatic Scraper browser extension enables LinkedIn scraping by opening pages in the user's actual browser session. This uses their existing LinkedIn login - no OAuth or credential management needed.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web UI | React + Vite + Tailwind + shadcn/ui |
| API | Hono (runs on Node.js locally, Lambda in prod) |
| Database | SQLite (local) / Turso (production) |
| ORM | Drizzle |
| Auth | JWT + API Keys |
| LLM | Anthropic > OpenAI > Groq (priority fallback) |
| Integrations | Nango Cloud (OAuth) |
| Deployment | Docker (local) / SST + AWS (production) |

## Quick Start

### For Recruiters (Using Skills)

```bash
# 1. Sign up at your Skillomatic instance and generate an API key
#    https://skillomatic.yourcompany.com/keys

# 2. Set your API key
export SKILLOMATIC_API_KEY="sk_live_your_key_here"

# 3. Download skills from the web UI and place in:
mkdir -p ~/.claude/commands
```

See **[Installation Guide](docs/INSTALLATION.md)** for detailed setup instructions.

### For Developers (Running the Platform)

#### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local development with Nango)

#### Local Development

```bash
# Clone and install
git clone <repo-url>
cd skillomatic
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Initialize database
pnpm db:migrate
pnpm db:seed

# Start all services
pnpm dev
```

This starts:
- **Web UI**: http://localhost:5173
- **API**: http://localhost:3000
- **Mock ATS**: http://localhost:3001

Default login: `demo@skillomatic.technology` / `demopassword123` (or any `@example.com` user with password `changeme`)

### Docker Development (Full Stack)

```bash
# Start all services including Nango
docker-compose up -d

# Run migrations and seed
pnpm db:migrate
pnpm db:seed
```

## Project Structure

```
skillomatic/
├── .claude/
│   └── commands/         # Claude Code slash commands (/deploy, /dev-env, etc.)
├── apps/
│   ├── web/              # React frontend
│   ├── api/              # Hono API backend
│   ├── mcp-server/       # MCP server for Claude Desktop/Code
│   ├── mock-ats/         # Mock ATS for development
│   └── skillomatic-scraper/ # Chrome extension for LinkedIn scraping
├── packages/
│   ├── db/               # Drizzle schema + migrations
│   ├── mcp/              # MCP provider manifests and tools
│   └── shared/           # Shared TypeScript types
├── skills/               # Skill definitions (SKILL.md files)
│   ├── linkedin-lookup/
│   ├── ats-candidate-search/
│   ├── skill-builder/
│   └── ...
├── docs/                 # Documentation
├── deploy/               # IT deployment scripts
├── CLAUDE.md             # Project instructions for Claude Code
└── docker-compose.yml
```

## Deployment

### Prerequisites

- **AWS account** with IAM user (AdministratorAccess or PowerUserAccess)
- **Turso account** (free tier works) for production database
- **Nango account** (optional) for OAuth integrations

### 1. Set Up AWS Credentials

```bash
# Install AWS CLI if needed
brew install awscli

# Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-west-2), Output (json)
```

### 2. Set Up Turso Database

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login to Turso
turso auth login

# Create database
turso db create skillomatic

# Get the database URL
turso db show skillomatic --url

# Create auth token
turso db tokens create skillomatic
```

### 3. Configure SST Secrets

```bash
# Set required secrets for production
pnpm sst secret set JwtSecret "$(openssl rand -hex 32)" --stage production
pnpm sst secret set TursoDatabaseUrl "libsql://skillomatic-xxx.turso.io" --stage production
pnpm sst secret set TursoAuthToken "your-turso-auth-token" --stage production
pnpm sst secret set NangoSecretKey "your-nango-secret-key" --stage production
pnpm sst secret set NangoPublicKey "" --stage production  # Deprecated, can be empty
```

### 4. Deploy

```bash
# Deploy to production
pnpm sst deploy --stage production

# This will output:
# - Web URL (CloudFront)
# - API URL (Lambda)
```

### 5. Run Database Migrations and Seed

```bash
# Set Turso credentials
export TURSO_DATABASE_URL=$(turso db show skillomatic --url)
export TURSO_AUTH_TOKEN=$(turso db tokens create skillomatic)

# Run migrations
pnpm --filter @skillomatic/db migrate:prod

# CRITICAL: Run seed to create users with proper password hashes
pnpm --filter @skillomatic/db seed:prod
```

**Important:** Always run `seed:prod` after deployment. This ensures:
- Test users have correctly hashed passwords
- All skills from `skills/` directory are synced to the database
- Super admin API key is created and active

Without running seed, users may exist but login will fail with "Invalid email or password".

### Custom Domain (Optional)

To use a custom domain like `skillomatic.technology`:

1. **Option A: Use Route 53** (easier)
   - Transfer your domain's nameservers to Route 53
   - Set `useCustomDomain = true` in `sst.config.ts`
   - Redeploy - SST handles SSL certificates automatically

2. **Option B: Use External DNS** (Namecheap, Cloudflare, etc.)
   - Deploy first to get CloudFront URLs
   - Add CNAME records pointing to the CloudFront distributions
   - Configure SSL certificate in ACM manually

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | Turso libsql URL | Yes (production) |
| `TURSO_AUTH_TOKEN` | Turso auth token | Yes (production) |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `NANGO_SECRET_KEY` | Nango API secret key | No |
| `NANGO_HOST` | Nango API host | No (defaults to api.nango.dev) |

### Troubleshooting

**"Invalid email or password" on login:**
- Run `pnpm --filter @skillomatic/db seed:prod` to reset password hashes
- This is the most common issue after deployment

**Lambda 403 Forbidden:**
- Ensure Lambda URL has `authorization: "none"` in SST config
- Add `lambda:InvokeFunction` permission to resource policy

**libsql/better-sqlite3 errors:**
- Add native deps to SST config: `nodejs: { install: ["@libsql/linux-x64-gnu"] }`

**CORS errors:**
- Check `allowOrigins` in SST config matches your frontend URL

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all services in development |
| `pnpm dev:web` | Start only the web UI |
| `pnpm dev:api` | Start only the API |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm sst:dev` | Start SST development mode |
| `pnpm sst:deploy` | Deploy to production |

## Documentation

- **[Installation Guide](docs/INSTALLATION.md)** - Complete setup instructions for all platforms
- **[IT Deployment Guide](docs/IT_DEPLOYMENT.md)** - Enterprise deployment, MDM, and bulk provisioning
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - Managing users, skills, and integrations
- **[Architecture](docs/ARCHITECTURE.md)** - Tech stack, directory structure, API endpoints, database schema
- **[Security](docs/SECURITY.md)** - Security model and privacy considerations
- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - Working with ATS, email, calendar integrations

## MCP Client Support

Skillomatic skills work with any MCP-compatible client:

| Client | Support | Notes |
|--------|---------|-------|
| Claude Desktop | Full | Primary target, auto-configured by setup CLI |
| Claude Code | Full | Skills work as slash commands |
| Cursor | Full | Configure MCP server in settings |
| Continue | Full | Add MCP server to config |
| Other MCP clients | Partial | Manual configuration required |

Skills that don't require LinkedIn (ATS-only) work with just the API key. LinkedIn skills require the **Skillomatic Scraper** browser extension (in `apps/skillomatic-scraper/`) which opens LinkedIn pages in the user's authenticated browser session.

## Skills

Skillomatic includes several pre-built skills:

| Skill | Category | Description |
|-------|----------|-------------|
| `linkedin-lookup` | Sourcing | Look up LinkedIn profiles using browser automation |
| `ats-candidate-search` | ATS | Search candidates in your ATS |
| `ats-candidate-crud` | ATS | Create, update, and manage candidates |
| `daily-report` | Productivity | Generate recruiting activity reports with elicitation |
| `candidate-pipeline-builder` | Sourcing | End-to-end candidate sourcing workflow |
| `email-draft` | Communication | Draft emails to candidates |
| `interview-scheduler` | Scheduling | Schedule interviews |
| `meeting-notes` | Productivity | Sync meeting notes |
| `skill-builder` | Productivity | Create custom skills via natural language |

## Demo Mode

Skillomatic includes a demo mode for demonstrations and testing without requiring a real ATS connection.

### Enabling Demo Mode

**Via Web UI:**
Toggle the "Demo Mode" switch in the sidebar. When enabled, all ATS data and usage analytics will show realistic mock data.

**Via API Headers:**
```bash
curl -H "X-Demo-Mode: true" -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/v1/ats/candidates
```

**Via Query Parameters:**
```bash
curl "http://localhost:3000/api/v1/ats/candidates?demo=true" \
  -H "Authorization: Bearer $API_KEY"
```

### Demo Data Included

When demo mode is enabled, the following mock data is available:

- **8 Candidates** - Realistic profiles with varied stages (New, Screening, Interview, Offer, Hired, Rejected)
- **4 Job Requisitions** - Engineering roles with salary ranges and requirements
- **7 Applications** - Candidates linked to jobs with stage history
- **Usage Analytics** - 7 days of simulated skill execution logs

Demo mode is indicated in API responses with `"demo": true` and in the web UI with a visual indicator.

## Working with Claude Code

This repo is optimized for development with [Claude Code](https://claude.com/claude-code). Key files:

- **`CLAUDE.md`** - Project instructions that Claude reads automatically. Contains tech stack, key files, dev commands, and coding guidelines.
- **`.claude/commands/`** - Slash commands for common tasks

### Slash Commands

Use these in Claude Code by typing `/command-name`:

| Command | Description |
|---------|-------------|
| `/deploy` | Deploy to production (use this, not `pnpm deploy`) |
| `/dev-env` | Start the development environment |
| `/local-db` | Query the local SQLite database |
| `/load-mcp` | Load and test the MCP server for a user |
| `/prod-status` | Check what's running in production |
| `/prod-debugger` | Fetch and investigate production errors |
| `/rollback` | Rollback to a previous deployment |

### For Humans

When working on this repo:

1. **Read `CLAUDE.md` first** - It has the project overview and points to relevant docs
2. **Use Claude Code** - The slash commands handle common workflows (deploy, debug, etc.)
3. **Check `docs/`** - Detailed documentation for specific topics (architecture, integrations, security)
4. **Run `pnpm typecheck`** - Always verify before committing

### For AI Assistants

The `CLAUDE.md` file provides:
- Project context and business model
- Documentation index by task type
- Key file locations
- Development commands
- Testing requirements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm typecheck` and `pnpm build`
5. Submit a pull request

## License

MIT
