/**
 * Integrations API module
 */

import type { IntegrationPublic } from '@skillomatic/shared';
import { request } from './request';

export type IntegrationAccessLevel = 'read-write' | 'read-only';

export const integrations = {
  list: () => request<IntegrationPublic[]>('/integrations'),

  // Get a Connect session token for the Nango Connect UI
  // Optionally pass accessLevel to set user's preferred access level during connection
  getSession: (
    allowedIntegrations?: string[],
    accessLevel?: IntegrationAccessLevel,
    provider?: string
  ) =>
    request<{ token: string; expiresAt: string; connectLink: string }>('/integrations/session', {
      method: 'POST',
      body: JSON.stringify({ allowedIntegrations, accessLevel, provider }),
    }),

  // @deprecated - use getSession + Nango Connect UI instead
  connect: (provider: string, subProvider?: string, accessLevel?: IntegrationAccessLevel) =>
    request<{ url: string; connectionId: string; message: string }>('/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, subProvider, accessLevel }),
    }),

  disconnect: (integrationId: string) =>
    request<{ message: string }>('/integrations/disconnect', {
      method: 'POST',
      body: JSON.stringify({ integrationId }),
    }),

  // Update the access level for an existing integration
  updateAccessLevel: (integrationId: string, accessLevel: IntegrationAccessLevel) =>
    request<{ id: string; provider: string; accessLevel: string; message: string }>(
      `/integrations/${integrationId}/access-level`,
      {
        method: 'PATCH',
        body: JSON.stringify({ accessLevel }),
      }
    ),

  getToken: (integrationId: string) =>
    request<{ accessToken: string; tokenType: string; expiresAt?: string }>(
      `/integrations/${integrationId}/token`
    ),

  checkStatus: (provider: string) =>
    request<{
      connected: boolean;
      status: string;
      lastSyncAt?: Date;
      accessLevel?: string;
      message?: string;
    }>(`/integrations/status/${provider}`),
};
