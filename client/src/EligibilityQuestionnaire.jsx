import { useEffect, useRef, useState } from 'react';
import { eligibilityText, schemeScope } from './eligibilityContent';
import { entryTitle, matcherInputs, questionLabel, remainingQuestions, replayAnswers } from './questionnaire';
import { schemeQuestionSources } from './schemeQuestionSources';
import EligibilityResults from './EligibilityResults';
import TranslationNotice from './TranslationNotice';
import { useLang } from './useLang';

const options = ['yes', 'no', 'unknown'];

export default function EligibilityQuestionnaire({ entries, requestedScheme, onCheck, single = false }) {
  const { lang, t } = useLang();
  const [records, setRecords] = useState([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const heading = useRef(null);
  const input = useRef(null);
  const pending = remainingQuestions(entries, records.slice(0, index), single, requestedScheme);
  const current = records[index] ?? pending[0];
  const stepId = current?.id;
  const isNumber = ['age', 'minorAge'].includes(current?.key);
  const local = (key) => eligibilityText(lang, key);
  const number = (value) => new Intl.NumberFormat(lang).format(value);

  useEffect(() => {
    heading.current?.focus();
  }, [stepId, index, result]);

  function visit(nextIndex, path) {
    setIndex(nextIndex);
    setDraft(path[nextIndex]?.value ?? '');
    setInvalid(false);
    setFailed(false);
  }

  async function showResults(path) {
    if (!path.length) return;
    setBusy(true);
    setFailed(false);
    try {
      setResult({ schemes: await onCheck(matcherInputs(path)), records: path });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function advance(event, finish = false) {
    event.preventDefault();
    const value = isNumber && draft !== 'unknown' && draft !== '' ? Number(draft) : draft;
    if (value === '' && finish && index > 0) {
      const prefix = records.slice(0, index);
      setRecords(prefix);
      showResults(prefix);
      return;
    }
    if (value === '' || (typeof value === 'number' && (!Number.isInteger(value) || value < 0 || value > 120))) {
      setInvalid(true);
      input.current?.focus();
      return;
    }
    const prefix = [...records.slice(0, index), { ...current, value }];
    const path = replayAnswers(entries, prefix, records.slice(index + 1), single, requestedScheme);
    setRecords(path);
    if (finish || (!path[index + 1] && remainingQuestions(entries, path, single, requestedScheme).length === 0)) {
      showResults(path);
      return;
    }
    visit(index + 1, path);
  }

  if (result) {
    return <EligibilityResults data={result} entries={entries} heading={heading} single={single} onEdit={() => {
      setResult(null);
      visit(0, records);
    }} />;
  }
  if (!current) return null;

  const question = questionLabel(current.entry, current.key);
  const scope = schemeScope(current.entry.slug);
  const total = index + pending.length;
  const last = pending.length === 1;
  const progress = t('questionProgress').replace('{current}', number(index + 1)).replace('{total}', number(total));
  const sourceUrl = schemeQuestionSources[current.entry.slug] ?? current.entry.sourceUrl;
  const isShared = !single && ['age', 'citizen', 'savings', 'autoDebit', 'minorAge'].includes(current.key)
    && current.group === 'profile';

  return (
    <form className="card eligibility-wizard" noValidate onSubmit={advance}>
      <p id="question-progress">{progress}</p>
      <progress aria-labelledby="question-progress" max={total} value={index + 1} />
      <p>{isShared ? t('profileDetails') : entryTitle(current.entry, lang)}</p>
      <TranslationNotice />
      <h2 ref={heading} tabIndex={-1} id="question-heading" lang="en" dir="ltr">{question}</h2>
      {scope && <p className="status" lang="en" dir="ltr">{scope}</p>}
      {!isShared && sourceUrl && (
        <p><a href={sourceUrl} target="_blank" rel="noreferrer">{local('official')}</a></p>
      )}
      <fieldset className="form eligibility-form" disabled={busy}>
        {isNumber ? (
          <>
            <input ref={input} type="number" min="0" max="120" step="1" inputMode="numeric"
              aria-labelledby="question-heading" aria-invalid={invalid || undefined}
              aria-describedby={invalid ? 'question-error' : undefined}
              disabled={draft === 'unknown'} value={draft === 'unknown' ? '' : draft}
              onChange={(event) => { setDraft(event.target.value); setInvalid(false); setFailed(false); }} />
            <label className="wizard-unknown">
              <input type="checkbox" checked={draft === 'unknown'} onChange={(event) => {
                setDraft(event.target.checked ? 'unknown' : '');
                setInvalid(false);
                setFailed(false);
              }} />
              {local('unknown')}
            </label>
          </>
        ) : (
          <select ref={input} aria-labelledby="question-heading" aria-invalid={invalid || undefined}
            aria-describedby={invalid ? 'question-error' : undefined}
            value={draft} onChange={(event) => { setDraft(event.target.value); setInvalid(false); setFailed(false); }}>
            <option value="">{local('select')}</option>
            {options.map((option) => <option key={option} value={option}>{local(option)}</option>)}
          </select>
        )}
        {invalid && <p className="alert" role="alert" id="question-error">
          {isNumber ? <span lang="en" dir="ltr">{eligibilityText('en', 'ageRequired')}</span> : local('answerRequired')}
        </p>}
        {failed && <p className="alert" role="alert">{single ? local('failed') : t('matchFailed')}</p>}
        <div className="wizard-actions">
          {index > 0 && <button type="button" onClick={() => visit(index - 1, records)}>{t('previousQuestion')}</button>}
          <button type="submit">{busy ? t('loading') : last ? t(single ? 'eligibility' : 'showMatches') : t('nextQuestion')}</button>
          {!single && !last && (index > 0 || draft !== '') && (
            <button type="button" onClick={(event) => advance(event, true)}>{t('showMatches')}</button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
