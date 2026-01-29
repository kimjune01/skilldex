/**
 * OAuth 2.1 endpoints for ChatGPT MCP Connector
 *
 * ChatGPT requires OAuth discovery metadata to connect to MCP servers.
 * This implements the minimal OAuth 2.1 flow needed:
 *
 * 1. /.well-known/oauth-protected-resource - Discovery metadata for MCP server
 * 2. /.well-known/oauth-authorization-server - Auth server metadata
 * 3. /oauth/authorize - Authorization endpoint (redirects to consent page)
 * 4. /oauth/token - Token endpoint (exchanges code for API key)
 * 5. /oauth/register - Dynamic client registration
 *
 * Flow:
 * 1. ChatGPT reads /.well-known/oauth-protected-resource from MCP URL
 * 2. ChatGPT reads /.well-known/oauth-authorization-server from auth server
 * 3. ChatGPT redirects user to /oauth/authorize
 * 4. User logs in (if needed) and approves
 * 5. We redirect back to ChatGPT with auth code
 * 6. ChatGPT exchanges code for access token at /oauth/token
 * 7. ChatGPT uses access token as Bearer token for MCP calls
 *
 * @see https://developers.openai.com/apps-sdk/build/auth/
 */

import { Hono } from 'hono';
import { db } from '@skillomatic/db';
import { apiKeys } from '@skillomatic/db/schema';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '../lib/logger.js';
import { generateApiKey } from '../lib/api-keys.js';
import { jwtAuth, type AuthPayload } from '../middleware/auth.js';

const log = createLogger('OAuth');

// In-memory store for auth codes (short-lived, 10 minutes)
// In production, consider using Redis or database
const authCodes = new Map<
  string,
  {
    userId: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    scopes: string[];
    expiresAt: Date;
  }
>();

// In-memory store for registered clients
// ChatGPT uses dynamic client registration
const registeredClients = new Map<
  string,
  {
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    clientName: string;
    createdAt: Date;
  }
>();

// Pre-registered client for ChatGPT (for manual OAuth setup)
// Users can use these credentials when ChatGPT asks for client ID/secret
const CHATGPT_CLIENT_ID = 'chatgpt_skillomatic';
const CHATGPT_CLIENT_SECRET = 'sk_chatgpt_oauth_secret_2024';
registeredClients.set(CHATGPT_CLIENT_ID, {
  clientId: CHATGPT_CLIENT_ID,
  clientSecret: CHATGPT_CLIENT_SECRET,
  redirectUris: ['https://chatgpt.com/connector_platform_oauth_redirect'],
  clientName: 'ChatGPT',
  createdAt: new Date(),
});

// Cleanup expired auth codes every minute
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes) {
    if (data.expiresAt.getTime() < now) {
      authCodes.delete(code);
    }
  }
}, 60 * 1000);

// Environment config
const getBaseUrl = () => process.env.API_URL || 'https://api.skillomatic.technology';
const getMcpUrl = () => process.env.MCP_URL || 'https://mcp.skillomatic.technology';
const getWebUrl = () => process.env.WEB_URL || 'https://skillomatic.technology';

export const oauthRoutes = new Hono();

/**
 * GET /.well-known/oauth-authorization-server
 *
 * Returns OAuth 2.1 authorization server metadata.
 * ChatGPT reads this to discover auth endpoints.
 */
oauthRoutes.get('/.well-known/oauth-authorization-server', (c) => {
  const baseUrl = getBaseUrl();

  return c.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    scopes_supported: ['mcp:full'],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    service_documentation: `${getWebUrl()}/docs`,
  });
});

/**
 * POST /oauth/register
 *
 * Dynamic client registration endpoint.
 * ChatGPT registers itself as a client before starting the auth flow.
 */
oauthRoutes.post('/oauth/register', async (c) => {
  const body = await c.req.json();

  const clientId = `client_${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = `secret_${crypto.randomUUID().replace(/-/g, '')}`;

  const client = {
    clientId,
    clientSecret,
    redirectUris: body.redirect_uris || [],
    clientName: body.client_name || 'ChatGPT',
    createdAt: new Date(),
  };

  registeredClients.set(clientId, client);

  log.info('oauth_client_registered', { clientId, clientName: client.clientName });

  return c.json({
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
    client_secret_expires_at: 0, // Never expires
    redirect_uris: client.redirectUris,
    client_name: client.clientName,
    token_endpoint_auth_method: 'client_secret_post',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  });
});

/**
 * GET /oauth/authorize
 *
 * Authorization endpoint. Redirects to login/consent page.
 * After user approves, redirects back to ChatGPT with auth code.
 */
oauthRoutes.get('/oauth/authorize', async (c) => {
  const clientId = c.req.query('client_id');
  const redirectUri = c.req.query('redirect_uri');
  const responseType = c.req.query('response_type');
  const scope = c.req.query('scope') || 'mcp:full';
  const state = c.req.query('state');
  const codeChallenge = c.req.query('code_challenge');
  const codeChallengeMethod = c.req.query('code_challenge_method') || 'S256';

  // Validate required params
  if (!clientId || !redirectUri || responseType !== 'code') {
    return c.json({ error: 'invalid_request', error_description: 'Missing required parameters' }, 400);
  }

  if (!codeChallenge) {
    return c.json({ error: 'invalid_request', error_description: 'PKCE code_challenge required' }, 400);
  }

  // Store auth request params in URL and redirect to web consent page
  const webUrl = getWebUrl();
  const consentUrl = new URL(`${webUrl}/oauth/consent`);
  consentUrl.searchParams.set('client_id', clientId);
  consentUrl.searchParams.set('redirect_uri', redirectUri);
  consentUrl.searchParams.set('scope', scope);
  consentUrl.searchParams.set('state', state || '');
  consentUrl.searchParams.set('code_challenge', codeChallenge);
  consentUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

  return c.redirect(consentUrl.toString());
});

/**
 * POST /oauth/approve
 *
 * Called by the web consent page after user approves.
 * Generates auth code and redirects back to ChatGPT.
 */
oauthRoutes.post('/oauth/approve', jwtAuth, async (c) => {
  const user = c.get('user') as AuthPayload;
  const body = await c.req.json();

  const { clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod } = body;

  if (!clientId || !redirectUri || !codeChallenge) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  // Generate auth code
  const code = `code_${crypto.randomUUID().replace(/-/g, '')}`;

  // Store code with metadata (expires in 10 minutes)
  authCodes.set(code, {
    userId: user.id,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod: codeChallengeMethod || 'S256',
    scopes: (scope || 'mcp:full').split(' '),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  log.info('oauth_code_issued', { userId: user.id, clientId });

  // Build redirect URL with code
  const redirect = new URL(redirectUri);
  redirect.searchParams.set('code', code);
  if (state) {
    redirect.searchParams.set('state', state);
  }

  return c.json({ redirect_uri: redirect.toString() });
});

/**
 * POST /oauth/token
 *
 * Token endpoint. Exchanges auth code for access token (API key).
 */
oauthRoutes.post('/oauth/token', async (c) => {
  const contentType = c.req.header('content-type') || '';

  let grantType: string | undefined;
  let code: string | undefined;
  let redirectUri: string | undefined;
  let clientId: string | undefined;
  let clientSecret: string | undefined;
  let codeVerifier: string | undefined;

  // Handle both form-urlencoded and JSON
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const body = await c.req.parseBody();
    grantType = body.grant_type as string;
    code = body.code as string;
    redirectUri = body.redirect_uri as string;
    clientId = body.client_id as string;
    clientSecret = body.client_secret as string;
    codeVerifier = body.code_verifier as string;
  } else {
    const body = await c.req.json();
    grantType = body.grant_type;
    code = body.code;
    redirectUri = body.redirect_uri;
    clientId = body.client_id;
    clientSecret = body.client_secret;
    codeVerifier = body.code_verifier;
  }

  // Check for client credentials in Authorization header
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6));
    const [headerClientId, headerClientSecret] = decoded.split(':');
    clientId = clientId || headerClientId;
    clientSecret = clientSecret || headerClientSecret;
  }

  if (grantType !== 'authorization_code') {
    return c.json({ error: 'unsupported_grant_type' }, 400);
  }

  if (!code || !codeVerifier) {
    return c.json({ error: 'invalid_request', error_description: 'Missing code or code_verifier' }, 400);
  }

  // Look up auth code
  const authCode = authCodes.get(code);
  if (!authCode) {
    return c.json({ error: 'invalid_grant', error_description: 'Invalid or expired code' }, 400);
  }

  // Verify code hasn't expired
  if (authCode.expiresAt.getTime() < Date.now()) {
    authCodes.delete(code);
    return c.json({ error: 'invalid_grant', error_description: 'Code expired' }, 400);
  }

  // Verify PKCE code_verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const expectedChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (expectedChallenge !== authCode.codeChallenge) {
    return c.json({ error: 'invalid_grant', error_description: 'Invalid code_verifier' }, 400);
  }

  // Verify redirect_uri matches
  if (redirectUri && redirectUri !== authCode.redirectUri) {
    return c.json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' }, 400);
  }

  // Delete used code
  authCodes.delete(code);

  // Generate API key for this user (or reuse existing ChatGPT key)
  const existingKey = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, authCode.userId), eq(apiKeys.name, 'ChatGPT OAuth')))
    .limit(1);

  let accessToken: string;

  if (existingKey.length > 0 && existingKey[0].key) {
    // Reuse existing key
    accessToken = existingKey[0].key;
  } else {
    // Generate new API key
    accessToken = generateApiKey();
    await db.insert(apiKeys).values({
      id: crypto.randomUUID(),
      userId: authCode.userId,
      name: 'ChatGPT OAuth',
      key: accessToken,
      createdAt: new Date(),
    });
  }

  log.info('oauth_token_issued', { userId: authCode.userId, clientId });

  return c.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 31536000, // 1 year (API keys don't expire)
    scope: authCode.scopes.join(' '),
  });
});

/**
 * MCP Protected Resource Metadata
 *
 * This is served from the MCP domain (mcp.skillomatic.technology).
 * Returns pointer to the authorization server.
 */
export const mcpOauthRoutes = new Hono();

mcpOauthRoutes.get('/.well-known/oauth-protected-resource', (c) => {
  const mcpUrl = getMcpUrl();
  const baseUrl = getBaseUrl();

  return c.json({
    resource: mcpUrl,
    authorization_servers: [baseUrl],
    scopes_supported: ['mcp:full'],
    resource_documentation: `${getWebUrl()}/docs`,
  });
});
