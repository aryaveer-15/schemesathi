import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { eligibilityText, schemeQuestions, schemeScope, schemeTitle } from '../eligibilityContent';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

const statuses = ['matched', 'review', 'unmatched'];
const options = ['yes', 'no', 'unknown'];

export default function FindSchemes() {
  const { token, signOut } = useAuth();
  const { lang, t } = useLang();
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const local = (key, values) => eligibilityText(lang, key, values);

  async function handleSubmit(event) {
    event.preventDefault();
    if (Object.keys(answers).length === 0) {
      setError('answerOne');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await api('/api/eligibility/matches', { method: 'POST', token, body: { answers } });
      setResults(data.results);
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

  return (
    <main className="page">
      <h1>{t('findSchemes')}</h1>
      <p>{t('matchIntro')}</p>
      <form onSubmit={handleSubmit}>
        <fieldset className="form eligibility-form" disabled={submitting}>
          {Object.entries(schemeQuestions).map(([slug, { questions }]) => {
            const scope = schemeScope(lang, slug);
            return (
              <details className="card match-section" key={slug}>
                <summary>{schemeTitle(lang, slug)}</summary>
                {scope && <p className="status">{scope}</p>}
                {Object.entries(questions).map(([key, question]) => (
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
              const schemes = results.filter((scheme) => scheme.status === status);
              if (!schemes.length) return null;
              return (
                <section className="match-results-group" data-result={status} key={status}>
                  <h2>{local(status)}</h2>
                  {schemes.map(({ slug, checks, sourceUrl }) => (
                    <details key={slug} className="card match-section">
                      <summary>{schemeTitle(lang, slug)}</summary>
                      <ul>{checks.map(({ key, status: check }) => (
                        <li key={key}>
                          {local(key, schemeQuestions[slug].questions[key])}{' '}
                          <strong>{check === 'unanswered' ? t('skipQuestion') : local(answers[key])}</strong>{' '}
                          {check !== 'unanswered' && local(check === 'matched' ? 'matchedCheck' : check)}
                        </li>
                      ))}</ul>
                      <p><a href={sourceUrl} target="_blank" rel="noreferrer">{local('official')}</a></p>
                      <Link to={`/eligibility?scheme=${encodeURIComponent(slug)}`}>{t('eligibility')}</Link>
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
