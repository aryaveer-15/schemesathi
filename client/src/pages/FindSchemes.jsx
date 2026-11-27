import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import EligibilityQuestionnaire from '../EligibilityQuestionnaire';
import LoadingState from '../LoadingState';
import { useAuth } from '../useAuth';
import { useLang } from '../useLang';

export default function FindSchemes({ authenticated }) {
  const { expireSession } = useAuth();
  const { t } = useLang();
  const [search] = useSearchParams();
  const requestedScheme = search.get('scheme');
  const [entries, setEntries] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    api('/api/eligibility/questionnaire', { signal: controller.signal }).then((data) => {
      if (!Array.isArray(data) || !data.length) throw new Error('Questionnaire unavailable');
      if (!controller.signal.aborted) setEntries(data);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [attempt, authenticated]);

  async function check(inputs) {
    try {
      const { results } = await api('/api/eligibility/matches', { method: 'POST', body: inputs });
      return results;
    } catch (error) {
      if (error.status === 401) expireSession();
      throw error;
    }
  }

  if (failed) {
    return <div className="alert feedback" role="alert"><p>{t('extraChecksFailed')}</p>
      <button type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>{t('retry')}</button>
    </div>;
  }
  if (!authenticated || !entries) return <LoadingState variant="questionnaire" />;
  return <EligibilityQuestionnaire key={requestedScheme} entries={entries} requestedScheme={requestedScheme} onCheck={check} />;
}
