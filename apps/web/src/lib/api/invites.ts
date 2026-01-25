/**
 * Organization Invites API module
 */

import type { OrganizationInvitePublic, UserPublic } from '@skillomatic/shared';
import { request } from './request';

export const invites = {
  list: () => request<OrganizationInvitePublic[]>('/invites'),

  create: (body: { email: string; role?: 'admin' | 'member'; organizationId?: string }) =>
    request<OrganizationInvitePublic & { token: string }>('/invites', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  validate: (token: string) =>
    request<{ valid: boolean; email: string; organizationName: string; role: string }>(
      `/invites/validate/${token}`
    ),

  accept: (token: string, password: string, name: string) =>
    request<{ token: string; user: UserPublic }>('/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ token, password, name }),
    }),

  cancel: (id: string) =>
    request<{ message: string }>(`/invites/${id}`, {
      method: 'DELETE',
    }),
};
