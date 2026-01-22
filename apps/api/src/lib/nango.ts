/**
 * Nango OAuth Integration Library
 *
 * Provides OAuth flow management through Nango for ATS and other integrations.
 * Nango handles the OAuth complexity (token refresh, secure storage) while we
 * just need to initiate connections and fetch tokens.
 *
 * @see https://docs.nango.dev/
 */

// Nango connection metadata stored in our integrations table
export interface NangoConnection {
  connectionId: string;
  providerConfigKey: string;
  provider: string;
}

// Connect session response from Nango
export interface NangoConnectSession {
  token: string;
  expiresAt: string;
  connectLink: string;
}

// Token response from Nango
export interface NangoToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  token_type: string;
  raw: Record<string, unknown>;
}

// Connection status from Nango
export interface NangoConnectionStatus {
  id: number;
  connection_id: string;
  provider_config_key: string;
  provider: string;
  created_at: string;
  updated_at: string;
  credentials_iv?: string;
  credentials_tag?: string;
  metadata?: Record<string, unknown>;
}

// Error from Nango API
export class NangoError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'NangoError';
  }
}

/**
 * Nango client for OAuth operations
 */
export class NangoClient {
  private baseUrl: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = process.env.NANGO_HOST || 'http://localhost:3003';
    this.secretKey = process.env.NANGO_SECRET_KEY || '';

    if (!this.secretKey) {
      console.warn('NANGO_SECRET_KEY not set - OAuth operations will fail');
    }
  }

  /**
   * Create a Connect session for frontend OAuth flow
   * Returns a short-lived token (30 min) that the frontend uses with Nango Connect UI
   */
  async createConnectSession(options: {
    userId: string;
    userEmail?: string;
    userDisplayName?: string;
    allowedIntegrations?: string[];
  }): Promise<NangoConnectSession> {
    const response = await fetch(`${this.baseUrl}/connect/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        end_user: {
          id: options.userId,
          email: options.userEmail,
          display_name: options.userDisplayName,
        },
        allowed_integrations: options.allowedIntegrations,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to create connect session: ${response.status}`,
        response.status,
        error.code
      );
    }

    const data = await response.json();
    return {
      token: data.data.token,
      expiresAt: data.data.expires_at,
      connectLink: data.data.connect_link,
    };
  }

  /**
   * @deprecated Use createConnectSession instead - public keys are deprecated
   * Generate the OAuth connect URL for a provider
   */
  getConnectUrl(
    providerConfigKey: string,
    connectionId: string,
    callbackUrl: string
  ): string {
    const params = new URLSearchParams({
      connection_id: connectionId,
      public_key: process.env.NANGO_PUBLIC_KEY || '',
      callback_url: callbackUrl,
    });

    return `${this.baseUrl}/oauth/connect/${providerConfigKey}?${params.toString()}`;
  }

  /**
   * Get fresh access token for a connection
   * Nango handles token refresh automatically
   */
  async getToken(providerConfigKey: string, connectionId: string): Promise<NangoToken> {
    const response = await fetch(
      `${this.baseUrl}/connection/${connectionId}?provider_config_key=${providerConfigKey}`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to get token: ${response.status}`,
        response.status,
        error.code
      );
    }

    const connection = await response.json();

    // Return credentials in a normalized format
    return {
      access_token: connection.credentials?.access_token || '',
      refresh_token: connection.credentials?.refresh_token,
      expires_at: connection.credentials?.expires_at,
      token_type: connection.credentials?.token_type || 'bearer',
      raw: connection.credentials || {},
    };
  }

  /**
   * Get connection status from Nango
   */
  async getConnection(
    providerConfigKey: string,
    connectionId: string
  ): Promise<NangoConnectionStatus | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/connection/${connectionId}?provider_config_key=${providerConfigKey}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new NangoError(
          error.message || `Failed to get connection: ${response.status}`,
          response.status,
          error.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof NangoError) throw error;
      throw new NangoError(`Network error getting connection: ${error}`);
    }
  }

  /**
   * Delete a connection from Nango
   */
  async deleteConnection(providerConfigKey: string, connectionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/connection/${connectionId}?provider_config_key=${providerConfigKey}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to delete connection: ${response.status}`,
        response.status,
        error.code
      );
    }
  }

  /**
   * List all connections for a user
   */
  async listConnections(connectionIdPrefix?: string): Promise<NangoConnectionStatus[]> {
    const url = new URL(`${this.baseUrl}/connections`);
    if (connectionIdPrefix) {
      url.searchParams.set('connectionId', connectionIdPrefix);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new NangoError(
        error.message || `Failed to list connections: ${response.status}`,
        response.status,
        error.code
      );
    }

    const data = await response.json();
    return data.connections || [];
  }
}

// Singleton instance
let nangoClient: NangoClient | null = null;

/**
 * Get the Nango client instance
 */
export function getNangoClient(): NangoClient {
  if (!nangoClient) {
    nangoClient = new NangoClient();
  }
  return nangoClient;
}

/**
 * Map our integration provider names to Nango provider config keys
 * These must match the provider configurations in your Nango instance
 */
export const PROVIDER_CONFIG_KEYS: Record<string, string> = {
  // ATS providers
  greenhouse: 'greenhouse',
  lever: 'lever',
  ashby: 'ashby',
  workable: 'workable',
  'zoho-recruit': 'zoho-recruit',

  // Calendar providers
  'google-calendar': 'google-calendar',
  'outlook-calendar': 'outlook-calendar',
  calendly: 'calendly',

  // Email providers
  gmail: 'google-mail',
  outlook: 'outlook',

  // Generic mappings (for backwards compatibility)
  ats: 'zoho-recruit', // Default ATS - using Zoho Recruit
  calendar: 'google-calendar', // Default calendar
  email: 'gmail', // Default email
};

/**
 * Generate a unique connection ID for a user + provider combination
 * Format: {userId}:{provider}
 */
export function generateConnectionId(userId: string, provider: string): string {
  return `${userId}:${provider}`;
}

/**
 * Parse a connection ID back to userId and provider
 */
export function parseConnectionId(connectionId: string): { userId: string; provider: string } {
  const [userId, provider] = connectionId.split(':');
  return { userId, provider };
}
