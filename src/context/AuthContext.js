import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePassword as changePasswordApi,
  login as loginApi,
  logout as logoutApi,
  logoutAll as logoutAllApi,
  me as meApi,
  register as registerApi,
} from '@/libs/api/auth';
import { onAuthFailure } from '@/libs/axios';
import { bootOnce, endSession, saveTokens } from '@/libs/refresh';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

// status: loading | authenticated | anonymous
export function AuthProvider({ children }) {
  const toast = useToast();
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  const signIn = useCallback((data) => {
    saveTokens(data.tokens);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  useEffect(() => onAuthFailure(() => {
    setUser(null);
    setStatus('anonymous');
  }), []);

  // StrictMode-safe: bootOnce() is memoised, and only the mounted effect run applies its result.
  useEffect(() => {
    let alive = true;
    bootOnce()
      .then(async (hasSession) => {
        if (!alive) return;
        if (!hasSession) {
          setStatus('anonymous');
          return;
        }
        const res = await meApi();
        if (!alive) return;
        setUser(res.data);
        setStatus('authenticated');
      })
      .catch(() => {
        if (alive) setStatus('anonymous');
      });
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await loginApi({ email, password });
      const signedIn = signIn(res.data);
      toast.success('Welcome back');
      return signedIn;
    },
    [signIn, toast],
  );

  const register = useCallback(
    async (body) => {
      const res = await registerApi(body);
      const signedIn = signIn(res.data);
      toast.success('Welcome to Collabor8r');
      return signedIn;
    },
    [signIn, toast],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // The server session may already be gone. The local sign-out still runs.
    }
    endSession('signed-out');
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllApi();
    } catch {
      // Sessions can expire on their own. The local sign-out still runs.
    }
    endSession('signed-out');
  }, []);

  // Forced re-login: the server revokes the other sessions, so this device signs out too.
  const changePassword = useCallback(
    async (body) => {
      await changePasswordApi(body);
      endSession('password-changed');
      toast.success('Password changed. Sign in again.');
    },
    [toast],
  );

  const refreshUser = useCallback(async () => {
    const res = await meApi();
    setUser(res.data);
    return res.data;
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, logoutAll, changePassword, refreshUser }),
    [status, user, login, register, logout, logoutAll, changePassword, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
