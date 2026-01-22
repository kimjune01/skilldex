# Dev Environment

Start the development environment with both services running in background tasks.

## Instructions

Services and their ports:
- **Web** (Vite frontend): port 5173
- **API** (Hono backend): port 3000

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
```

---

## Cloudflare Tunnel (for OAuth/Integrations)

OAuth callbacks from external providers (Google, Nango) require a public URL. Use Cloudflare Tunnel to expose your local API.

### Setup (one-time)

```bash
brew install cloudflared
```

### Start tunnel

```bash
cloudflared tunnel --url http://localhost:3000
```

This outputs a public URL like `https://random-words.trycloudflare.com`.

### Configure environment

Update your `.env` (or `.env.local`) with the tunnel URL:

```bash
API_URL=https://random-words.trycloudflare.com
```

Also update in:
- **Google Cloud Console**: Add `${API_URL}/api/auth/google/callback` to authorized redirect URIs
- **Nango Dashboard**: Update callback URL if using custom callbacks

### Alternative: localhost.run (no install)

```bash
ssh -R 80:localhost:3000 localhost.run
```

### When tunnel is needed

- Testing Google OAuth login flow
- Testing Nango integration connections (ATS, Calendar, Email)
- Any OAuth callback that needs to reach your local machine
