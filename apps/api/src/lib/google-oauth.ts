import { Hono, type Context } from 'hono';
import type { BlankEnv, BlankInput } from 'hono/types';
import { db } from '@skillomatic/db';
import { integrations, users, ONBOARDING_STEPS } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { verifyToken } from './jwt.js';
import { SignJWT, jwtVerify } from 'jose';
import { createLogger } from './logger.js';

// Google OAuth constants
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Gmail-specific scopes (domain verified in Google Search Console)
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Google Calendar scopes
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Google Sheets scopes (includes Drive for file search/creation)
const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file', // Create/access files created by this app
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Combined Google scopes for one-click onboarding (Gmail + Calendar + Sheets)
const GOOGLE_ALL_SCOPES = [
  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  // Calendar
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  // Sheets + Drive
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  // Shared
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const log = createLogger('GoogleOAuth');

/**
 * Refresh a Google OAuth access token using the refresh token.
 * Returns the new access token and updated metadata, or null if refresh fails.
 *
 * This function is shared between the token endpoints and the data proxy.
 */
export async function refreshGoogleToken(
  refreshToken: string,
  metadata: Record<string, unknown>
): Promise<{ accessToken: string; metadata: Record<string, unknown> } | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    log.error('google_token_refresh_missing_config');
    return null;
  }

  try {
    const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      log.warn('google_token_refresh_failed', { status: refreshResponse.status });
      return null;
    }

    const newTokens = await refreshResponse.json() as {
      access_token: string;
      expires_in?: number;
    };

    // Update metadata with new token
    const updatedMetadata = {
      ...metadata,
      accessToken: newTokens.access_token,
      expiresAt: newTokens.expires_in
        ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        : undefined,
    };

    return {
      accessToken: newTokens.access_token,
      metadata: updatedMetadata,
    };
  } catch (err) {
    log.error('google_token_refresh_error', { error: err instanceof Error ? err.message : 'Unknown' });
    return null;
  }
}

/**
 * Check if a Google OAuth token needs refresh based on expiration time.
 * Returns true if the token is expired or will expire within 5 minutes.
 */
export function isGoogleTokenExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false; // No expiry info, assume valid
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return expiryTime < now + fiveMinutes; // Refresh 5 min before expiry
}

/**
 * Helper to determine canonical URLs from request.
 * In production, always uses canonical domain names for consistent OAuth redirect URIs.
 */
export function getUrlsFromRequest(c: Context) {
  const host = c.req.header('host') || 'localhost:3000';
  const isLocal = host.includes('localhost');
  const protocol = isLocal ? 'http' : 'https';

  // In production, always use the canonical domain names
  // The Lambda may be hit directly but we need consistent redirect URIs for OAuth
  let baseUrl: string;
  let webUrl: string;

  if (isLocal) {
    baseUrl = `${protocol}://${host}`;
    webUrl = baseUrl.replace(':3000', ':5173');
  } else {
    // Production: use canonical domains regardless of how the request arrived
    baseUrl = 'https://api.skillomatic.technology';
    webUrl = 'https://skillomatic.technology';
  }

  return { host, protocol, baseUrl, webUrl };
}

// Google OAuth configuration for different services
export type GoogleService = 'gmail' | 'google-calendar' | 'google-sheets';

const GOOGLE_SERVICE_CONFIG: Record<GoogleService, {
  scopes: string;
  provider: string;
  stateType: string;
  emailField: string;
  displayName: string;
}> = {
  gmail: {
    scopes: GMAIL_SCOPES,
    provider: 'email',
    stateType: 'gmail_oauth',
    emailField: 'gmailEmail',
    displayName: 'Gmail',
  },
  'google-calendar': {
    scopes: GOOGLE_CALENDAR_SCOPES,
    provider: 'calendar',
    stateType: 'google_calendar_oauth',
    emailField: 'calendarEmail',
    displayName: 'Google Calendar',
  },
  'google-sheets': {
    scopes: GOOGLE_SHEETS_SCOPES,
    provider: 'google-sheets',
    stateType: 'google_sheets_oauth',
    emailField: 'sheetsEmail',
    displayName: 'Google Sheets',
  },
};

// Combined Google OAuth connect handler (Gmail + Calendar + Sheets in one click)
async function handleGoogleCombinedOAuthConnect(
  c: Context<BlankEnv, string, BlankInput>
) {
  // Get token from query param or header
  const queryToken = c.req.query('token');
  const authHeader = c.req.header('Authorization');
  const token = queryToken || authHeader?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: { message: 'Missing authentication token' } }, 401);
  }

  // Verify JWT using existing verifyToken function
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token' } }, 401);
  }

  if (!GOOGLE_CLIENT_ID) {
    return c.json({ error: { message: 'Google OAuth not configured' } }, 500);
  }

  // Determine the redirect URI based on the request origin
  const { baseUrl } = getUrlsFromRequest(c);
  const redirectUri = `${baseUrl}/integrations/google/callback`;

  // Create a state token that includes the user ID (for callback verification)
  const stateSecret = new TextEncoder().encode(JWT_SECRET);
  const state = await new SignJWT({ sub: payload.sub, type: 'google_combined_oauth' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(stateSecret);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_ALL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

// Generic Google OAuth connect handler
async function handleGoogleOAuthConnect(
  c: Context<BlankEnv, string, BlankInput>,
  service: GoogleService
) {
  const config = GOOGLE_SERVICE_CONFIG[service];

  // Get token from query param or header
  const queryToken = c.req.query('token');
  const authHeader = c.req.header('Authorization');
  const token = queryToken || authHeader?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: { message: 'Missing authentication token' } }, 401);
  }

  // Verify JWT using existing verifyToken function
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token' } }, 401);
  }

  if (!GOOGLE_CLIENT_ID) {
    return c.json({ error: { message: 'Google OAuth not configured' } }, 500);
  }

  // Determine the redirect URI based on the request origin
  const { baseUrl } = getUrlsFromRequest(c);
  const redirectUri = `${baseUrl}/integrations/${service}/callback`;

  // Create a state token that includes the user ID (for callback verification)
  const stateSecret = new TextEncoder().encode(JWT_SECRET);
  const state = await new SignJWT({ sub: payload.sub, type: config.stateType })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(stateSecret);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

// Combined Google OAuth callback handler (creates Gmail + Calendar + Sheets integrations)
async function handleGoogleCombinedOAuthCallback(
  c: Context<BlankEnv, string, BlankInput>
) {
  const code = c.req.query('code');
  const error = c.req.query('error');
  const state = c.req.query('state');

  const { baseUrl, webUrl } = getUrlsFromRequest(c);
  const redirectUri = `${baseUrl}/integrations/google/callback`;

  if (error) {
    log.warn('google_combined_oauth_error', { error });
    return c.redirect(`${webUrl}/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return c.redirect(`${webUrl}/integrations?error=missing_code_or_state`);
  }

  // Verify state token to get user ID
  let userId: string;
  try {
    const stateSecret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(state, stateSecret);
    if (payload.type !== 'google_combined_oauth') {
      throw new Error('Invalid state token type');
    }
    userId = payload.sub as string;
  } catch (err) {
    log.warn('google_combined_oauth_invalid_state', { error: err instanceof Error ? err.message : 'Unknown' });
    return c.redirect(`${webUrl}/integrations?error=invalid_state`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return c.redirect(`${webUrl}/integrations?error=oauth_not_configured`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google combined token exchange failed:', errorText);
      return c.redirect(`${webUrl}/integrations?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type: string;
    };

    // Get user info to verify email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let userEmail = '';
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json() as { email: string };
      userEmail = userInfo.email;
    }

    // Get user's organization ID
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const baseMetadata = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : undefined,
    };

    // Create all three integrations with the same tokens
    const integrationsToCreate: Array<{
      provider: string;
      metadata: Record<string, unknown>;
    }> = [
      {
        provider: 'email',
        metadata: {
          ...baseMetadata,
          accessLevel: 'read-write',
          subProvider: 'gmail',
          gmailEmail: userEmail,
        },
      },
      {
        provider: 'calendar',
        metadata: {
          ...baseMetadata,
          accessLevel: 'read-write',
          subProvider: 'google-calendar',
          calendarEmail: userEmail,
        },
      },
      {
        provider: 'google-sheets',
        metadata: {
          ...baseMetadata,
          accessLevel: 'read-write',
          subProvider: 'google-sheets',
          sheetsEmail: userEmail,
          tabs: [],
          tabsVersion: 0,
        },
      },
    ];

    // For Google Sheets, find existing or create new spreadsheet
    const sheetsIntegration = integrationsToCreate.find(i => i.provider === 'google-sheets');
    if (sheetsIntegration) {
      try {
        // First, search for existing "Skillomatic Data" spreadsheet
        const searchParams = new URLSearchParams({
          q: "name='Skillomatic Data' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
          fields: 'files(id,name,webViewLink)',
          orderBy: 'modifiedTime desc',
          pageSize: '1',
        });

        const searchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          }
        );

        let spreadsheetId: string | null = null;
        let spreadsheetUrl: string | null = null;

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json() as {
            files: Array<{ id: string; name: string; webViewLink: string }>;
          };

          if (searchResult.files && searchResult.files.length > 0) {
            const existing = searchResult.files[0];
            spreadsheetId = existing.id;
            spreadsheetUrl = existing.webViewLink;
            log.info('google_sheets_found_existing', { userId, spreadsheetId });
          }
        }

        // If no existing spreadsheet found, create a new one
        if (!spreadsheetId) {
          const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: { title: 'Skillomatic Data' },
              sheets: [{ properties: { title: 'Sheet1' } }],
            }),
          });

          if (createResponse.ok) {
            const sheet = await createResponse.json() as {
              spreadsheetId: string;
              spreadsheetUrl: string;
            };
            spreadsheetId = sheet.spreadsheetId;
            spreadsheetUrl = sheet.spreadsheetUrl;
            log.info('google_sheets_created', { userId, spreadsheetId });
          }
        }

        if (spreadsheetId) {
          sheetsIntegration.metadata.spreadsheetId = spreadsheetId;
          sheetsIntegration.metadata.spreadsheetUrl = spreadsheetUrl;
          sheetsIntegration.metadata.spreadsheetTitle = 'Skillomatic Data';
        }
      } catch (err) {
        log.warn('google_sheets_setup_failed', { userId, error: err instanceof Error ? err.message : 'Unknown' });
      }
    }

    // Delete existing integrations and insert new ones
    for (const int of integrationsToCreate) {
      await db
        .delete(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.provider, int.provider)));

      await db.insert(integrations).values({
        id: randomUUID(),
        userId,
        organizationId: dbUser?.organizationId ?? null,
        provider: int.provider,
        status: 'connected',
        metadata: JSON.stringify(int.metadata),
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    log.info('google_combined_connected', { userId, email: userEmail });

    // Advance onboarding to sheets connected (highest step)
    if (dbUser && dbUser.onboardingStep < ONBOARDING_STEPS.SHEETS_CONNECTED) {
      await db
        .update(users)
        .set({
          onboardingStep: ONBOARDING_STEPS.SHEETS_CONNECTED,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return c.redirect(`${webUrl}/integrations?success=${encodeURIComponent('Google connected successfully (Gmail, Calendar, Sheets)')}`);
  } catch (err) {
    console.error('Google combined OAuth error:', err);
    return c.redirect(`${webUrl}/integrations?error=oauth_failed`);
  }
}

// Generic Google OAuth callback handler
async function handleGoogleOAuthCallback(
  c: Context<BlankEnv, string, BlankInput>,
  service: GoogleService
) {
  const config = GOOGLE_SERVICE_CONFIG[service];
  const code = c.req.query('code');
  const error = c.req.query('error');
  const state = c.req.query('state');

  const { baseUrl, webUrl } = getUrlsFromRequest(c);
  const redirectUri = `${baseUrl}/integrations/${service}/callback`;

  if (error) {
    log.warn(`${service}_oauth_error`, { error });
    return c.redirect(`${webUrl}/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return c.redirect(`${webUrl}/integrations?error=missing_code_or_state`);
  }

  // Verify state token to get user ID
  let userId: string;
  try {
    const stateSecret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(state, stateSecret);
    if (payload.type !== config.stateType) {
      throw new Error('Invalid state token type');
    }
    userId = payload.sub as string;
  } catch (err) {
    log.warn(`${service}_oauth_invalid_state`, { error: err instanceof Error ? err.message : 'Unknown' });
    return c.redirect(`${webUrl}/integrations?error=invalid_state`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return c.redirect(`${webUrl}/integrations?error=oauth_not_configured`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`${config.displayName} token exchange failed:`, errorText);
      return c.redirect(`${webUrl}/integrations?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type: string;
    };

    // Get user info to verify email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let userEmail = '';
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json() as { email: string };
      userEmail = userInfo.email;
    }

    // Store tokens in integration record
    const existingIntegration = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, config.provider)))
      .limit(1);

    // Get user's organization ID
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const metadata: Record<string, unknown> = {
      accessLevel: 'read-write',
      subProvider: service,
      [config.emailField]: userEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : undefined,
    };

    // For Google Sheets, find existing or create new spreadsheet with tabs system
    if (service === 'google-sheets') {
      try {
        // First, search for existing "Skillomatic Data" spreadsheet
        const searchParams = new URLSearchParams({
          q: "name='Skillomatic Data' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
          fields: 'files(id,name,webViewLink)',
          orderBy: 'modifiedTime desc',
          pageSize: '1',
        });

        const searchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          }
        );

        let spreadsheetId: string | null = null;
        let spreadsheetUrl: string | null = null;

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json() as {
            files: Array<{ id: string; name: string; webViewLink: string }>;
          };

          if (searchResult.files && searchResult.files.length > 0) {
            // Found existing spreadsheet
            const existing = searchResult.files[0];
            spreadsheetId = existing.id;
            spreadsheetUrl = existing.webViewLink;
            log.info('google_sheets_found_existing', { userId, spreadsheetId });
          }
        }

        // If no existing spreadsheet found, create a new one
        if (!spreadsheetId) {
          const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: { title: 'Skillomatic Data' },
              sheets: [{ properties: { title: 'Sheet1' } }], // Default empty sheet
            }),
          });

          if (createResponse.ok) {
            const sheet = await createResponse.json() as {
              spreadsheetId: string;
              spreadsheetUrl: string;
            };
            spreadsheetId = sheet.spreadsheetId;
            spreadsheetUrl = sheet.spreadsheetUrl;
            log.info('google_sheets_created', { userId, spreadsheetId });
          }
        }

        if (spreadsheetId) {
          metadata.spreadsheetId = spreadsheetId;
          metadata.spreadsheetUrl = spreadsheetUrl;
          metadata.spreadsheetTitle = 'Skillomatic Data';
          // Initialize tabs system - empty array, user will create tabs via MCP tools
          metadata.tabs = [];
          metadata.tabsVersion = 0;
        }
      } catch (err) {
        log.warn('google_sheets_setup_failed', { userId, error: err instanceof Error ? err.message : 'Unknown' });
        // Continue anyway - user can set up manually
        // Initialize empty tabs system even if spreadsheet setup failed
        metadata.tabs = [];
        metadata.tabsVersion = 0;
      }
    }

    // Delete any existing integration for this provider (one per user)
    if (existingIntegration.length > 0) {
      await db
        .delete(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.provider, config.provider)));
    }

    // Insert fresh integration
    await db.insert(integrations).values({
      id: randomUUID(),
      userId,
      organizationId: dbUser?.organizationId ?? null,
      provider: config.provider,
      status: 'connected',
      metadata: JSON.stringify(metadata),
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    log.info(`${service}_connected`, { userId, email: userEmail });

    // Advance onboarding based on which provider was connected
    if (dbUser) {
      let newStep: number | null = null;

      if (config.provider === 'google-sheets' && dbUser.onboardingStep < ONBOARDING_STEPS.SHEETS_CONNECTED) {
        newStep = ONBOARDING_STEPS.SHEETS_CONNECTED;
      } else if (config.provider === 'email' && dbUser.onboardingStep < ONBOARDING_STEPS.EMAIL_CONNECTED) {
        newStep = ONBOARDING_STEPS.EMAIL_CONNECTED;
      } else if (config.provider === 'calendar' && dbUser.onboardingStep < ONBOARDING_STEPS.CALENDAR_CONNECTED) {
        newStep = ONBOARDING_STEPS.CALENDAR_CONNECTED;
      }

      if (newStep !== null) {
        await db
          .update(users)
          .set({
            onboardingStep: newStep,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    }

    return c.redirect(`${webUrl}/integrations?success=${encodeURIComponent(config.displayName + ' connected successfully')}`);
  } catch (err) {
    console.error(`${config.displayName} OAuth error:`, err);
    return c.redirect(`${webUrl}/integrations?error=oauth_failed`);
  }
}

// Generic token endpoint for Google OAuth services
async function handleGoogleTokenRequest(
  c: Context<BlankEnv, string, BlankInput> & { get: (key: 'user') => { sub: string; email: string; organizationId: string | null } },
  service: GoogleService
) {
  const config = GOOGLE_SERVICE_CONFIG[service];
  const user = c.get('user');

  const integration = await db
    .select()
    .from(integrations)
    .where(and(
      eq(integrations.userId, user.sub),
      eq(integrations.provider, config.provider),
      eq(integrations.status, 'connected')
    ))
    .limit(1);

  if (integration.length === 0) {
    return c.json({ error: { message: `${config.displayName} not connected` } }, 404);
  }

  const int = integration[0];

  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(int.metadata || '{}');
  } catch {
    return c.json({ error: { message: 'Invalid integration metadata' } }, 500);
  }

  // Check if token is expired and refresh if needed
  const expiresAt = metadata.expiresAt as string | undefined;
  const refreshToken = metadata.refreshToken as string | undefined;
  let accessToken = metadata.accessToken as string | undefined;

  if (isGoogleTokenExpired(expiresAt) && refreshToken) {
    // Token expired, refresh it using shared helper
    const refreshResult = await refreshGoogleToken(refreshToken, metadata);

    if (refreshResult) {
      accessToken = refreshResult.accessToken;
      metadata = refreshResult.metadata;

      // Update stored token
      await db
        .update(integrations)
        .set({
          metadata: JSON.stringify(metadata),
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, int.id));

      log.info(`${service}_token_refreshed`, { userId: user.sub });
    } else {
      // Refresh failed - mark integration as error
      await db
        .update(integrations)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(integrations.id, int.id));

      return c.json({ error: { message: `Failed to refresh token - please reconnect ${config.displayName}` } }, 401);
    }
  }

  if (!accessToken) {
    return c.json({ error: { message: 'No access token available' } }, 500);
  }

  return c.json({
    data: {
      accessToken,
      tokenType: 'Bearer',
      email: metadata[config.emailField],
    },
  });
}

/**
 * Create Google OAuth routes for a Hono app.
 * These routes handle OAuth connect, callback, and token refresh for Gmail and Google Calendar.
 *
 * IMPORTANT: These routes must be registered BEFORE JWT auth middleware.
 */
export function createGoogleOAuthRoutes() {
  const routes = new Hono();

  // Combined Google OAuth (Gmail + Calendar + Sheets in one click)
  routes.get('/google/connect', handleGoogleCombinedOAuthConnect);
  routes.get('/google/callback', handleGoogleCombinedOAuthCallback);

  // Individual connect routes (no auth middleware - uses token from query param)
  routes.get('/gmail/connect', (c) => handleGoogleOAuthConnect(c, 'gmail'));
  routes.get('/google-calendar/connect', (c) => handleGoogleOAuthConnect(c, 'google-calendar'));
  routes.get('/google-sheets/connect', (c) => handleGoogleOAuthConnect(c, 'google-sheets'));

  // Individual callback routes (no auth middleware - uses state token)
  routes.get('/gmail/callback', (c) => handleGoogleOAuthCallback(c, 'gmail'));
  routes.get('/google-calendar/callback', (c) => handleGoogleOAuthCallback(c, 'google-calendar'));
  routes.get('/google-sheets/callback', (c) => handleGoogleOAuthCallback(c, 'google-sheets'));

  return routes;
}

/**
 * Create Google OAuth token routes for a Hono app.
 * These routes require JWT auth middleware to be applied.
 */
export function createGoogleOAuthTokenRoutes() {
  const routes = new Hono();

  routes.get('/gmail/token', (c) => handleGoogleTokenRequest(c, 'gmail'));
  routes.get('/google-calendar/token', (c) => handleGoogleTokenRequest(c, 'google-calendar'));
  routes.get('/google-sheets/token', (c) => handleGoogleTokenRequest(c, 'google-sheets'));

  return routes;
}
