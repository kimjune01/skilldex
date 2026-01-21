# Dev Environment

Start the development environment with all three services running in background tasks.

## Instructions

Check each port before starting to avoid duplicates:
- **Web** (Vite frontend): port 5173
- **API** (Hono backend): port 3000
- **Mock ATS**: port 3001

For each service, follow this pattern:

1. Check if the port is already in use: `lsof -ti:<PORT>`
2. If port is in use, skip starting that service and report it's already running
3. If port is free, start the service as a background task using the Bash tool with `run_in_background: true`

### Commands to start each service

```bash
# Web (port 5173)
pnpm dev:web

# API (port 3000)
pnpm dev:api

# Mock ATS (port 3001)
pnpm dev:ats
```

### Expected output

Report which services were:
- Already running (skipped)
- Newly started

Example output format:
```
Dev environment status:
- Web (5173): already running
- API (3000): started
- Mock ATS (3001): started
```
