/**
 * API Keys module
 */

import type { ApiKeyPublic, ApiKeyCreateResponse } from '@skillomatic/shared';
import { request } from './request';

export const apiKeys = {
  list: () => request<ApiKeyPublic[]>('/api-keys'),

  create: (name?: string) =>
    request<ApiKeyCreateResponse>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  revoke: (id: string) =>
    request<{ message: string }>(`/api-keys/${id}`, {
      method: 'DELETE',
    }),
};
