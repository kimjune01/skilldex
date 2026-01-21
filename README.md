# Skillomatic

A plug-and-play Claude Code skills platform for recruiters. Access job functions (LinkedIn lookup, ATS operations, email drafting) through Claude Code skills instead of traditional dashboards.

## Motivation

Recruiters spend significant time switching between tools: ATS systems, LinkedIn, email clients, calendars. Skillomatic brings these capabilities directly into Claude Code, enabling natural language interactions with recruiting workflows.

**Key insight:** Skills are downloadable markdown files that users place in `~/.claude/commands/`. When executed, skills authenticate back to the Skillomatic backend for ATS data, integration access, and usage tracking.

### Why Claude Code Skills?

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
| LLM | Anthropic, OpenAI, Google Gemini, Groq (client-side) |
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

Default login: `admin@example.com` / `changeme`

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
├── apps/
│   ├── web/              # React frontend
│   ├── api/              # Hono API backend
│   ├── mock-ats/         # Mock ATS for development
│   └── skillomatic-scraper/ # Chrome extension for LinkedIn scraping
├── packages/
│   ├── db/               # Drizzle schema + migrations
│   └── shared/           # Shared TypeScript types
├── skills/               # Claude Code skill definitions
│   ├── linkedin-lookup/
│   ├── ats-candidate-search/
│   └── ...
├── deploy/
│   └── scripts/          # IT deployment scripts
│       ├── skillomatic-deploy.sh    # macOS/Linux
│       └── Deploy-Skillomatic.ps1   # Windows
├── docs/                 # Documentation
│   ├── INSTALLATION.md   # Setup guide for recruiters
│   ├── IT_DEPLOYMENT.md  # Enterprise deployment guide
│   ├── RECRUITER_GUIDE.md
│   └── ADMIN_GUIDE.md
└── docker-compose.yml
```

## Deployment

### Prerequisites

- AWS account with credentials configured
- Turso account (free tier works)

### Set Up Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create skillomatic
turso db show skillomatic  # Get the URL

# Create auth token
turso db tokens create skillomatic
```

### Configure SST Secrets

```bash
# Set required secrets
npx sst secret set JwtSecret "your-secure-jwt-secret"
npx sst secret set TursoDatabaseUrl "libsql://skillomatic-xxx.turso.io"
npx sst secret set TursoAuthToken "your-turso-auth-token"
npx sst secret set NangoSecretKey "your-nango-secret"  # Optional if not using Nango
```

### Run Migrations on Turso

```bash
# Connect to Turso shell and run migrations
turso db shell skillomatic < packages/db/migrations.sql
```

### Deploy

```bash
# Deploy to development stage
npx sst deploy

# Deploy to production
pnpm sst:deploy

# Remove deployment
pnpm sst:remove
```

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
- **[Recruiter Guide](docs/RECRUITER_GUIDE.md)** - How to use Skillomatic skills in your workflow
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - Managing users, skills, and integrations
- **[Ephemeral Architecture](docs/EPHEMERAL_ARCHITECTURE.md)** - Technical details on client-side LLM and privacy model
- **[Vision Beyond Recruiting](docs/VISION_BEYOND_RECRUITING.md)** - Platform expansion to other verticals

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm typecheck` and `pnpm build`
5. Submit a pull request

## License

MIT
