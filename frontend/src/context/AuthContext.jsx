import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, getErrorMessage } from '../lib/api';

const AuthContext = createContext(null);

const readStored = () => {
  try {
    const rawUser = localStorage.getItem('sympohub_user');
    const token = localStorage.getItem('sympohub_token');
    return {
      user: rawUser ? JSON.parse(rawUser) : null,
      token: token || null,
    };
  } catch {
    return { user: null, token: null };
  }
};

// Normalize different backend response shapes: { user, token } | { data: { user, token } } | user directly
const extractAuth = (data) => {
  if (!data) return { user: null, token: null };
  const payload = data.data || data;
  const user = payload.user || payload.student || payload.profile || (payload._id || payload.email ? payload : null);
  const token = payload.token || payload.accessToken || payload.jwt || data.token || null;
  return { user, token };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStored().user);
  const [token, setToken] = useState(() => readStored().token);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const persist = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser) localStorage.setItem('sympohub_user', JSON.stringify(nextUser));
    else localStorage.removeItem('sympohub_user');
    if (nextToken) localStorage.setItem('sympohub_token', nextToken);
    else localStorage.removeItem('sympohub_token');
  };

  // Rehydrate + validate token on mount
  useEffect(() => {
    const boot = async () => {
      const stored = readStored();
      if (!stored.token) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.getMe();
        const payload = me?.data || me;
        const freshUser = payload?.user || payload || stored.user;
        persist(freshUser, stored.token);
      } catch {
        // Keep stored user if /auth/me is unavailable, but drop obviously bad tokens
        if (stored.user && stored.token) {
          setUser(stored.user);
          setToken(stored.token);
        } else {
          persist(null, null);
        }
      } finally {
        setLoading(false);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const data = await authApi.login({ email, password });
      const { user: u, token: t } = extractAuth(data);
      if (!u) throw new Error('Login succeeded but no user was returned.');
      persist(u, t || readStored().token);
      return u;
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid email or password.');
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError('');
    try {
      const data = await authApi.register(payload);
      const { user: u, token: t } = extractAuth(data);
      if (u) persist(u, t || readStored().token);
      return u || data;
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed. Please try again.');
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  const update = useCallback(
    async (payload) => {
      try {
        const data = await authApi.updateProfile(payload);
        const fresh = data?.data?.user || data?.user || data?.data || data;
        const merged = { ...(user || {}), ...(fresh || {}), ...payload };
        persist(merged, token);
        return merged;
      } catch (err) {
        // Optimistic local update fallback
        const merged = { ...(user || {}), ...payload };
        persist(merged, token);
        return merged;
      }
    },
    [user, token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      update,
    }),
    [user, token, loading, authError, login, register, logout, update]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
