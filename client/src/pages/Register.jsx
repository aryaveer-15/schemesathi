import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';
import FormFeedback from '../FormFeedback';
import { checkFields, fieldFeedback } from '../formValidation';

export default function Register() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const invalid = checkFields(event.currentTarget, 'registerFailed');
    setFeedback(invalid);
    if (invalid) return;
    setSubmitting(true);
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      signIn(data);
      navigate({ pathname: '/my-schemes', search });
    } catch (err) {
      const messages = { 409: 'emailInUse', 429: 'rateLimited' };
      setFeedback({ key: messages[err.status] ?? 'registerFailed', fields: err.status === 409 ? { email: null } : {} });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <form className="card form" noValidate onSubmit={handleSubmit}
        onChange={() => { if (feedback?.fields && Object.keys(feedback.fields).length) setFeedback(null); }}>
        <h1>{t('register')}</h1>
        <FormFeedback feedback={feedback} />
        <label>
          {t('name')}
          <input
            type="text"
            dir="auto"
            name="name"
            id="name"
            {...fieldFeedback(feedback, 'name')}
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
          <Link to={{ pathname: '/login', search }}>{t('login')}</Link>
        </p>
      </form>
    </main>
  );
}
