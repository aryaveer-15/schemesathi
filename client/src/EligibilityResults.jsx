import { useState } from 'react';
import { Link } from 'react-router-dom';
import ApplicationDirections from './ApplicationDirections';
import { eligibilityText, schemeScope } from './eligibilityContent';
import { effectiveInputs } from './eligibilityMatcher.mjs';
import { entryTitle, matcherInputs, questionLabel } from './questionnaire';
import { useLang } from './useLang';

const buckets = [
  ['matched', 'likelyMatches'], ['review', 'possibleMatches'], ['unmatched', 'notMatched'], ['public', 'publicAccessResults'],
];

function officialLink(value) {
  return /^https:\/\//i.test(value ?? '') ? value : null;
}

function reasonsFor(entry, result, values, lang, t) {
  return result.checks.filter(({ status }) => status !== 'matched').map(({ key, status, question }) => {
    const rule = entry.criteria?.[key];
    let reason;
    if (values[key] === 'unknown') reason = t('uncertainReason');
    else if (status === 'unanswered') reason = t('missingReason');
    else if (status === 'review') reason = t('authorityReviewReason');
    else if (typeof rule === 'string' || rule?.equals) {
      reason = t('expectedAnswer').replace('{answer}', eligibilityText(lang, rule?.equals ?? rule));
    } else if (rule?.min !== undefined) {
      const range = rule.max === undefined ? t('ageAtLeast').replace('{min}', rule.min)
        : t('ageRange').replace('{min}', rule.min).replace('{max}', rule.max);
      reason = `${t('unmetReason')} ${range}`;
    } else reason = t('unmetReason');
    return { key, reason, question: questionLabel(entry, key, lang, t, question) };
  });
}

export default function EligibilityResults({ data, entries, onEdit, heading, single }) {
  const { lang, t } = useLang();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { answers, profile } = matcherInputs(data.records);
  const { effectiveAnswers, effectiveProfile } = effectiveInputs(answers, profile);
  const definitions = new Map(entries.map((entry) => [entry.slug, entry]));
  const results = data.schemes.flatMap((result) => {
    const entry = definitions.get(result.slug);
    if (!entry) return [];
    const title = entryTitle(entry, lang);
    const source = officialLink(result.sourceUrl) ?? officialLink(entry.sourceUrl);
    const bucket = entry.publicAccess ? 'public' : result.status;
    const values = entry.group === 'profile' ? effectiveProfile : single ? answers : effectiveAnswers;
    return [{ ...result, entry, source, title, bucket, values }];
  });
  const shareText = results.filter(({ bucket, source }) => source && ['matched', 'review'].includes(bucket))
    .map(({ title, source, nextSteps }) => `${title}\n${officialLink(nextSteps?.url) ?? source}`).join('\n\n');

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="eligibility-result" aria-labelledby="eligibility-results-heading">
      <h2 id="eligibility-results-heading" ref={heading} tabIndex={-1}>{t('eligibilityResults')}</h2>
      <p>{t('preliminaryResultNotice')}</p>
      <div className="wizard-actions result-controls">
        <button type="button" onClick={onEdit}>{t('editAnswers')}</button>
        <button type="button" onClick={() => window.print()}>{t('printResults')}</button>
        {shareText && (
          <button type="button" aria-expanded={shareOpen} aria-controls="scheme-share-text"
            onClick={() => { setShareOpen(!shareOpen); setCopied(false); }}>{t('shareResults')}</button>
        )}
      </div>
      <div className="result-controls share-results" id="scheme-share-text" hidden={!shareOpen}>
        <label htmlFor="shared-schemes">{t('shareOnlySchemes')}</label>
        <textarea id="shared-schemes" rows={5} readOnly value={shareText} onFocus={(event) => event.target.select()} />
        <button type="button" onClick={copyResults}>{t('copyResults')}</button>
        <p role="status">{copied && t('resultsCopied')}</p>
      </div>
      {buckets.map(([bucket, label]) => {
        const group = results.filter((result) => result.bucket === bucket);
        if (!group.length) return null;
        return (
          <section className="match-results-group" data-result={bucket} key={bucket}>
            <h3>{t(label)}</h3>
            {group.map((result) => {
              const { entry, source, title, values, nextSteps, verification, documents } = result;
              const reasons = reasonsFor(entry, result, values, lang, t);
              const scope = schemeScope(lang, entry.slug);
              const note = { list: 'verifyOfficialList', local: 'verifyLocally', 'list-and-local': 'verifyListAndLocally' }[entry.verificationKind];
              return (
                <article className="card match-result-card" key={entry.slug}>
                  <h4>{title}</h4>
                  {scope && <p>{scope}</p>}
                  {bucket === 'public' && <p>{t('publicSchemeAccess')}</p>}
                  {reasons.length > 0 && (
                    <details open={(single || reasons.some(({ key }) => values[key] === 'unknown')) || undefined}
                      className="result-reasons">
                      <summary>{t('resultReasons')}</summary>
                      <ul>{reasons.map(({ key, question, reason }) => (
                        <li key={key}><strong>{reason}</strong> {question}</li>
                      ))}</ul>
                      {entry.slug === 'sukanya-samriddhi-yojana' && values.familyAccounts === 'yes' && (
                        <p>{eligibilityText(lang, 'familyException')}</p>
                      )}
                    </details>
                  )}
                  {note && <p>{t(note)}</p>}
                  {verification && <p>{verification}</p>}
                  <ApplicationDirections application={nextSteps} />
                  {(bucket === 'matched' || bucket === 'review') && (
                    documents ? (
                      <details open={single || undefined} className="result-documents">
                        <summary>{t('documentChecklist')}</summary>
                        {documents.scope && <p>{documents.scope}</p>}
                        <ul>{documents.items.map((item) => <li key={item}>{item}</li>)}</ul>
                        <p><a href={documents.sourceUrl} target="_blank" rel="noreferrer">{t('documentSource')}</a></p>
                      </details>
                    ) : <p>{t('documentFallback')}</p>
                  )}
                  {source && <p><a href={source} target="_blank" rel="noreferrer">{eligibilityText(lang, 'official')}</a></p>}
                </article>
              );
            })}
          </section>
        );
      })}
      {!single && <p>{t('matchCoverage')} <Link to="/schemes">{t('browse')}</Link></p>}
    </section>
  );
}
