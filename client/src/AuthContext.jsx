import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'schemesathi.auth';
const AuthContext = createContext(null);

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
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage failures.
      }
    }

    return { token, user, signIn, signOut };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
