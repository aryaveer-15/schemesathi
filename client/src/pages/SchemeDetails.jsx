import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { schemeQuestions } from '../eligibilityContent';
import { useLang } from '../useLang';
import { localizedScheme } from '../schemeText';

export default function SchemeDetails() {
  const { id } = useParams();
  return <SchemeDetailsContent key={id} id={id} />;
}

function SchemeDetailsContent({ id }) {
  const { t, lang } = useLang();
  const [scheme, setScheme] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const hasForm = scheme && Object.hasOwn(schemeQuestions, scheme.slug);
  const hasProfile = scheme?.eligibilityMode === 'profile';

  useEffect(() => {
    let active = true;
    api(`/api/schemes/${encodeURIComponent(id)}`).then((data) => {
      if (active) setScheme(data);
    }).catch((failure) => {
      if (active) setError([400, 404].includes(failure.status) ? 'schemeMissing' : 'loadFailed');
    });
    return () => { active = false; };
  }, [id, attempt]);

  return (
    <main className="page">
      <p><Link to="/schemes">{t('backToSchemes')}</Link></p>
      {error && <p className="alert" role="alert">
        {t(error)}
        {error === 'loadFailed' && <button type="button" onClick={() => {
          setError(null);
          setAttempt((value) => value + 1);
        }}>{t('retry')}</button>}
      </p>}
      {!error && !scheme && <p role="status">{t('loading')}…</p>}
      {scheme && (
        <article className="card">
          <h1>{localizedScheme(scheme, 'title', lang)}</h1>
          <p className="meta">
            <span>{t(scheme.category)}</span>
            {scheme.state && <span>{scheme.state === 'All India' ? t('allIndia') : scheme.state}</span>}
          </p>
          <p>{localizedScheme(scheme, 'summary', lang)}</p>
          {hasForm && (
            <p><Link to={`/eligibility?scheme=${encodeURIComponent(scheme.slug)}`}>{t('eligibility')}</Link></p>
          )}
          {hasProfile && <p><Link to="/my-schemes">{t('findSchemes')}</Link></p>}
          {/^(https?:\/\/)/i.test(scheme.sourceUrl ?? '') && (
            <p><a href={scheme.sourceUrl} target="_blank" rel="noreferrer">
              {t(hasForm || hasProfile ? 'officialScheme' : 'officialCheck')}
            </a></p>
          )}
          <p className="disclaimer">{t('disclaimer')}</p>
        </article>
      )}
    </main>
  );
}
