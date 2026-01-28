/**
 * Automations API client
 *
 * CRUD operations for scheduled skill automations.
 */
import { request } from './request';
import type {
  AutomationPublic,
  AutomationRunPublic,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  ListAutomationsResponse,
} from '@skillomatic/shared';

export const automations = {
  /**
   * List user's automations
   */
  list: (): Promise<ListAutomationsResponse> => {
    return request<ListAutomationsResponse>('/v1/automations');
  },

  /**
   * Get a single automation by ID
   */
  get: async (id: string): Promise<AutomationPublic> => {
    const data = await request<{ automation: AutomationPublic }>(`/v1/automations/${id}`);
    return data.automation;
  },

  /**
   * Create a new automation
   */
  create: async (data: CreateAutomationRequest): Promise<AutomationPublic> => {
    const result = await request<{ automation: AutomationPublic }>('/v1/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.automation;
  },

  /**
   * Update an automation
   */
  update: async (id: string, data: UpdateAutomationRequest): Promise<AutomationPublic> => {
    const result = await request<{ automation: AutomationPublic }>(`/v1/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.automation;
  },

  /**
   * Delete an automation
   */
  remove: async (id: string): Promise<void> => {
    await request<{ success: boolean }>(`/v1/automations/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Manually trigger an automation
   */
  trigger: (id: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/v1/automations/${id}/run`, {
      method: 'POST',
    });
  },

  /**
   * Get run history for an automation
   */
  getRuns: async (id: string): Promise<AutomationRunPublic[]> => {
    const data = await request<{ runs: AutomationRunPublic[] }>(`/v1/automations/${id}/runs`);
    return data.runs;
  },

  /**
   * Parse natural language schedule to cron expression
   */
  parseSchedule: async (schedule: string, timezone?: string): Promise<{
    cronExpression: string;
    description: string;
    timezone: string;
    nextRunAt: string;
  }> => {
    const data = await request<{
      cronExpression: string;
      description: string;
      timezone: string;
      nextRunAt: string;
    }>('/v1/automations/parse-schedule', {
      method: 'POST',
      body: JSON.stringify({ schedule, timezone }),
    });
    return data;
  },
};
