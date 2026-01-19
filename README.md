# Skilldex

A plug-and-play Claude Code skills platform for recruiters. Access job functions (LinkedIn lookup, ATS operations, email drafting) through Claude Code skills instead of traditional dashboards.

## Motivation

Recruiters spend significant time switching between tools: ATS systems, LinkedIn, email clients, calendars. Skilldex brings these capabilities directly into Claude Code, enabling natural language interactions with recruiting workflows.

**Key insight:** Skills are downloadable markdown files that users place in `~/.claude/commands/`. When executed, skills authenticate back to the Skilldex backend for ATS data, integration access, and usage tracking.

### Why Claude Code Skills?

- **Natural language interface** - Ask Claude to "find senior engineers in Seattle" instead of clicking through filters
- **Contextual actions** - Claude understands the conversation and can chain actions (search → review → email)
- **No new UI to learn** - Works in your existing Claude Desktop or Claude Code environment
- **Self-hostable** - Run your own instance with your own integrations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SKILLDEX PLATFORM                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Web UI     │    │  API        │    │  Nango      │         │
│  │  (React)    │    │  (Hono)     │    │  (OAuth)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└────────┬────────────────────▲──────────────────────────────────┘
         │                    │
    Download skill            │ API calls with
    + API key                 │ SKILLDEX_API_KEY
         │                    │
         ▼                    │
┌─────────────────────────────┴──────────────────────────────────┐
│                   USER'S MACHINE                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Claude Desktop / Claude Code                            │   │
│  │  ~/.claude/commands/                                    │   │
│  │    ├── linkedin-lookup.md     ──> Executes skill        │   │
│  │    ├── ats-search.md              calls Skilldex API    │   │
│  │    └── ...                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web UI | React + Vite + Tailwind + shadcn/ui |
| API | Hono (runs on Node.js locally, Lambda in prod) |
| Database | SQLite (local) / Turso (production) |
| ORM | Drizzle |
| Auth | JWT + API Keys |
| Integrations | Nango (self-hosted OAuth) |
| Deployment | Docker (local) / SST + AWS (production) |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local development with Nango)

### Local Development

```bash
# Clone and install
git clone <repo-url>
cd skilldex
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
skilldex/
├── apps/
│   ├── web/           # React frontend
│   ├── api/           # Hono API backend
│   └── mock-ats/      # Mock ATS for development
├── packages/
│   ├── db/            # Drizzle schema + migrations
│   └── shared/        # Shared TypeScript types
├── skills/            # Claude Code skill definitions
│   ├── linkedin-lookup/
│   ├── ats-candidate-search/
│   └── ...
├── docs/              # Documentation
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
turso db create skilldex
turso db show skilldex  # Get the URL

# Create auth token
turso db tokens create skilldex
```

### Configure SST Secrets

```bash
# Set required secrets
npx sst secret set JwtSecret "your-secure-jwt-secret"
npx sst secret set TursoDatabaseUrl "libsql://skilldex-xxx.turso.io"
npx sst secret set TursoAuthToken "your-turso-auth-token"
npx sst secret set NangoSecretKey "your-nango-secret"  # Optional if not using Nango
```

### Run Migrations on Turso

```bash
# Connect to Turso shell and run migrations
turso db shell skilldex < packages/db/migrations.sql
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

- **[Recruiter Guide](docs/RECRUITER_GUIDE.md)** - How to set up and use Skilldex skills
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - Managing users, skills, and integrations

## Skills

Skilldex includes several pre-built skills:

| Skill | Category | Description |
|-------|----------|-------------|
| `linkedin-lookup` | Sourcing | Look up LinkedIn profiles using browser automation |
| `ats-candidate-search` | ATS | Search candidates in your ATS |
| `ats-candidate-crud` | ATS | Create, update, and manage candidates |
| `email-draft` | Communication | Draft emails to candidates |
| `interview-scheduler` | Scheduling | Schedule interviews |
| `meeting-notes` | Productivity | Sync meeting notes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm typecheck` and `pnpm build`
5. Submit a pull request

## License

MIT
