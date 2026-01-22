# End-to-End Test Checklist

Complete testing guide for Skillomatic with clear error indicators at each step.

---

## Error Visibility Summary

| Component | Errors Visible? | Where to Look |
|-----------|-----------------|---------------|
| Google OAuth | Yes | Login page alert, URL `?error=X` param |
| API calls (web) | Yes | Red alert banners on page |
| Integrations | Yes | Alert banner + URL params |
| Token expiry | Yes | Toast notification (bottom-right) |
| Extension WS | Yes | Red error banner in popup, status dot |
| MCP Server | Yes | stderr / log file with detailed warnings |
| Scrape Tasks | Yes | API response `suggestion` field |
| Auth middleware | Yes | API response `error.message` |
| React crashes | Yes | Error boundary with retry button |

---

## Prerequisites

Before testing, ensure:
- [ ] API server running (`pnpm dev` in apps/api)
- [ ] Web server running (`pnpm dev` in apps/web)
- [ ] Database migrated (`pnpm db:migrate`)
- [ ] Environment variables configured (see `.env.example`)
- [ ] **For OAuth/Integrations**: Cloudflare Tunnel running (see below)

---

## 0. Cloudflare Tunnel Setup (Local Development)

OAuth callbacks require a public URL to reach your local machine. Use Cloudflare Tunnel for this.

### Install (one-time)

```bash
brew install cloudflared
```

### Start tunnel before testing OAuth

```bash
cloudflared tunnel --url http://localhost:3000
```

You'll see output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-words.trycloudflare.com
```

### Configure

1. Copy the tunnel URL (e.g., `https://random-words.trycloudflare.com`)
2. Update `.env`:
   ```bash
   API_URL=https://random-words.trycloudflare.com
   ```
3. **Google Cloud Console**: Add `${API_URL}/api/auth/google/callback` to authorized redirect URIs
4. **Nango Dashboard**: Ensure callback URLs use the tunnel URL
5. Restart the API server to pick up the new `API_URL`

### Alternative: localhost.run (no install required)

```bash
ssh -R 80:localhost:3000 localhost.run
```

### When tunnel is needed

| Test | Tunnel Required? |
|------|------------------|
| Google OAuth | Yes |
| Nango integrations | Yes |
| Extension WebSocket | No (connects to localhost) |
| MCP Server | No (uses API key auth) |
| Skill requests | No |
| Scrape tasks | No |

---

## 1. Google OAuth Signup

### Flow
Login Page → Click "Sign in with Google" → Google Auth → Callback → Dashboard

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 1.1 | Navigate to `/login` | Login page loads with Google button | **Page doesn't load**: Check web server is running on port 5173 |
| 1.2 | Click "Sign in with Google" | Redirect to Google OAuth | **500 error / JSON response**: `GOOGLE_CLIENT_ID` not configured in API environment |
| 1.3 | Complete Google sign-in | Redirect back to app | **"redirect_uri_mismatch"**: Google Cloud Console redirect URI doesn't match `${API_URL}/api/auth/google/callback` |
| 1.4 | Token exchange | Auto-redirected to app | **"token_exchange_failed"**: `GOOGLE_CLIENT_SECRET` invalid or Google API down |
| 1.5 | User info fetch | - | **"userinfo_failed"**: Google userinfo API unreachable |
| 1.6 | Final redirect | Redirected to `/overview` (new user) or `/chat` (returning) | **"oauth_failed"**: Database error creating user |

### Error Messages You'll See

| Error on `/login?error=X` | Cause | Fix |
|---------------------------|-------|-----|
| `missing_code` | Google didn't return auth code | User cancelled or network issue |
| `token_exchange_failed` | Code→token exchange failed | Check GOOGLE_CLIENT_SECRET |
| `userinfo_failed` | Can't get user profile | Google API issue |
| `oauth_not_configured` | Missing Google credentials | Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET |
| `oauth_failed` | Generic catch-all | Check API logs for details |

### Console Errors to Watch

```
API logs:
- "Google token exchange failed: {error}" → Token exchange issue
- "Google OAuth error: {error}" → Generic OAuth failure

Browser console:
- "Failed to fetch" → CORS issue or API unreachable
- Network tab showing 500 on /api/auth/google → Server-side config issue
```

---

## 2. Integration Connection (ATS/Calendar/Email)

### Flow
Settings → Integrations → Click Provider → Nango OAuth → Callback → Connected

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 2.1 | Navigate to `/integrations` | Integrations page loads | **401 error**: Not authenticated, token expired |
| 2.2 | Click "Connect" on a provider | Nango Connect UI opens | **NangoError in console**: `NANGO_SECRET_KEY` not configured |
| 2.3 | Complete provider OAuth | Redirect back to app | **Error in URL params**: Provider OAuth failed |
| 2.4 | Callback processed | "Integration connected successfully" message | **"Missing connection ID"**: Nango callback malformed |
| 2.5 | Verify in integrations list | Provider shows "connected" status | **Still "pending"**: Callback didn't update DB |

### Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Unknown provider: X` | Provider not in PROVIDER_CONFIG_KEYS | Check supported providers in nango.ts |
| `Failed to create session` | Nango API error | Verify NANGO_SECRET_KEY is valid |
| `Integration not found` | DB record missing | Check if /connect created integration record |
| `Integration is not connected` | Status still pending | Callback didn't fire or failed |

### Nango-Specific Errors

```
API response codes:
- 400: Invalid request (bad provider config key)
- 401: NANGO_SECRET_KEY invalid or expired
- 404: Nango integration config doesn't exist
- 500: Nango internal error
```

### Console/Network Debugging

```bash
# Test Nango session creation
curl -X POST http://localhost:3000/api/integrations/session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected: { "data": { "token": "...", "connectLink": "..." } }
# Error: { "error": { "message": "...", "code": "..." } }
```

---

## 3. Browser Extension Setup

### Flow
Download Extension → Load Unpacked → Configure API Key → Connect WebSocket

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 3.1 | Load extension in Chrome | Extension icon appears in toolbar | **Load error**: Check manifest.json syntax |
| 3.2 | Click extension icon | Popup shows config form | **Blank popup**: Check popup.html/js paths |
| 3.3 | Enter API URL | Field accepts input | - |
| 3.4 | Enter API Key | Field accepts `sk_live_...` format | **Invalid format**: Key must start with `sk_` |
| 3.5 | Click Connect | Status shows "Connected" | **Connection failed**: See WebSocket errors below |
| 3.6 | Verify in web app | Extension icon shows in onboarding | **Not detected**: Check `desktopEnabled` on org |

### WebSocket Connection Errors

| Console Message | Cause | Fix |
|-----------------|-------|-----|
| `[WS] Closed: 4001 Missing or invalid authentication` | API key invalid or revoked | Generate new key in dashboard |
| `[WS] Error: WebSocket connection failed` | API server unreachable | Check API_URL is correct |
| `[WS] Closed: 1006` | Abnormal closure, usually network | Check network connectivity |
| `[WS] Reconnecting in 3000ms...` | Normal reconnect attempt | Wait for reconnection |

### Extension Console Debugging

```
Open: chrome://extensions → Click "Service worker" link → Console

Look for:
- "[Skillomatic] Scraper initialized" → Extension loaded
- "[WS] Connecting to wss://..." → Connection attempt
- "[WS] Connected" → Success
- "[WS] Received: task_assigned" → Task received
```

### Onboarding Not Advancing

If extension connects but onboarding doesn't advance:
1. Check organization has `desktopEnabled = true`
2. Check user's `onboardingStep < ONBOARDING_STEPS.EXTENSION_INSTALLED` (2.5)
3. Check API logs for database update errors

---

## 4. MCP Server Installation

### Flow
Copy API Key → Configure Claude Desktop → Restart → Verify Tools

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 4.1 | Get API key from dashboard | Key copied: `sk_live_...` | **No keys shown**: Generate one first |
| 4.2 | Add to claude_desktop_config.json | Config saved | **JSON syntax error**: Validate JSON |
| 4.3 | Set SKILLOMATIC_API_KEY env | Variable set | **Not set**: MCP won't start |
| 4.4 | Restart Claude Desktop | App restarts | - |
| 4.5 | Check MCP connection | Skillomatic tools available | **Not connected**: Check MCP logs |

### MCP Startup Errors

| Log Message | Cause | Fix |
|-------------|-------|-----|
| `SKILLOMATIC_API_KEY environment variable is required` | Missing env var | Set SKILLOMATIC_API_KEY |
| `Invalid API key format. Key should start with "sk_live_" or "sk_test_"` | Malformed key | Check key format |
| `Authentication failed: ...` | Key invalid/revoked | Generate new key |
| `Failed to fetch capabilities: ...` | API unreachable | Check SKILLOMATIC_API_URL |

### MCP Log Location

```bash
# macOS
~/Library/Logs/Claude/mcp-server-skillomatic.log

# Check for errors
tail -f ~/Library/Logs/Claude/mcp*.log | grep -E "(error|Error|failed|Failed)"
```

### Verify MCP Tools

In Claude Desktop, type: "What tools do you have from Skillomatic?"

Expected tools (based on capabilities):
- Always: `list_skills`, `get_skill`, `create_scrape_task`, `get_scrape_task`, `scrape_url`
- If ATS connected: `search_ats_candidates`, `get_ats_candidate`, `create_ats_candidate`, `update_ats_candidate`

---

## 5. Skill Request Flow

### Flow
Request Skill → Check Capabilities → Render with Credentials → Return to Client

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 5.1 | Call `GET /api/skills` | List of available skills | **401**: Auth token invalid |
| 5.2 | Call `GET /api/skills/:slug` | Skill metadata returned | **404**: Skill doesn't exist or disabled |
| 5.3 | Call `GET /api/skills/:slug/rendered` | Skill with credentials | **400 MISSING_CAPABILITIES**: Required integration not connected |
| 5.4 | Call `GET /api/skills/config` | Capability profile returned | **Empty capabilities**: No integrations connected |

### Capability Check Errors

| Error Response | Cause | Fix |
|----------------|-------|-----|
| `This skill requires: ats, calendar. Please connect these integrations.` | Missing integrations | Connect required providers |
| `Skill is disabled` | Admin disabled skill | Enable in admin panel |
| `Skill has no instructions` | Skill template missing | Check skill record in DB |

### Capability Profile Debugging

```bash
# Check what capabilities user has
curl http://localhost:3000/api/skills/config \
  -H "Authorization: Bearer YOUR_JWT_OR_API_KEY"

# Response shows:
{
  "data": {
    "profile": {
      "hasLLM": true,    # Organization has LLM key
      "hasATS": true,    # ATS integration connected
      "hasCalendar": false,
      "hasEmail": false,
      "llmProvider": "anthropic",
      "atsProvider": "greenhouse"
    }
  }
}
```

### Template Variable Issues

If rendered skill has `{{VARIABLE}}` still in output:
- Variable not in capability profile
- Integration connected but token fetch failed
- Check `buildCapabilityProfile()` in skill-renderer.ts

---

## 6. Skill Execution (Scrape Task)

### Flow
Create Task → Extension Receives → Scrapes Page → Returns Result

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 6.1 | Create scrape task | Task created with `pending` status | **400**: URL validation failed |
| 6.2 | Task assigned to extension | Extension logs `task_assigned` | **No assignment**: Extension not connected |
| 6.3 | Extension opens tab | LinkedIn page loads | **Tab error**: Extension permissions |
| 6.4 | Content extracted | Markdown returned | **Empty result**: Content script failed |
| 6.5 | Task completed | Status = `completed` with result | **Status = failed**: See error below |
| 6.6 | Poll task status | Get result from API | **expired**: Extension didn't process in time |

### Task Creation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `URL is required` | Missing URL in request | Provide URL |
| `Only LinkedIn URLs are supported` | Non-LinkedIn domain | Only linkedin.com allowed |
| `Invalid URL format` | Malformed URL | Check URL syntax |

### Task Status Flow

```
pending → processing → completed
              ↓
           failed

pending → expired (after 1 hour TTL)
processing → failed (after 2 min timeout)
```

### Task Suggestions (Hints)

| Suggestion in Response | Meaning |
|------------------------|---------|
| `No Skillomatic Scraper extension detected...` | Task pending > 30s, no extension connected |
| `Task failed unexpectedly...` | Failed without error message |
| `Extension may have disconnected...` | Processing > 2 min |
| `Task expired...` | Pending > 1 hour |

### Extension Scrape Errors

| Extension Console Message | Cause | Fix |
|---------------------------|-------|-----|
| `[Task] Rejected: URL not allowed` | Non-LinkedIn URL | Only LinkedIn supported |
| `Scrape timeout - page took too long` | Page didn't load in 30s | Check network/LinkedIn availability |
| `Failed to extract page content` | Content script error | Check page structure changes |
| `Tab was closed before scraping completed` | User closed tab | Don't close scrape tabs |

### Full Scrape Flow Debugging

```bash
# 1. Create task
curl -X POST http://localhost:3000/api/v1/scrape/tasks \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.linkedin.com/in/someuser"}'

# Response: { "id": "task-uuid", "status": "pending", ... }

# 2. Poll for result
curl http://localhost:3000/api/v1/scrape/tasks/TASK_ID \
  -H "Authorization: Bearer sk_live_..."

# While pending: { "status": "pending", "suggestion": "..." }
# When done: { "status": "completed", "result": "# LinkedIn Page\n..." }
```

---

## 7. WebSocket Real-time Updates

### Flow
Web UI → Connect WS → Subscribe to Task → Receive Updates

### Test Steps

| Step | Action | Expected | Error Indicator |
|------|--------|----------|-----------------|
| 7.1 | Open chat/scrape page | WS connection established | **4001 close**: Auth invalid |
| 7.2 | Create scrape task | Task ID returned | - |
| 7.3 | Subscribe to task | `subscribed` message received | **No response**: Check WS handler |
| 7.4 | Extension completes task | `task_update` message received | **No update**: Event emission failed |

### WebSocket Message Types

```javascript
// Client → Server
{ "type": "subscribe", "taskId": "..." }
{ "type": "unsubscribe", "taskId": "..." }
{ "type": "ping" }

// Server → Client
{ "type": "connected", "userId": "..." }
{ "type": "subscribed", "taskId": "..." }
{ "type": "pong" }
{ "type": "task_update", "taskId": "...", "status": "completed", "result": "..." }
{ "type": "task_assigned" } // Extension only
```

### WebSocket Debugging

```javascript
// In browser console on app page
const ws = new WebSocket('ws://localhost:3000/ws/scrape?token=YOUR_JWT');
ws.onmessage = (e) => console.log('WS:', JSON.parse(e.data));
ws.onclose = (e) => console.log('WS closed:', e.code, e.reason);
```

---

## 8. Common Environment Issues

### Missing Environment Variables

| Variable | Used By | Error When Missing |
|----------|---------|-------------------|
| `GOOGLE_CLIENT_ID` | Auth | Google OAuth redirects fail |
| `GOOGLE_CLIENT_SECRET` | Auth | Token exchange fails |
| `NANGO_SECRET_KEY` | Integrations | All integration connections fail |
| `JWT_SECRET` | Auth | Token creation/verification fails |
| `TURSO_DATABASE_URL` | All | Database queries fail |
| `TURSO_AUTH_TOKEN` | All | Database auth fails |
| `SKILLOMATIC_API_KEY` | MCP | MCP server won't start |

### CORS Errors

If seeing `CORS policy` errors in browser:
1. Check `WEB_URL` matches frontend origin
2. Check API CORS config in `app.ts`
3. Ensure no proxy misconfiguration

### Database Connection

```bash
# Test database connection
pnpm db:studio  # Opens Drizzle Studio

# Check migrations ran
pnpm db:migrate
```

---

## 9. Quick Health Checks

### API Health

```bash
# Basic health
curl http://localhost:3000/api/health

# Auth check
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Integration Health

```bash
# Check integration status
curl http://localhost:3000/api/integrations/status/greenhouse \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Extension Health

1. Open extension popup → Check "Connected" status
2. Open extension service worker console → Look for `[WS] Connected`

### MCP Health

```bash
# Check MCP logs
tail -20 ~/Library/Logs/Claude/mcp-server-skillomatic.log

# Look for: "Skillomatic MCP server v... ready"
```

---

## 10. Error Recovery Procedures

### Token Expired
1. Log out completely
2. Clear localStorage
3. Log in again

### Integration Stuck in Pending
1. Click Disconnect
2. Reconnect the integration
3. Complete OAuth again

### Extension Not Receiving Tasks
1. Check extension popup status
2. Disconnect and reconnect
3. Verify API key is valid
4. Check service worker console for errors

### MCP Not Showing Tools
1. Check API key is valid
2. Restart Claude Desktop
3. Check MCP logs for startup errors
4. Verify capabilities endpoint returns expected profile

### Scrape Task Stuck
1. Check extension is connected
2. Wait up to 2 minutes for timeout
3. Create new task with `?refresh=true`
4. Check extension console for errors

---

## Test Order Recommendation

1. **Google OAuth** - Must work before anything else
2. **Integration Connection** - Needed for skill capabilities
3. **Extension Setup** - Needed for scraping
4. **MCP Installation** - Depends on valid API key
5. **Skill Request** - Depends on integrations
6. **Skill Execution** - Depends on extension
7. **WebSocket Updates** - Enhancement to above flows

---

## Error Handling Deep Dive

### Where Errors Are Caught & Displayed

| Layer | File | Catch Location | Display Method |
|-------|------|----------------|----------------|
| API Client | `apps/web/src/lib/api.ts:54-75` | All fetch calls | Throws Error with message |
| Auth Context | `apps/web/src/hooks/useAuth.tsx` | Token verify | Toast notification |
| Login Page | `apps/web/src/pages/Login.tsx:50-58, 70-71` | OAuth + token | Alert component |
| Integrations | `apps/web/src/pages/Integrations.tsx:155-156, 231-233` | List + connect | Alert banner |
| API Keys | `apps/web/src/pages/ApiKeys.tsx:33-34, 47-48` | Load + create | Alert banner |
| Extension Popup | `apps/skillomatic-scraper/popup.js` | Status + config | Red error banner + toast |
| Extension BG | `apps/skillomatic-scraper/background.js` | WS close/error | Stored in `lastError`, shown in popup |
| MCP Server | `packages/mcp/src/index.ts` | Startup + capabilities | stderr with detailed warnings |
| API Middleware | `apps/api/src/middleware/*.ts` | Auth failures | JSON error response |
| React Errors | `apps/web/src/components/ErrorBoundary.tsx` | Render crashes | Error card with stack trace |

### Previously Silent Failures (Now Fixed)

1. **Token expired during session** - NOW VISIBLE
   - Location: `useAuth.tsx`
   - Behavior: Shows toast notification "Your session has expired. Please log in again."
   - Visual: Red toast in bottom-right corner

2. **Extension WebSocket disconnect** - NOW VISIBLE
   - Location: `background.js`, `popup.js`
   - Behavior: Shows specific error in red banner at top of popup
   - Error messages include:
     - "Invalid or expired API key" (code 4001)
     - "Connection lost unexpectedly" (code 1006)
     - "Max reconnection attempts reached"
   - Visual: Red error banner + status dot changes to red/inactive

3. **MCP capabilities empty** - NOW VISIBLE
   - Location: `index.ts`
   - Behavior: Logs detailed warnings about missing integrations
   - Output example:
     ```
     === Missing Integrations ===
       - No ATS connected - ATS tools will not be available
       - No email integration - email tools will not be available
     Connect integrations at your Skillomatic dashboard to enable more tools.
     ```

4. **React rendering crashes** - NOW VISIBLE
   - Location: `ErrorBoundary.tsx`
   - Behavior: Shows error UI with details and retry/reload buttons
   - Visual: Centered error card with expandable stack trace

### Remaining Edge Cases

1. **Integration callback without user feedback**
   - Location: Nango UI closes
   - Behavior: If Nango Connect closes unexpectedly, no error shown
   - How to detect: Integration still shows "Not connected"
   - Fix: Check Nango dashboard, reconnect

### Error Message Mapping

**Login Page Errors** (`/login?error=X`):
```
missing_code      → "Authentication failed - no code received"
token_exchange_failed → "Failed to authenticate with Google"
userinfo_failed   → "Failed to get user information"
oauth_not_configured → "Google login is not configured"
oauth_failed      → "Authentication failed"
```

**API Error Format** (all endpoints):
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "OPTIONAL_ERROR_CODE"
  }
}
```

**Scrape Task Suggestions** (in response):
```
status=pending + >30s  → "No Skillomatic Scraper extension detected..."
status=failed          → "Task failed unexpectedly..."
status=processing + >2min → "Extension may have disconnected..."
status=expired         → "Task expired..."
```

### Browser DevTools Locations

| What to Check | DevTools Tab | Filter/Location |
|---------------|--------------|-----------------|
| API errors | Network | Status != 2xx |
| Auth issues | Application → Local Storage | `token` key |
| WebSocket | Network → WS | `/ws/scrape` |
| Extension logs | chrome://extensions → Service Worker | Console |
| React errors | Console | Red error text |

### API Server Logs

```bash
# Watch all API logs
pnpm --filter api dev 2>&1 | tee api.log

# Look for specific errors
grep -E "(error|Error|failed|Failed)" api.log

# Key patterns to watch:
# - "Google token exchange failed" - OAuth issue
# - "Google OAuth error" - Generic OAuth failure
# - "Failed to delete Nango connection" - Integration cleanup
# - "verifyToken" errors - JWT issues
```
