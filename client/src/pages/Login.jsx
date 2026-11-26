import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';
import FormFeedback from '../FormFeedback';
import { checkFields, fieldFeedback } from '../formValidation';

export default function Login() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const invalid = checkFields(event.currentTarget, 'invalidLogin');
    setFeedback(invalid);
    if (invalid) return;
    setSubmitting(true);
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      signIn(data);
      navigate({ pathname: '/my-schemes', search });
    } catch (err) {
      const messages = { 401: 'invalidLogin', 429: 'rateLimited' };
      setFeedback({ key: messages[err.status] ?? 'loginFailed',
        fields: err.status === 401 ? { email: null, password: null } : {} });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <form className="card form" noValidate onSubmit={handleSubmit}
        onChange={() => { if (feedback?.fields && Object.keys(feedback.fields).length) setFeedback(null); }}>
        <h1>{t('login')}</h1>
        <FormFeedback feedback={feedback} />
        <label>
          {t('email')}
          <input
            type="email"
            dir="ltr"
            name="email"
            id="email"
            {...fieldFeedback(feedback, 'email')}
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
            id="password"
            {...fieldFeedback(feedback, 'password')}
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
          <Link to={{ pathname: '/register', search }}>{t('register')}</Link>
        </p>
      </form>
    </main>
  );
}
