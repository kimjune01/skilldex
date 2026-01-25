/**
 * Onboarding API module
 */

import type { OnboardingStatus } from '@skillomatic/shared';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
import { request } from './request';

export const onboarding = {
  getStatus: () => request<OnboardingStatus>('/onboarding/status'),

  advance: (step: number) =>
    request<OnboardingStatus>('/onboarding/advance', {
      method: 'POST',
      body: JSON.stringify({ step }),
    }),

  completeStep: (stepName: keyof typeof ONBOARDING_STEPS) =>
    request<OnboardingStatus>('/onboarding/complete-step', {
      method: 'POST',
      body: JSON.stringify({ stepName }),
    }),

  reset: () =>
    request<OnboardingStatus>('/onboarding/reset', {
      method: 'POST',
    }),
};
