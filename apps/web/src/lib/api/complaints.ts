/**
 * Complaints API module - creates GitHub issues for bug reports
 */

import type { ComplaintCreateRequest } from '@skillomatic/shared';
import { request } from './request';

interface ComplaintResponse {
  success: boolean;
  issueNumber: number;
  issueUrl: string;
}

interface ComplaintCountResponse {
  count: number;
  url: string;
}

export const complaints = {
  create: (data: ComplaintCreateRequest) =>
    request<ComplaintResponse>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCount: () =>
    request<ComplaintCountResponse>('/complaints/count'),
};
