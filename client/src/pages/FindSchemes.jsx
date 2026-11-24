import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { eligibilityText, schemeQuestions, schemeScope, schemeTitle } from '../eligibilityContent';
import { localizedScheme } from '../schemeText';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

const statuses = ['matched', 'review', 'unmatched'];
const options = ['yes', 'no', 'unknown'];
const profileLabels = {
  age: 'profileAge', income: 'profileIncome', area: 'profileArea',
  savings: 'profileSavings', autoDebit: 'profileDebit',
};

export default function FindSchemes() {
  const { token, signOut } = useAuth();
  const { lang, t } = useLang();
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const local = (key, values) => eligibilityText(lang, key, values);

  async function handleSubmit(event) {
    event.preventDefault();
    if (Object.keys(answers).length === 0 && Object.keys(profile).length === 0) {
      setError('answerOne');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const body = Object.keys(profile).length ? { answers, profile } : { answers };
      const data = await api('/api/eligibility/matches', { method: 'POST', token, body });
      setResults({ schemes: data.results, answers: data.effectiveAnswers ?? answers });
    } catch (failure) {
      if (failure.status === 401) signOut();
      setError('matchFailed');
    } finally {
      setSubmitting(false);
    }
  }

  function updateAnswer(key, value) {
    const next = { ...answers };
    if (value) next[key] = value;
    else delete next[key];
    setAnswers(next);
    setResults(null);
    setError('');
  }

  function updateProfile(event) {
    const { name, value, type } = event.target;
    const next = { ...profile };
    if (value === '') delete next[name];
    else next[name] = type === 'number' ? Number(value) : value;
    setProfile(next);
    setResults(null);
    setError('');
  }

  const answeredByProfile = {
    citizen: Boolean(profile.citizen),
    savings: profile.savings === 'yes',
    pensionAge: profile.age !== undefined && profile.age !== 40,
    pensionCategory: profile.age >= 60,
    adultWoman: profile.age < 18,
    urban: profile.area === 'rural',
    housingIncome: profile.income !== undefined,
  };

  return (
    <main className="page">
      <h1>{t('findSchemes')}</h1>
      <p>{t('matchIntro')}</p>
      <form onSubmit={handleSubmit}>
        <fieldset className="form eligibility-form" disabled={submitting}>
          <section className="card profile-fields" aria-labelledby="profile-heading">
            <h2 id="profile-heading">{t('profileDetails')}</h2>
            <label>
              {t('profileAge')}
              <input type="number" name="age" min="0" max="120" step="1" inputMode="numeric"
                value={profile.age ?? ''} onChange={updateProfile} />
            </label>
            <label>
              {t('profileIncome')}
              <input type="number" name="income" min="0" max="100000000" step="1" inputMode="numeric"
                value={profile.income ?? ''} onChange={updateProfile} />
            </label>
            <label>
              {t('profileArea')}
              <select name="area" value={profile.area ?? ''} onChange={updateProfile}>
                <option value="">{t('skipQuestion')}</option>
                <option value="urban">{t('urban')}</option>
                <option value="rural">{t('rural')}</option>
              </select>
            </label>
            {['citizen', 'savings', 'autoDebit'].map((key) => (
              <label key={key}>
                {key === 'citizen' ? local(key, schemeQuestions['atal-pension-yojana'].questions.citizen) : t(profileLabels[key])}
                <select name={key} value={profile[key] ?? ''} onChange={updateProfile}>
                  <option value="">{t('skipQuestion')}</option>
                  {options.map((answer) => <option key={answer} value={answer}>{local(answer)}</option>)}
                </select>
              </label>
            ))}
          </section>
          {Object.entries(schemeQuestions).map(([slug, { questions }]) => {
            const scope = schemeScope(lang, slug);
            const remaining = Object.entries(questions).filter(([key]) => !answeredByProfile[key]);
            if (!remaining.length) return null;
            return (
              <details className="card match-section" key={slug}>
                <summary>{schemeTitle(lang, slug)}</summary>
                {scope && <p className="status">{scope}</p>}
                {remaining.map(([key, question]) => (
                  <label key={key}>
                    {local(key, question)}
                    <select value={answers[key] ?? ''} onChange={(event) => updateAnswer(key, event.target.value)}>
                      <option value="">{t('skipQuestion')}</option>
                      {options.map((answer) => <option key={answer} value={answer}>{local(answer)}</option>)}
                    </select>
                  </label>
                ))}
              </details>
            );
          })}
          {error && <p className="alert" role="alert">{t(error)}</p>}
          <button type="submit">{submitting ? t('loading') : t('showMatches')}</button>
        </fieldset>
      </form>
      <div aria-live="polite">
        {results && (
          <section aria-label={t('showMatches')} className="eligibility-result">
            {statuses.map((status) => {
              const schemes = results.schemes.filter((scheme) => scheme.status === status);
              if (!schemes.length) return null;
              return (
                <section className="match-results-group" data-result={status} key={status}>
                  <h2>{local(status)}</h2>
                  {schemes.map(({ slug, title, checks, sourceUrl }) => (
                    <details key={slug} className="card match-section">
                      <summary>{title ? localizedScheme({ slug, title }, 'title', lang) : schemeTitle(lang, slug)}</summary>
                      <ul>{checks.map(({ key, status: check, range }) => {
                        const answer = title ? profile[key] : results.answers[key];
                        return (
                          <li key={key}>
                            {title ? t(profileLabels[key]) : local(key, schemeQuestions[slug].questions[key])}{' '}
                            {range && <bdi>({range.join('–')})</bdi>}{' '}
                            <strong>{check === 'unanswered' ? t('skipQuestion') : typeof answer === 'number'
                              ? new Intl.NumberFormat(lang).format(answer) : local(answer)}</strong>{' '}
                            {check !== 'unanswered' && local(check === 'matched' ? 'matchedCheck' : check)}
                          </li>
                        );
                      })}</ul>
                      <p><a href={sourceUrl} target="_blank" rel="noreferrer">{local('official')}</a></p>
                      {!title && <Link to={`/eligibility?scheme=${encodeURIComponent(slug)}`}>{t('eligibility')}</Link>}
                    </details>
                  ))}
                </section>
              );
            })}
            <p>{t('disclaimer')}</p>
          </section>
        )}
      </div>
    </main>
  );
}
