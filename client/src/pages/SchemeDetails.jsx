import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import ApplicationDirections from '../ApplicationDirections';
import SchemeBanner from '../SchemeBanner';
import TranslationNotice from '../TranslationNotice';
import { schemeQuestions } from '../eligibilityContent';
import { getText } from '../locales';
import { useLang } from '../useLang';
import { localizedScheme, stateLabel } from '../schemeText';

const verificationMessages = {
  list: 'verifyOfficialList',
  local: 'verifyLocally',
  'list-and-local': 'verifyListAndLocally',
};

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
  const publicAccess = scheme?.eligibilityMode === 'public';
  const verifiedAt = scheme?.lastVerifiedAt ? new Date(scheme.lastVerifiedAt) : null;
  const verifiedDate = verifiedAt && Number.isFinite(verifiedAt.getTime()) ? verifiedAt : null;
  const verificationMessage = verificationMessages[scheme?.verificationKind];

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
        <article className="card scheme-detail" data-category={scheme.category}>
          <SchemeBanner slug={scheme.slug} category={scheme.category} featured />
          <h1>{localizedScheme(scheme, 'title', lang)}</h1>
          <p className="meta">
            <span>{t(scheme.category)}</span>
            {scheme.state && <span>{stateLabel(scheme.state, t)}</span>}
          </p>
          <TranslationNotice />
          <p lang="en" dir="ltr">{localizedScheme(scheme, 'summary', lang)}</p>
          <p>
            {t('lastVerified')}{' · '}
            {verifiedDate
              ? <time dateTime={verifiedDate.toISOString().slice(0, 10)}>
                {new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(verifiedDate)}
              </time>
              : t('verificationPending')}
          </p>
          {verificationMessage && <p lang="en" dir="ltr"><strong>{getText('en', verificationMessage)}</strong></p>}
          {scheme.eligibilityRequirements?.length > 0 && (
            <section aria-labelledby="scheme-requirements">
              <h2 id="scheme-requirements">{t('eligibilityRequirements')}</h2>
              <ul lang="en" dir="ltr">{scheme.eligibilityRequirements.map((requirement, index) => (
                <li key={index}>{requirement.en}</li>
              ))}</ul>
              {/^https:\/\//i.test(scheme.eligibilitySourceUrl ?? '') && (
                <p><a href={scheme.eligibilitySourceUrl} target="_blank" rel="noreferrer">{t('eligibilitySource')}</a></p>
              )}
            </section>
          )}
          {hasForm && (
            <p><Link to={`/eligibility?scheme=${encodeURIComponent(scheme.slug)}`}>{t('eligibility')}</Link></p>
          )}
          {hasProfile && <p><Link to={`/my-schemes?scheme=${encodeURIComponent(scheme.slug)}`}>{t('findSchemes')}</Link></p>}
          {publicAccess && <p lang="en" dir="ltr">{getText('en', 'publicSchemeAccess')}</p>}
          <ApplicationDirections application={scheme.application} />
          {/^(https?:\/\/)/i.test(scheme.sourceUrl ?? '') && (
            <p><a href={scheme.sourceUrl} target="_blank" rel="noreferrer">
              {t(hasForm || hasProfile || publicAccess ? 'officialScheme' : 'officialCheck')}
            </a></p>
          )}
          <p className="disclaimer" lang="en" dir="ltr">{getText('en', 'disclaimer')}</p>
        </article>
      )}
    </main>
  );
}
