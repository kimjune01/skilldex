import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { UserPublic } from '@skillomatic/shared';
import { auth } from '../lib/api';

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean; // Org admin or super admin
  isOrgAdmin: boolean; // Org admin only
  isSuperAdmin: boolean; // Super admin only
  organizationId: string | undefined;
  organizationName: string | undefined;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      auth
        .me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await auth.login({ email, password });
    localStorage.setItem('token', response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin || !!user?.isSuperAdmin,
        isOrgAdmin: !!user?.isAdmin && !user?.isSuperAdmin,
        isSuperAdmin: !!user?.isSuperAdmin,
        organizationId: user?.organizationId,
        organizationName: user?.organizationName,
        login,
        logout,
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
