# OAuth Troubleshooting Skill

This skill helps diagnose and resolve OAuth redirect URI errors for Google integrations.

## When to Use

Activate this skill when:
- User reports "redirect_uri_mismatch" errors
- OAuth flow fails with Google services (Gmail, Calendar, Sheets)
- User asks about Google OAuth configuration
- Integration connection fails during OAuth callback

## Diagnostic Steps

### 1. Identify the Error

Common OAuth errors:
- `redirect_uri_mismatch` - The redirect URI doesn't match Google Cloud Console config
- `invalid_client` - Client ID is wrong or doesn't exist
- `access_denied` - User denied permission or app not verified

### 2. Check the Redirect URI Being Used

The API builds redirect URIs dynamically based on `API_URL` environment variable:

```typescript
// Google Sign-in: apps/api/src/routes/auth.ts
const redirectUri = `${baseUrl}/auth/google/callback`;

// Google integrations: apps/api/src/lib/google-oauth.ts
const redirectUri = `${baseUrl}/integrations/${service}/callback`;

// Nango integrations: apps/api/src/routes/integrations.ts
const callbackUrl = `${apiUrl}/integrations/callback`;
```

### 3. Reference the Configuration Doc

All required redirect URIs are documented in: `docs/GOOGLE_OAUTH_CONFIG.md`

Key URIs that must be configured in Google Cloud Console:

**Production:**
- `https://api.skillomatic.technology/auth/google/callback`
- `https://api.skillomatic.technology/integrations/gmail/callback`
- `https://api.skillomatic.technology/integrations/google-calendar/callback`
- `https://api.skillomatic.technology/integrations/google-sheets/callback`
- `https://api.skillomatic.technology/integrations/callback`

**Local Development:**
- `http://localhost:3000/auth/google/callback`
- `http://localhost:3000/integrations/gmail/callback`
- `http://localhost:3000/integrations/google-calendar/callback`
- `http://localhost:3000/integrations/google-sheets/callback`
- `http://localhost:3000/integrations/callback`

### 4. Guide User to Fix

Google Cloud Console URL:
```
https://console.cloud.google.com/apis/credentials?project=skillomatic-485022
```

OAuth Client ID: `356985597836-cr9b5abdtq31qs10nmmg68mvq9ko8cgm.apps.googleusercontent.com`

**Important:** Google does NOT provide CLI or API access to manage OAuth credentials. Changes must be made manually in the Google Cloud Console UI.

### 5. Common Fixes

| Problem | Solution |
|---------|----------|
| Missing localhost URI | Add `http://localhost:3000/integrations/{service}/callback` |
| Wrong protocol | Production uses `https://`, localhost uses `http://` |
| Trailing slash mismatch | Ensure URIs match exactly (no trailing slash) |
| New integration added | Add both prod and localhost callback URIs |
| Lambda URL changed | Update Lambda URLs in Console |

## Adding New Google Integrations

When the codebase adds a new Google service:

1. Add callback route in `apps/api/src/lib/google-oauth.ts`
2. Tell user to add redirect URIs to Google Cloud Console:
   - `https://api.skillomatic.technology/integrations/{new-service}/callback`
   - `http://localhost:3000/integrations/{new-service}/callback`
3. Update `docs/GOOGLE_OAUTH_CONFIG.md`

## Environment Variables

Relevant env vars for OAuth:
- `API_URL` - Base URL for building redirect URIs
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret (never log this)
