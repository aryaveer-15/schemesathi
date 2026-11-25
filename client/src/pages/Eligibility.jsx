import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ApplicationDirections from '../ApplicationDirections';
import { eligibilityText, schemeQuestions, schemeScope, schemeTitle } from '../eligibilityContent';
import { useLang } from '../useLang';

const schemeOptions = Object.entries(schemeQuestions);
const answerOptions = ['yes', 'no', 'unknown'];

export default function Eligibility() {
  const [params] = useSearchParams();
  const requested = params.get('scheme');
  const slug = Object.hasOwn(schemeQuestions, requested) ? requested : schemeOptions[0][0];
  return <EligibilityForm key={slug} initialSlug={slug} />;
}

function EligibilityForm({ initialSlug }) {
  const { lang, t } = useLang();
  const [slug, setSlug] = useState(initialSlug);
  const [source, setSource] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const { questions } = schemeQuestions[slug];
  const missing = Object.keys(questions).find((key) => !answers[key]);
  const missingId = missing && `answer-${missing}`;
  const local = (key, values) => eligibilityText(lang, key, values);
  const scope = schemeScope(lang, slug);

  useEffect(() => {
    let active = true;
    api(`/api/eligibility/${slug}`).then(({ sourceUrl }) => {
      if (active) setSource({ slug, sourceUrl });
    }).catch(() => {
      if (active) setSource(null);
    });
    return () => { active = false; };
  }, [slug]);

  function clearFeedback() {
    setResult(null);
    setFailed(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearFeedback();
    if (missingId) {
      setShowMissing(true);
      event.currentTarget.elements.namedItem(missingId)?.focus();
      return;
    }
    setShowMissing(false);
    setSubmitting(true);
    try {
      setResult(await api(`/api/eligibility/${slug}`, {
        method: 'POST',
        body: { answers },
      }));
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <h1>{t('eligibility')}</h1>
      <p>{local('intro')}</p>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset className="card form eligibility-form" disabled={submitting}>
          <label>
            {local('choose')}
            <select value={slug} onChange={(event) => {
              setSlug(event.target.value);
              setAnswers({});
              setShowMissing(false);
              clearFeedback();
            }}>
              {schemeOptions.map(([value]) => (
                <option key={value} value={value}>
                  {schemeTitle(lang, value)}
                </option>
              ))}
            </select>
          </label>
          {scope && <p className="status">{scope}</p>}
          {source?.slug === slug && (
            <a href={source.sourceUrl} target="_blank" rel="noreferrer">{local('official')}</a>
          )}
          {Object.entries(questions).map(([key, question]) => (
            <label key={key} htmlFor={`answer-${key}`}>
              {local(key, question)}
              <select
                id={`answer-${key}`}
                required
                aria-invalid={showMissing && !answers[key] ? true : undefined}
                aria-describedby={showMissing && !answers[key] ? 'missing-answers' : undefined}
                value={answers[key] ?? ''}
                onChange={(event) => {
                setAnswers({ ...answers, [key]: event.target.value });
                clearFeedback();
                }}
              >
                <option value="">{local('select')}</option>
                {answerOptions.map((answer) => (
                  <option key={answer} value={answer}>{local(answer)}</option>
                ))}
              </select>
            </label>
          ))}
          {showMissing && missing && (
            <p id="missing-answers" role="alert" className="alert">{local('answerRequired')}</p>
          )}
          <button type="submit">{submitting ? t('loading') : t('eligibility')}</button>
        </fieldset>
      </form>
      {failed && <p role="alert" className="alert">{local('failed')}</p>}
      <div aria-live="polite">
        {result && (
          <section className="card eligibility-result" data-result={result.status}>
            <h2>{local(result.status)}</h2>
            <ul>
              {result.checks.map(({ key, status }) => (
                <li key={key}>
                  {local(key, questions[key])}{' '}
                  <strong>{local(answers[key])}</strong>{' '}
                  {local(status === 'matched' ? 'matchedCheck' : status)}
                  {key === 'familyAccounts' && answers[key] === 'yes' && (
                    <p>{local('familyException')}</p>
                  )}
                </li>
              ))}
            </ul>
            <ApplicationDirections application={result.application} />
            <p>{t('disclaimer')}</p>
            <a href={result.sourceUrl} target="_blank" rel="noreferrer">{local('official')}</a>
          </section>
        )}
      </div>
    </main>
  );
}
