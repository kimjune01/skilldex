/**
 * Auth API module
 */

import type { LoginRequest, LoginResponse, UserPublic } from '@skillomatic/shared';
import { request } from './request';

export const auth = {
  login: (body: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<UserPublic>('/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
};
