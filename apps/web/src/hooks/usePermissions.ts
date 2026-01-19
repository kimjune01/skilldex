import { useAuth } from './useAuth';

/**
 * Simple RBAC hook for client-side permission checks
 * Note: Real enforcement happens server-side. This is for UX only.
 */
export function usePermissions() {
  const { user } = useAuth();

  // Admin has all permissions
  const isAdmin = user?.isAdmin ?? false;

  const can = (action: string, resource: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;

    // For Phase 2, this would check user.permissions from API
    // For MVP, all authenticated users can do basic actions
    const permission = `${resource}:${action}`;

    // Default permissions for non-admin users
    const defaultPermissions = [
      'skills:read',
      'skills:execute',
      'integrations:read',
      'integrations:manage',
      'candidates:read',
      'candidates:write',
    ];

    return defaultPermissions.includes(permission);
  };

  return {
    isAdmin,
    can,
    // Convenience methods
    canManageUsers: isAdmin,
    canManageSkills: isAdmin,
    canExecuteSkills: !!user,
    canViewCandidates: !!user,
    canEditCandidates: !!user,
  };
}
