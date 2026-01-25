/**
 * Organizations API module (super admin)
 */

import type { OrganizationPublic } from '@skillomatic/shared';
import { request } from './request';
import type { DeploymentSettings } from './settings';

export const organizations = {
  list: () => request<OrganizationPublic[]>('/organizations'),

  get: (id: string) => request<OrganizationPublic>(`/organizations/${id}`),

  getCurrent: () => request<OrganizationPublic>('/organizations/current'),

  create: (body: { name: string; slug?: string; logoUrl?: string }) =>
    request<OrganizationPublic>('/organizations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: { name?: string; slug?: string; logoUrl?: string }) =>
    request<OrganizationPublic>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/organizations/${id}`, {
      method: 'DELETE',
    }),

  getDeployment: () => request<DeploymentSettings>('/organizations/current/deployment'),

  updateDeployment: (body: { webUiEnabled?: boolean; desktopEnabled?: boolean }) =>
    request<DeploymentSettings>('/organizations/current/deployment', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
