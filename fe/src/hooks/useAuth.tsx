// src/hooks/useAuth.tsx

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login, signup, me, logout, type AuthUser } from '@/services/authApi';
import { getAuthToken } from '@/services/apiClient';

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => !!user?.roles?.includes('admin'), [user]);

  const refreshMe = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const u = await me();
      setUser(u);
    } catch {
      // token invalid/expired
      logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await login(email, password);
      setUser(res.user);
      return { error: null };
    } catch (e: any) {
      return { error: e instanceof Error ? e : new Error('Failed to sign in') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await signup(email, password, fullName);
      return { error: null };
    } catch (e: any) {
      return { error: e instanceof Error ? e : new Error('Failed to sign up') };
    }
  };

  const signOut = async () => {
    logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
