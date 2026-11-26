import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ApplicationDirections from '../ApplicationDirections';
import { eligibilityText, schemeQuestions, schemeScope, schemeTitle } from '../eligibilityContent';
import { localizedScheme } from '../schemeText';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';
import { schemeQuestionSources } from '../schemeQuestionSources';

const statuses = ['matched', 'review', 'unmatched'];
const options = ['yes', 'no', 'unknown'];
const profileLabels = {
  age: 'profileAge', income: 'profileIncome', area: 'profileArea',
  savings: 'profileSavings', autoDebit: 'profileDebit',
  solarRoof: 'solarRoof', solarConnection: 'solarConnection', solarSubsidy: 'solarSubsidy',
  bankAccount: 'bankAccount', informalWork: 'informalWork', workerIncomeLimit: 'workerIncomeLimit',
  workerExclusion: 'workerExclusion', smallFarmRecord: 'smallFarmRecord', farmerPensionExclusion: 'farmerPensionExclusion',
  traderWork: 'traderWork', traderTurnover: 'traderTurnover', traderExclusion: 'traderExclusion',
  minorAge: 'minorAge', vatsalyaGuardian: 'vatsalyaGuardian', vatsalyaCitizenship: 'vatsalyaCitizenship',
  schoolScreening: 'schoolScreening', jsskCare: 'jsskCare', publicFacility: 'publicFacility',
  csssMerit: 'csssMerit', csssCourse: 'csssCourse', csssIncome: 'csssIncome', csssOtherAid: 'csssOtherAid',
  aicteCourse: 'aicteCourse', aicteIncome: 'aicteIncome', aicteOtherAid: 'aicteOtherAid',
  pragatiStudent: 'pragatiStudent', pragatiFamily: 'pragatiFamily', sakshamDisability: 'sakshamDisability',
  tbTreatment: 'tbTreatment', tbNotification: 'tbNotification', dialysisReferral: 'dialysisReferral', dialysisBpl: 'dialysisBpl',
  shaktiResident: 'shaktiResident', shaktiPassenger: 'shaktiPassenger', shaktiService: 'shaktiService',
  educationLoanAdmission: 'educationLoanAdmission', artisanTrade: 'artisanTrade',
  artisanFamilyExclusion: 'artisanFamilyExclusion', artisanCreditExclusion: 'artisanCreditExclusion',
  cropInterest: 'cropInterest', cropNotification: 'cropNotification', ruralHousingList: 'ruralHousingList',
  streetVendor: 'streetVendor', vendorCredentials: 'vendorCredentials', kccActivity: 'kccActivity',
  missedVaccination: 'missedVaccination', vaccinationRound: 'vaccinationRound',
};
const profileSections = [
  { title: 'solarScheme', fields: ['solarRoof', 'solarConnection', 'solarSubsidy'] },
  { title: 'janDhanScheme', fields: ['bankAccount'] },
  { title: 'workerPensionScheme', fields: ['informalWork', 'workerIncomeLimit', 'workerExclusion'] },
  {
    title: 'farmerPensionScheme',
    fields: ['smallFarmRecord', 'farmerPensionExclusion'],
    sourceUrl: schemeQuestionSources['pm-kisan-maandhan'],
  },
  { title: 'traderPensionScheme', fields: ['traderWork', 'traderTurnover', 'traderExclusion'] },
  { title: 'childSchemes', fields: ['minorAge', 'vatsalyaGuardian', 'vatsalyaCitizenship', 'schoolScreening'] },
  { title: 'jsskScheme', fields: ['jsskCare', 'publicFacility'] },
  { title: 'csssScheme', fields: ['csssMerit', 'csssCourse', 'csssIncome', 'csssOtherAid'] },
  { title: 'aicteSchemes', fields: ['aicteCourse', 'aicteIncome', 'aicteOtherAid', 'pragatiStudent', 'pragatiFamily', 'sakshamDisability'] },
  { title: 'tbScheme', fields: ['tbTreatment', 'tbNotification'] },
  { title: 'dialysisScheme', fields: ['dialysisReferral', 'dialysisBpl'] },
  { title: 'shaktiScheme', fields: ['shaktiResident', 'shaktiPassenger', 'shaktiService'] },
  { title: 'educationLoanScheme', fields: ['educationLoanAdmission'] },
  { title: 'artisanScheme', fields: ['artisanTrade', 'artisanFamilyExclusion', 'artisanCreditExclusion'],
    sourceUrl: schemeQuestionSources['pm-vishwakarma'] },
  { title: 'cropInsuranceScheme', fields: ['cropInterest', 'cropNotification'] },
  { title: 'ruralHousingScheme', fields: ['ruralHousingList'] },
  { title: 'streetVendorScheme', fields: ['streetVendor', 'vendorCredentials'] },
  { title: 'kccScheme', fields: ['kccActivity'] },
  { title: 'vaccinationScheme', fields: ['missedVaccination', 'vaccinationRound'] },
];

export default function FindSchemes() {
  const { token, signOut } = useAuth();
  const { lang, t } = useLang();
  const [searchParams] = useSearchParams();
  const requestedScheme = searchParams.get('scheme');
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState({});
  const [additionalSections, setAdditionalSections] = useState([]);
  const [sectionsFailed, setSectionsFailed] = useState(false);
  const [sectionAttempt, setSectionAttempt] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const local = (key, values) => eligibilityText(lang, key, values);
  const profileLabel = (key) => key === 'citizen'
    ? local(key, schemeQuestions['atal-pension-yojana'].questions.citizen)
    : t(profileLabels[key]);

  useEffect(() => {
    const controller = new AbortController();
    api('/api/eligibility/profile-checks', { signal: controller.signal }).then((sections) => {
      if (!Array.isArray(sections)) throw new Error('Invalid scheme sections response');
      if (!controller.signal.aborted) setAdditionalSections(sections);
    }).catch(() => {
      if (!controller.signal.aborted) setSectionsFailed(true);
    });
    return () => controller.abort();
  }, [sectionAttempt]);

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
                {profileLabel(key)}
                <select name={key} value={profile[key] ?? ''} onChange={updateProfile}>
                  <option value="">{t('skipQuestion')}</option>
                  {options.map((answer) => <option key={answer} value={answer}>{local(answer)}</option>)}
                </select>
              </label>
            ))}
          </section>
          {profileSections.map(({ title, fields, sourceUrl }) => {
            if (title === 'janDhanScheme' && profile.savings === 'yes') return null;
            return (
              <details className="card match-section" key={title}>
                <summary>{t(title)}</summary>
                {sourceUrl && <p><a href={sourceUrl} target="_blank" rel="noreferrer">{t('eligibilitySource')}</a></p>}
                {fields.map((key) => (
                  <label key={key}>
                    {profileLabel(key)}
                    {key === 'minorAge' ? (
                      <input type="number" name={key} min="0" max="120" step="1" inputMode="numeric"
                        value={profile[key] ?? ''} onChange={updateProfile} />
                    ) : (
                      <select name={key} value={profile[key] ?? ''} onChange={updateProfile}>
                        <option value="">{t('skipQuestion')}</option>
                        {options.map((answer) => <option key={answer} value={answer}>{local(answer)}</option>)}
                      </select>
                    )}
                  </label>
                ))}
              </details>
            );
          })}
          {sectionsFailed && (
            <p role="alert" className="alert">
              {t('extraChecksFailed')}{' '}
              <button type="button" onClick={() => {
                setSectionsFailed(false);
                setSectionAttempt((attempt) => attempt + 1);
              }}>{t('retry')}</button>
            </p>
          )}
          {additionalSections.length > 0 && (
            <details className="card match-section" open={additionalSections.some(({ slug }) => slug === requestedScheme) || undefined}>
              <summary>{t('extraSchemeChecks')}</summary>
              {additionalSections.map(({ slug, title, sourceUrl, questions }) => (
                <details className="match-section" key={slug} open={requestedScheme === slug || undefined}>
                  <summary>{localizedScheme({ slug, title }, 'title', lang)}</summary>
                  {questions.length === 0 && <p>{t('publicSchemeAccess')}</p>}
                  <p><a href={sourceUrl} target="_blank" rel="noreferrer">{t('officialScheme')}</a></p>
                  {questions.map(({ key, text }) => (
                    <label key={key}>
                      {text ?? profileLabel(key)}
                      <select name={key} value={profile[key] ?? ''} onChange={updateProfile}>
                        <option value="">{t('skipQuestion')}</option>
                        {options.map((answer) => <option key={answer} value={answer}>{local(answer)}</option>)}
                      </select>
                    </label>
                  ))}
                </details>
              ))}
            </details>
          )}
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
                  {schemes.map(({ slug, title, checks, sourceUrl, application, verification }) => (
                    <article key={slug} className="card match-result-card">
                      <details className="match-section">
                        <summary>{title ? localizedScheme({ slug, title }, 'title', lang) : schemeTitle(lang, slug)}</summary>
                        {checks.length ? <ul>{checks.map(({ key, status: check, range, question }) => {
                          const answer = title ? (profile[key] ?? results.answers[key]) : results.answers[key];
                          const displayedAnswer = key === 'bankAccount' && profile.savings === 'yes' ? 'yes' : answer;
                          return (
                            <li key={key}>
                              {title ? (question ?? profileLabel(key)) : local(key, schemeQuestions[slug].questions[key])}{' '}
                              {range && <bdi>({range.join('–')})</bdi>}{' '}
                              <strong>{check === 'unanswered' ? t('skipQuestion') : typeof displayedAnswer === 'number'
                                ? new Intl.NumberFormat(lang).format(displayedAnswer) : local(displayedAnswer)}</strong>{' '}
                              {check !== 'unanswered' && local(check === 'matched' ? 'matchedCheck' : check)}
                            </li>
                          );
                        })}</ul> : <p>{t('publicSchemeAccess')}</p>}
                        <p><a href={sourceUrl} target="_blank" rel="noreferrer">{local('official')}</a></p>
                        {!title && <Link to={`/eligibility?scheme=${encodeURIComponent(slug)}`}>{t('eligibility')}</Link>}
                      </details>
                      <ApplicationDirections application={application} />
                      {verification && <div className="application-directions">
                        <strong>{t('howToVerifyScheme')}</strong>
                        <p>{verification}</p>
                      </div>}
                    </article>
                  ))}
                </section>
              );
            })}
            <p>{t('disclaimer')}</p>
            <p>{t('matchCoverage')} <Link to="/schemes">{t('browse')}</Link></p>
          </section>
        )}
      </div>
    </main>
  );
}
