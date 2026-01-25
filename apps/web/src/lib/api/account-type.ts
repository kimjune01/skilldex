/**
 * Account Type Selection API module (onboarding step)
 */

import type { AccountTypeInfo, OrganizationPublic, UserPublic } from '@skillomatic/shared';
import { request } from './request';

export const accountType = {
  /** Get account type suggestions based on user's email domain */
  getInfo: () => request<AccountTypeInfo>('/account-type/info'),

  /** Select individual (free) account type */
  selectIndividual: () =>
    request<{ success: boolean; user: UserPublic; token: string }>(
      '/account-type/select-individual',
      {
        method: 'POST',
      }
    ),

  /** Create a new organization (user becomes admin) */
  createOrg: (name: string) =>
    request<{
      success: boolean;
      organization: OrganizationPublic;
      user: UserPublic;
      token: string;
    }>('/account-type/create-org', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  /** Join an existing organization as a member */
  joinOrg: (orgId: string) =>
    request<{
      success: boolean;
      organization: OrganizationPublic;
      user: UserPublic;
      token: string;
    }>('/account-type/join-org', {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    }),
};
