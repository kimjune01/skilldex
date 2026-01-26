# Skillomatic

Connect AI assistants (Claude, ChatGPT) to business tools via MCP. Two offerings:

1. **Consulting** (primary): Custom MCP server builds for clients' specific workflows
2. **Self-serve** (secondary): Users connect their own integrations and use the platform directly

The platform handles OAuth token management, tool execution, and usage tracking. Supports ATS, CRM, email, calendar, and other business tools.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Local Development

```bash
git clone <repo-url>
cd skillomatic
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

This starts:
- **Web**: http://localhost:5173
- **API**: http://localhost:3000
- **Mock ATS**: http://localhost:3001

Login: `demo@skillomatic.technology` / `demopassword123`

## Project Structure

```
skillomatic/
├── .claude/commands/     # Claude Code slash commands
├── apps/
│   ├── web/              # React frontend
│   ├── api/              # Hono API backend
│   ├── mcp-server/       # MCP server (ECS)
│   └── mock-ats/         # Mock ATS for development
├── packages/
│   ├── db/               # Drizzle schema
│   ├── mcp/              # MCP provider manifests
│   └── shared/           # Shared types
├── skills/               # Skill definitions
├── docs/                 # Documentation
└── CLAUDE.md             # Instructions for Claude Code
```

## Working with Claude Code

This repo is optimized for [Claude Code](https://claude.ai/code). Key commands:

| Command | Description |
|---------|-------------|
| `/deploy` | Deploy to production |
| `/rollback` | Revert to previous version |
| `/prod-status` | Check production status |
| `/prod-debugger` | Investigate production errors |
| `/dev-env` | Start development environment |
| `/local-db` | Query local database |

**Start here:** Read `CLAUDE.md` for project context, then check `docs/` for specific topics.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind |
| API | Hono (Lambda in prod) |
| Database | SQLite / Turso (prod) |
| ORM | Drizzle |
| OAuth | Nango Cloud |
| Deploy | SST + AWS |

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/ARCHITECTURE.md) | Tech stack, API endpoints, database schema |
| [Deployment](docs/DEPLOYMENT.md) | AWS/Turso setup, SST secrets, troubleshooting |
| [Integration Guide](docs/INTEGRATION_GUIDE.md) | Working with ATS, email, calendar |
| [Security](docs/SECURITY.md) | Security model, privacy |
| [Installation](docs/INSTALLATION.md) | End-user setup guide |

## Available Scripts

```bash
pnpm dev          # Start all services
pnpm typecheck    # TypeScript checks
pnpm db:push      # Apply schema changes
pnpm db:seed      # Seed sample data
pnpm db:studio    # Open Drizzle Studio
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `pnpm typecheck` before committing
4. Submit a pull request

## License

MIT
