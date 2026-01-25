import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserPublic } from '@skillomatic/shared';
import { isOnboardingComplete } from '@skillomatic/shared';
import { auth } from '../lib/api';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isAdmin: boolean; // Org admin or super admin
  isOrgAdmin: boolean; // Org admin only
  isSuperAdmin: boolean; // Super admin only
  isIndividual: boolean; // Individual account (no org, account type selected)
  accountTypeSelected: boolean; // Whether user has completed account type selection
  organizationId: string | undefined;
  organizationName: string | undefined;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<UserPublic>;
  loginWithToken: (token: string) => Promise<UserPublic>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      auth
        .me()
        .then(setUser)
        .catch((err) => {
          localStorage.removeItem('token');
          // Set error message for display - session expired or invalid token
          const message = err instanceof Error ? err.message : 'Session expired';
          setAuthError(message === 'Invalid or expired token' ? 'Your session has expired. Please log in again.' : message);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserPublic> => {
    const response = await auth.login({ email, password });
    localStorage.setItem('token', response.token);
    setUser(response.user);
    return response.user;
  };

  const loginWithToken = async (token: string): Promise<UserPublic> => {
    // Store the token first
    localStorage.setItem('token', token);
    // Then fetch user data
    const user = await auth.me();
    setUser(user);
    return user;
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await auth.me();
      setUser(updatedUser);
    } catch {
      // Silently fail - user might have logged out
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOnboarded: user ? isOnboardingComplete(user.onboardingStep) : false,
        isAdmin: !!user?.isAdmin || !!user?.isSuperAdmin,
        isOrgAdmin: !!user?.isAdmin && !user?.isSuperAdmin,
        isSuperAdmin: !!user?.isSuperAdmin,
        isIndividual: user ? (!user.organizationId && user.accountTypeSelected) : false,
        accountTypeSelected: user?.accountTypeSelected ?? false,
        organizationId: user?.organizationId,
        organizationName: user?.organizationName,
        authError,
        clearAuthError,
        login,
        loginWithToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
