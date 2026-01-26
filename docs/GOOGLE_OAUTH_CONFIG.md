# Google OAuth Configuration

This document lists all OAuth redirect URIs required for the Skillomatic API.

## Google Cloud Project

- **Project ID**: `skillomatic-485022`
- **Project Number**: `356985597836`
- **OAuth Client ID**: `356985597836-cr9b5abdtq31qs10nmmg68mvq9ko8cgm.apps.googleusercontent.com`

## Console URL

https://console.cloud.google.com/apis/credentials?project=skillomatic-485022

## Required Redirect URIs

### Production (api.skillomatic.technology)

| Service | Redirect URI |
|---------|-------------|
| Google Sign-in | `https://api.skillomatic.technology/auth/google/callback` |
| Gmail | `https://api.skillomatic.technology/integrations/gmail/callback` |
| Google Calendar | `https://api.skillomatic.technology/integrations/google-calendar/callback` |
| Google Sheets | `https://api.skillomatic.technology/integrations/google-sheets/callback` |
| Nango (generic) | `https://api.skillomatic.technology/integrations/callback` |

### Local Development (localhost:3000)

| Service | Redirect URI |
|---------|-------------|
| Google Sign-in | `http://localhost:3000/auth/google/callback` |
| Gmail | `http://localhost:3000/integrations/gmail/callback` |
| Google Calendar | `http://localhost:3000/integrations/google-calendar/callback` |
| Google Sheets | `http://localhost:3000/integrations/google-sheets/callback` |
| Nango (generic) | `http://localhost:3000/integrations/callback` |

### Lambda URLs (AWS deployment)

These are the direct Lambda function URLs. Replace `XXXXXX` with actual Lambda URL prefix:

| Service | Redirect URI |
|---------|-------------|
| Gmail | `https://XXXXXX.lambda-url.us-west-2.on.aws/integrations/gmail/callback` |
| Google Calendar | `https://XXXXXX.lambda-url.us-west-2.on.aws/integrations/google-calendar/callback` |
| Google Sheets | `https://XXXXXX.lambda-url.us-west-2.on.aws/integrations/google-sheets/callback` |

## Full List (Copy-Paste Ready)

```
https://api.skillomatic.technology/auth/google/callback
https://api.skillomatic.technology/integrations/gmail/callback
https://api.skillomatic.technology/integrations/google-calendar/callback
https://api.skillomatic.technology/integrations/google-sheets/callback
https://api.skillomatic.technology/integrations/callback
http://localhost:3000/auth/google/callback
http://localhost:3000/integrations/gmail/callback
http://localhost:3000/integrations/google-calendar/callback
http://localhost:3000/integrations/google-sheets/callback
http://localhost:3000/integrations/callback
```

## How Redirect URIs Are Used

The API dynamically builds redirect URIs based on the `API_URL` environment variable:

```typescript
// In apps/api/src/lib/google-oauth.ts
const redirectUri = `${baseUrl}/integrations/${service}/callback`;

// In apps/api/src/routes/auth.ts
const redirectUri = `${baseUrl}/auth/google/callback`;

// In apps/api/src/routes/integrations.ts (Nango)
const callbackUrl = `${apiUrl}/integrations/callback`;
```

## Adding a New Google Integration

When adding a new Google service (e.g., Google Drive):

1. Add the callback route in `apps/api/src/lib/google-oauth.ts`
2. Add redirect URIs to Google Cloud Console:
   - `https://api.skillomatic.technology/integrations/google-drive/callback`
   - `http://localhost:3000/integrations/google-drive/callback`
3. Update this document

## Troubleshooting

### "redirect_uri_mismatch" Error

This means the redirect URI in your OAuth request doesn't match any configured in Google Cloud Console.

1. Check the error message for the exact URI being used
2. Verify it's listed in the Console under **Authorized redirect URIs**
3. URIs must match exactly (including trailing slashes, http vs https)

### Common Issues

- **Missing localhost URI**: Add `http://localhost:3000/...` for local dev
- **Wrong protocol**: Production must use `https://`, localhost uses `http://`
- **Trailing slash mismatch**: `/callback` vs `/callback/` are different URIs

## Notes

- Google does not provide CLI or API access to manage OAuth credentials
- Changes must be made manually in the Google Cloud Console
- OAuth client secrets are stored in environment variables (see `.env.example`)
