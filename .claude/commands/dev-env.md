# Dev Environment

Start the development environment with all three services running in background tasks.

## Instructions

Services and their ports:
- **Web** (Vite frontend): port 5173
- **API** (Hono backend): port 3000
- **Mock ATS**: port 3001

For each service, follow this pattern:

1. Check if the port is already in use: `lsof -ti:<PORT>`
2. If port is in use, **kill the existing process**: `kill $(lsof -ti:<PORT>) 2>/dev/null`
3. Wait briefly for the port to be released: `sleep 1`
4. Start the service fresh as a background task using the Bash tool with `run_in_background: true`

### Commands

```bash
# Kill existing and start Web (port 5173)
kill $(lsof -ti:5173) 2>/dev/null; sleep 1
pnpm dev:web

# Kill existing and start API (port 3000)
kill $(lsof -ti:3000) 2>/dev/null; sleep 1
pnpm dev:api

# Kill existing and start Mock ATS (port 3001)
kill $(lsof -ti:3001) 2>/dev/null; sleep 1
pnpm dev:ats
```

### Expected output

Report which services were:
- Restarted (killed existing, started fresh)
- Started (was not running)

Example output format:
```
Dev environment status:
- Web (5173): restarted
- API (3000): started
- Mock ATS (3001): restarted
```
