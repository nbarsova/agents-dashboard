import type { MembershipWithOrg, User } from '@template/shared';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { getMe } from '../api/auth';

interface AuthState {
  user: User | null;
  memberships: MembershipWithOrg[];
  loading: boolean;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  defaultOrgId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    memberships: [],
    loading: true,
    token: localStorage.getItem('token'),
  });

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState({ user: null, memberships: [], loading: false, token: null });
      return;
    }

    try {
      const data = await getMe();
      setState({ user: data.user, memberships: data.memberships, loading: false, token });
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, memberships: [], loading: false, token: null });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const setAuth = useCallback((token: string, user: User) => {
    localStorage.setItem('token', token);
    setState((prev) => ({ ...prev, token, user }));
    // Reload memberships
    getMe().then((data) => {
      setState({ user: data.user, memberships: data.memberships, loading: false, token });
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setState({ user: null, memberships: [], loading: false, token: null });
  }, []);

  const defaultOrgId = state.memberships.length > 0 ? state.memberships[0].orgId : null;

  return (
    <AuthContext.Provider value={{ ...state, setAuth, logout, defaultOrgId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
