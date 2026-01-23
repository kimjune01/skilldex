import { useAuth } from '../../hooks/useAuth';
import { getOnboardingStepRoute, getOnboardingStepElementId } from '@skillomatic/shared';
import { cn } from '@/lib/utils';

interface OnboardingBadgeProps {
  /** For nav tabs: the route path to match (e.g., '/integrations') */
  route?: string;
  /** For in-page elements: the element ID to match (e.g., 'ats-connect') */
  elementId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Red pulsing notification badge for onboarding guidance.
 * Shows when the current onboarding step matches the specified route or elementId.
 *
 * Usage:
 * - On nav tabs: <OnboardingBadge route="/integrations" />
 * - On page elements: <OnboardingBadge elementId="ats-connect" />
 */
export function OnboardingBadge({ route, elementId, className }: OnboardingBadgeProps) {
  const { user, isOnboarded } = useAuth();

  if (isOnboarded || !user) return null;

  const currentStep = user.onboardingStep;
  const targetRoute = getOnboardingStepRoute(currentStep);
  const targetElementId = getOnboardingStepElementId(currentStep);

  // Check if this badge should be visible
  const shouldShow =
    (route && targetRoute === route) ||
    (elementId && targetElementId === elementId);

  if (!shouldShow) return null;

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-white',
        className
      )}
    />
  );
}

/**
 * Hook to check if an element should show an onboarding badge.
 * Useful when you need more control over badge rendering.
 */
export function useOnboardingHighlight(options: { route?: string; elementId?: string }): boolean {
  const { user, isOnboarded } = useAuth();

  if (isOnboarded || !user) return false;

  const currentStep = user.onboardingStep;
  const targetRoute = getOnboardingStepRoute(currentStep);
  const targetElementId = getOnboardingStepElementId(currentStep);

  return (
    (options.route !== undefined && targetRoute === options.route) ||
    (options.elementId !== undefined && targetElementId === options.elementId)
  );
}
