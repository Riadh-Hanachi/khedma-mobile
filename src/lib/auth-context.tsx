import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, setToken, getToken } from './api';
import { User, UserRole } from './types';

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  city?: string;
  governorate?: string;
  companyName?: string;
  categoryId?: string;
  description?: string;
  referralCode?: string;
  countryCode?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>('/users/me');
      setUser(me);
    } catch {
      await setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      await setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Connexion impossible';
      setError(message);
      throw e;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/register', payload);
      await setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Inscription impossible';
      setError(message);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
