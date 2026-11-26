import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { eligibilityText, schemeQuestions, schemeTitle } from '../eligibilityContent';
import EligibilityQuestionnaire from '../EligibilityQuestionnaire';
import { useLang } from '../useLang';

const schemeOptions = Object.keys(schemeQuestions);

export default function Eligibility() {
  const [params] = useSearchParams();
  const requested = params.get('scheme');
  const slug = Object.hasOwn(schemeQuestions, requested) ? requested : schemeOptions[0];
  return <EligibilityForm key={slug} initialSlug={slug} />;
}

function EligibilityForm({ initialSlug }) {
  const { lang, t } = useLang();
  const [slug, setSlug] = useState(initialSlug);
  const [entry, setEntry] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api(`/api/eligibility/${slug}`, { signal: controller.signal }).then((data) => {
      if (!data?.criteria || !Object.keys(data.criteria).length) throw new Error('Questionnaire unavailable');
      if (!controller.signal.aborted) setEntry({ ...data, slug, group: 'answers' });
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [slug, attempt]);

  async function check({ answers }) {
    const complete = Object.keys(answers).length === Object.keys(entry.criteria).length;
    const result = await api(`/api/eligibility/${slug}`, {
      method: 'POST',
      body: complete ? { answers } : { answers, partial: true },
    });
    return [{ ...result, slug }];
  }

  return (
    <main className="page questionnaire-page">
      <h1>{t('eligibility')}</h1>
      <p>{eligibilityText(lang, 'intro')}</p>
      <label className="form wizard-chooser">
        {eligibilityText(lang, 'choose')}
        <select value={slug} onChange={(event) => {
          setSlug(event.target.value);
          setEntry(null);
          setFailed(false);
        }}>
          {schemeOptions.map((value) => <option key={value} value={value}>{schemeTitle(lang, value)}</option>)}
        </select>
      </label>
      {failed ? (
        <p className="alert" role="alert">{eligibilityText(lang, 'failed')}{' '}
          <button type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>{t('retry')}</button>
        </p>
      ) : entry?.slug !== slug ? <p role="status">{t('loading')}…</p> : (
        <EligibilityQuestionnaire key={slug} entries={[entry]} onCheck={check} single />
      )}
    </main>
  );
}
