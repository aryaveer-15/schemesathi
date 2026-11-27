import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthContext } from './useAuth';
import { api } from './api';

export function AuthProvider({ children, migrated }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [notice, setNotice] = useState(migrated ? 'Sign-in has changed. Please sign in again to continue.' : '');
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const data = await api('/api/auth/session');
      if (current !== generation.current) return;
      if (!data || !Object.hasOwn(data, 'user')) throw new Error('Session unavailable');
      setUser(data.user);
      setStatus('ready');
    } catch (error) {
      if (current !== generation.current) return;
      if ([401, 404].includes(error.status)) {
        setUser(null);
        setStatus('ready');
      } else {
        setStatus('unavailable');
      }
    }
  }, []);

  const invalidate = useCallback(() => { generation.current++; }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(refresh, 0);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(initialCheck);
      invalidate();
      window.removeEventListener('focus', refresh);
    };
  }, [refresh, invalidate]);

  function signIn({ user: nextUser }) {
    generation.current++;
    setUser(nextUser);
    setStatus('ready');
    setNotice('');
  }

  function expireSession() {
    signIn({ user: null });
  }

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      expireSession();
    } catch {
      setNotice('Sign-out could not be confirmed. Please try signing out again.');
    }
  }

  return <AuthContext.Provider value={{ user, status, notice, refresh, signIn, signOut, expireSession }}>
    {children}
  </AuthContext.Provider>;
}
