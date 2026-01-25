/**
 * Users API module (admin)
 */

import type { UserPublic } from '@skillomatic/shared';
import { request } from './request';

export const users = {
  list: () => request<UserPublic[]>('/users'),

  get: (id: string) => request<UserPublic>(`/users/${id}`),

  create: (body: { email: string; password: string; name: string; isAdmin?: boolean }) =>
    request<UserPublic>('/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};
