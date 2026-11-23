import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

export default function Login() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      signIn(data);
      navigate('/schemes');
    } catch (err) {
      const messages = { 401: 'invalidLogin', 429: 'rateLimited' };
      setError(messages[err.status] ?? 'loginFailed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <form className="card form" onSubmit={handleSubmit}>
        <h1>{t('login')}</h1>
        {error ? <p className="alert" role="alert">{t(error)}</p> : null}
        <label>
          {t('email')}
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {t('login')}
        </button>
        <p className="muted">
          <Link to="/register">{t('register')}</Link>
        </p>
      </form>
    </main>
  );
}
