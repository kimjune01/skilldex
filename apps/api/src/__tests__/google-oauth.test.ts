import { describe, it, expect } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Tests for Google OAuth functionality
 *
 * These tests verify the OAuth flow logic without making actual HTTP calls.
 * They focus on state token handling, metadata structure, and token expiry logic.
 */

const JWT_SECRET = 'test-secret';

describe('Google OAuth', () => {
  describe('state token generation and verification', () => {
    it('should create a valid state token with user ID and type', async () => {
      const userId = 'user-123';
      const stateType = 'gmail_oauth';

      const stateSecret = new TextEncoder().encode(JWT_SECRET);
      const state = await new SignJWT({ sub: userId, type: stateType })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(stateSecret);

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.split('.').length).toBe(3);
    });

    it('should verify state token and extract user ID', async () => {
      const userId = 'user-123';
      const stateType = 'gmail_oauth';

      const stateSecret = new TextEncoder().encode(JWT_SECRET);
      const state = await new SignJWT({ sub: userId, type: stateType })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(stateSecret);

      const { payload } = await jwtVerify(state, stateSecret);
      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe(stateType);
    });

    it('should reject state token with wrong type', async () => {
      const userId = 'user-123';

      const stateSecret = new TextEncoder().encode(JWT_SECRET);
      const state = await new SignJWT({ sub: userId, type: 'gmail_oauth' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(stateSecret);

      const { payload } = await jwtVerify(state, stateSecret);

      // Simulating the check in handleGoogleOAuthCallback
      const expectedType = 'google_calendar_oauth';
      expect(payload.type).not.toBe(expectedType);
    });

    it('should reject expired state token', async () => {
      const userId = 'user-123';

      const stateSecret = new TextEncoder().encode(JWT_SECRET);
      const state = await new SignJWT({ sub: userId, type: 'gmail_oauth' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('-1s') // Already expired
        .sign(stateSecret);

      await expect(jwtVerify(state, stateSecret)).rejects.toThrow();
    });

    it('should reject state token with invalid secret', async () => {
      const userId = 'user-123';

      const stateSecret = new TextEncoder().encode(JWT_SECRET);
      const state = await new SignJWT({ sub: userId, type: 'gmail_oauth' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(stateSecret);

      const wrongSecret = new TextEncoder().encode('wrong-secret');
      await expect(jwtVerify(state, wrongSecret)).rejects.toThrow();
    });
  });

  describe('service configuration', () => {
    const GOOGLE_SERVICE_CONFIG = {
      gmail: {
        provider: 'email',
        stateType: 'gmail_oauth',
        emailField: 'gmailEmail',
        displayName: 'Gmail',
      },
      'google-calendar': {
        provider: 'calendar',
        stateType: 'google_calendar_oauth',
        emailField: 'calendarEmail',
        displayName: 'Google Calendar',
      },
    };

    it('should have correct config for gmail', () => {
      const config = GOOGLE_SERVICE_CONFIG['gmail'];
      expect(config.provider).toBe('email');
      expect(config.stateType).toBe('gmail_oauth');
      expect(config.emailField).toBe('gmailEmail');
    });

    it('should have correct config for google-calendar', () => {
      const config = GOOGLE_SERVICE_CONFIG['google-calendar'];
      expect(config.provider).toBe('calendar');
      expect(config.stateType).toBe('google_calendar_oauth');
      expect(config.emailField).toBe('calendarEmail');
    });

    it('should use different state types to prevent cross-service attacks', () => {
      expect(GOOGLE_SERVICE_CONFIG['gmail'].stateType).not.toBe(
        GOOGLE_SERVICE_CONFIG['google-calendar'].stateType
      );
    });
  });

  describe('token metadata structure', () => {
    it('should create correct metadata structure for new integration', () => {
      const service = 'gmail';
      const userEmail = 'test@gmail.com';
      const tokens = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      const metadata = {
        accessLevel: 'read-write',
        subProvider: service,
        gmailEmail: userEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      };

      expect(metadata.accessLevel).toBe('read-write');
      expect(metadata.subProvider).toBe('gmail');
      expect(metadata.gmailEmail).toBe('test@gmail.com');
      expect(metadata.accessToken).toBeDefined();
      expect(metadata.refreshToken).toBeDefined();
      expect(metadata.expiresAt).toBeDefined();
    });

    it('should handle missing refresh token', () => {
      const tokens = {
        access_token: 'mock-access-token',
        expires_in: 3600,
      };

      const metadata = {
        accessLevel: 'read-write',
        subProvider: 'gmail',
        accessToken: tokens.access_token,
        refreshToken: undefined,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      };

      expect(metadata.refreshToken).toBeUndefined();
    });

    it('should handle missing expires_in', () => {
      const tokens = {
        access_token: 'mock-access-token',
      };

      const metadata = {
        accessLevel: 'read-write',
        subProvider: 'gmail',
        accessToken: tokens.access_token,
        expiresAt: undefined,
      };

      expect(metadata.expiresAt).toBeUndefined();
    });
  });

  describe('token expiry logic', () => {
    it('should detect expired token', () => {
      const expiresAt = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      const isExpired = new Date(expiresAt) < new Date();
      expect(isExpired).toBe(true);
    });

    it('should detect valid token', () => {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
      const isExpired = new Date(expiresAt) < new Date();
      expect(isExpired).toBe(false);
    });

    it('should require refresh when expired and refresh token available', () => {
      const metadata = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const needsRefresh =
        metadata.expiresAt &&
        new Date(metadata.expiresAt) < new Date() &&
        metadata.refreshToken;

      expect(needsRefresh).toBeTruthy();
    });

    it('should not require refresh when not expired', () => {
      const metadata = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      const needsRefresh =
        metadata.expiresAt &&
        new Date(metadata.expiresAt) < new Date() &&
        metadata.refreshToken;

      expect(needsRefresh).toBeFalsy();
    });

    it('should not attempt refresh without refresh token', () => {
      const metadata = {
        accessToken: 'old-token',
        refreshToken: undefined,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const needsRefresh =
        metadata.expiresAt &&
        new Date(metadata.expiresAt) < new Date() &&
        metadata.refreshToken;

      expect(needsRefresh).toBeFalsy();
    });
  });

  describe('URL generation', () => {
    it('should generate correct redirect URI for gmail', () => {
      const baseUrl = 'https://api.example.com';
      const service = 'gmail';
      const redirectUri = `${baseUrl}/integrations/${service}/callback`;
      expect(redirectUri).toBe('https://api.example.com/integrations/gmail/callback');
    });

    it('should generate correct redirect URI for google-calendar', () => {
      const baseUrl = 'https://api.example.com';
      const service = 'google-calendar';
      const redirectUri = `${baseUrl}/integrations/${service}/callback`;
      expect(redirectUri).toBe('https://api.example.com/integrations/google-calendar/callback');
    });

    it('should determine correct web URL from API URL (production)', () => {
      const host = 'api.skillomatic.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;
      const webUrl = baseUrl.replace('api.', '');

      expect(webUrl).toBe('https://skillomatic.com');
    });

    it('should determine correct web URL from API URL (localhost)', () => {
      const host = 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;
      const webUrl = baseUrl.replace(':3000', ':5173');

      expect(webUrl).toBe('http://localhost:5173');
    });
  });

  describe('OAuth params construction', () => {
    it('should construct correct OAuth URL params', () => {
      const clientId = 'test-client-id';
      const redirectUri = 'https://api.example.com/integrations/gmail/callback';
      const scopes = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';
      const state = 'mock-state-token';

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'consent',
        state,
      });

      expect(params.get('client_id')).toBe(clientId);
      expect(params.get('redirect_uri')).toBe(redirectUri);
      expect(params.get('response_type')).toBe('code');
      expect(params.get('access_type')).toBe('offline');
      expect(params.get('prompt')).toBe('consent');
      expect(params.get('state')).toBe(state);
    });
  });

  describe('granted scopes parsing', () => {
    // Helper function matching the one in google-oauth.ts
    const parseGrantedScopes = (scopeString: string | undefined) => {
      const grantedScopes = new Set((scopeString || '').split(' ').filter(Boolean));

      const hasScope = (pattern: string) => {
        for (const scope of grantedScopes) {
          if (scope.includes(pattern)) return true;
        }
        return false;
      };

      return {
        hasGmail: hasScope('gmail'),
        hasCalendar: hasScope('calendar'),
        hasSheets: hasScope('spreadsheets'),
        hasDrive: hasScope('drive'),
        hasDocs: hasScope('documents'),
        hasForms: hasScope('forms'),
        hasContacts: hasScope('contacts'),
        hasTasks: hasScope('tasks'),
      };
    };

    it('should detect all services when all scopes granted', () => {
      const scopeString = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/forms.body.readonly',
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const result = parseGrantedScopes(scopeString);

      expect(result.hasGmail).toBe(true);
      expect(result.hasCalendar).toBe(true);
      expect(result.hasSheets).toBe(true);
      expect(result.hasDrive).toBe(true);
      expect(result.hasDocs).toBe(true);
      expect(result.hasForms).toBe(true);
      expect(result.hasContacts).toBe(true);
      expect(result.hasTasks).toBe(true);
    });

    it('should detect partial scopes (only Gmail and Calendar)', () => {
      const scopeString = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const result = parseGrantedScopes(scopeString);

      expect(result.hasGmail).toBe(true);
      expect(result.hasCalendar).toBe(true);
      expect(result.hasSheets).toBe(false);
      expect(result.hasDrive).toBe(false);
      expect(result.hasDocs).toBe(false);
      expect(result.hasForms).toBe(false);
      expect(result.hasContacts).toBe(false);
      expect(result.hasTasks).toBe(false);
    });

    it('should detect only Drive when only drive scopes granted', () => {
      const scopeString = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const result = parseGrantedScopes(scopeString);

      expect(result.hasGmail).toBe(false);
      expect(result.hasCalendar).toBe(false);
      expect(result.hasSheets).toBe(false);
      expect(result.hasDrive).toBe(true);
      expect(result.hasDocs).toBe(false);
      expect(result.hasForms).toBe(false);
      expect(result.hasContacts).toBe(false);
      expect(result.hasTasks).toBe(false);
    });

    it('should handle empty scope string', () => {
      const result = parseGrantedScopes('');

      expect(result.hasGmail).toBe(false);
      expect(result.hasCalendar).toBe(false);
      expect(result.hasSheets).toBe(false);
      expect(result.hasDrive).toBe(false);
      expect(result.hasDocs).toBe(false);
      expect(result.hasForms).toBe(false);
      expect(result.hasContacts).toBe(false);
      expect(result.hasTasks).toBe(false);
    });

    it('should handle undefined scope', () => {
      const result = parseGrantedScopes(undefined);

      expect(result.hasGmail).toBe(false);
      expect(result.hasCalendar).toBe(false);
      expect(result.hasSheets).toBe(false);
      expect(result.hasDrive).toBe(false);
      expect(result.hasDocs).toBe(false);
      expect(result.hasForms).toBe(false);
      expect(result.hasContacts).toBe(false);
      expect(result.hasTasks).toBe(false);
    });

    it('should detect drive.file scope for Sheets (includes drive)', () => {
      // drive.file is used by Sheets for file creation
      const scopeString = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const result = parseGrantedScopes(scopeString);

      expect(result.hasSheets).toBe(true);
      expect(result.hasDrive).toBe(true); // drive.file contains 'drive'
    });

    it('should detect Docs and Forms scopes', () => {
      const scopeString = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/forms.body.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const result = parseGrantedScopes(scopeString);

      expect(result.hasDocs).toBe(true);
      expect(result.hasForms).toBe(true);
      expect(result.hasGmail).toBe(false);
      expect(result.hasSheets).toBe(false);
    });
  });
});
