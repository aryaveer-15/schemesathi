import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './useAuth';
import { api } from './api';

const STORAGE_KEY = 'schemesathi.auth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(loadStoredAuth);

  useEffect(() => {
    if (!token) return;
    let active = true;
    let pending = false;
    async function validateSession() {
      if (pending) return;
      pending = true;
      try {
        await api('/api/auth/me', { token });
      } catch (error) {
        if (!active || ![401, 404].includes(error.status)) return;
        clearStoredAuth(token);
        setAuth((current) => current.token === token ? { token: null, user: null } : current);
      } finally {
        pending = false;
      }
    }
    validateSession();
    window.addEventListener('focus', validateSession);
    return () => {
      active = false;
      window.removeEventListener('focus', validateSession);
    };
  }, [token]);

  const value = useMemo(() => {
    function signIn({ token: nextToken, user: nextUser }) {
      const next = { token: nextToken, user: nextUser };
      setAuth(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota / private-mode failures.
      }
    }

    function signOut() {
      setAuth({ token: null, user: null });
      clearStoredAuth();
    }

    return { token, user, signIn, signOut };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function clearStoredAuth(token) {
  try {
    if (!token || loadStoredAuth().token === token) localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is optional.
  }
}
