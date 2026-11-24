import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

export default function Register() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      signIn(data);
      navigate('/my-schemes');
    } catch (err) {
      const messages = { 409: 'emailInUse', 429: 'rateLimited' };
      setError(messages[err.status] ?? 'registerFailed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <form className="card form" onSubmit={handleSubmit}>
        <h1>{t('register')}</h1>
        {error ? <p className="alert" role="alert">{t(error)}</p> : null}
        <label>
          {t('name')}
          <input
            type="text"
            dir="auto"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          {t('email')}
          <input
            type="email"
            dir="ltr"
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {t('register')}
        </button>
        <p className="muted">
          <Link to="/login">{t('login')}</Link>
        </p>
      </form>
    </main>
  );
}
