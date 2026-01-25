/**
 * Scrape Tasks API module
 *
 * Note: These use the v1 API which requires API key authentication.
 * For web UI, we use a wrapper that includes the user's API key.
 */

import type { ScrapeTaskPublic, CreateScrapeTaskResponse } from '@skillomatic/shared';
import { request } from './request';

export const scrape = {
  createTask: (url: string) =>
    request<CreateScrapeTaskResponse>('/v1/scrape/tasks', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  getTask: (id: string) => request<ScrapeTaskPublic>(`/v1/scrape/tasks/${id}`),

  listTasks: () => request<{ tasks: ScrapeTaskPublic[]; total: number }>('/v1/scrape/tasks'),
};
