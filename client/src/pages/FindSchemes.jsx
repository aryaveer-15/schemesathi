import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import EligibilityQuestionnaire from '../EligibilityQuestionnaire';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

export default function FindSchemes() {
  const { token, signOut } = useAuth();
  const { t } = useLang();
  const [search] = useSearchParams();
  const requestedScheme = search.get('scheme');
  const [entries, setEntries] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api('/api/eligibility/questionnaire', { signal: controller.signal }).then((data) => {
      if (!Array.isArray(data) || !data.length) throw new Error('Questionnaire unavailable');
      if (!controller.signal.aborted) setEntries(data);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [attempt]);

  async function check(inputs) {
    try {
      const { results } = await api('/api/eligibility/matches', { method: 'POST', token, body: inputs });
      return results;
    } catch (error) {
      if (error.status === 401) signOut();
      throw error;
    }
  }

  return (
    <main className="page questionnaire-page">
      <h1>{t('findSchemes')}</h1>
      <p>{t('guidedMatchIntro')}</p>
      {failed ? (
        <p className="alert" role="alert">{t('extraChecksFailed')}{' '}
          <button type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>{t('retry')}</button>
        </p>
      ) : !entries ? <p role="status">{t('loading')}…</p> : (
        <EligibilityQuestionnaire key={requestedScheme} entries={entries} requestedScheme={requestedScheme} onCheck={check} />
      )}
    </main>
  );
}
