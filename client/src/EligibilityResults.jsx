import { useState } from 'react';
import { Link } from 'react-router-dom';
import ApplicationDirections from './ApplicationDirections';
import { eligibilityText, schemeScopeKey } from './eligibilityContent';
import { effectiveInputs } from './eligibilityMatcher.mjs';
import { entryTitle, matcherInputs, questionLabel, questionReviewKey } from './questionnaire';
import { useLang } from './useLang';
import ReviewText from './ReviewText';
import TranslationNotice from './TranslationNotice';

const buckets = [
  ['matched', 'likelyMatches'], ['review', 'possibleMatches'], ['unmatched', 'notMatched'], ['public', 'publicAccessResults'],
];

function officialLink(value) {
  return /^https:\/\//i.test(value ?? '') ? value : null;
}

function reasonsFor(entry, result, values) {
  return result.checks.filter(({ status }) => status !== 'matched').map(({ key, status, question }) => {
    const rule = entry.criteria?.[key];
    let reason;
    let range;
    let substitutions;
    if (values[key] === 'unknown') reason = 'uncertainReason';
    else if (status === 'unanswered') reason = 'missingReason';
    else if (status === 'review') reason = 'authorityReviewReason';
    else if (typeof rule === 'string' || rule?.equals) {
      reason = 'expectedAnswer';
      substitutions = { answer: eligibilityText('en', rule?.equals ?? rule) };
    } else {
      reason = 'unmetReason';
      if (rule?.min !== undefined) {
        range = rule.max === undefined ? 'ageAtLeast' : 'ageRange';
        substitutions = { min: rule.min, max: rule.max };
      }
    }
    return { key, reason, range, substitutions, question: questionLabel(entry, key, question) };
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
      <TranslationNotice />
      <ReviewText as="p" reviewKey="preliminaryResultNotice" />
      <div className="wizard-actions result-controls">
        <button type="button" className="primary-action" onClick={onEdit}>{t('editAnswers')}</button>
        <button type="button" className="secondary-action" onClick={() => window.print()}>{t('printResults')}</button>
        {shareText && (
          <button type="button" className="secondary-action" aria-expanded={shareOpen} aria-controls="scheme-share-text"
            onClick={() => { setShareOpen(!shareOpen); setCopied(false); }}>{t('shareResults')}</button>
        )}
      </div>
      <div className="result-controls share-results" id="scheme-share-text" hidden={!shareOpen}>
        <label htmlFor="shared-schemes">{t('shareOnlySchemes')}</label>
        <textarea id="shared-schemes" rows={5} readOnly value={shareText} onFocus={(event) => event.target.select()} />
        <button type="button" className="secondary-action" onClick={copyResults}>{t('copyResults')}</button>
        <p role="status">{copied && t('resultsCopied')}</p>
      </div>
      {!results.length && <p className="card empty-state" role="status">{t('noSchemes')}</p>}
      {buckets.map(([bucket, label]) => {
        const group = results.filter((result) => result.bucket === bucket);
        if (!group.length) return null;
        return (
          <section className="match-results-group" data-result={bucket} key={bucket}>
            <ReviewText as="h3" reviewKey={label} />
            {group.map((result) => {
              const { entry, source, title, values, nextSteps, verification, documents } = result;
              const reasons = reasonsFor(entry, result, values);
              const scope = schemeScopeKey(entry.slug);
              const note = { list: 'verifyOfficialList', local: 'verifyLocally', 'list-and-local': 'verifyListAndLocally' }[entry.verificationKind];
              return (
                <article className="match-result-card" key={entry.slug}>
                  <h4>{title}</h4>
                  {scope && <ReviewText as="p" reviewKey={scope} />}
                  {bucket === 'public' && <ReviewText as="p" reviewKey="publicSchemeAccess" />}
                  {reasons.length > 0 && (
                    <details open={(single || reasons.some(({ key }) => values[key] === 'unknown')) || undefined}
                      className="result-reasons">
                      <summary>{t('resultReasons')}</summary>
                      <ul lang="en" dir="ltr">{reasons.map(({ key, question, reason, range, substitutions }) => (
                        <li key={key}>
                          <ReviewText as="strong" reviewKey={reason} values={substitutions} />{' '}
                          {range && <><ReviewText as="strong" reviewKey={range} values={substitutions} />{' '}</>}
                          <ReviewText reviewKey={questionReviewKey(entry, key)} source={question} />
                        </li>
                      ))}</ul>
                      {entry.slug === 'sukanya-samriddhi-yojana' && values.familyAccounts === 'yes' && (
                        <ReviewText as="p" reviewKey="familyException" />
                      )}
                    </details>
                  )}
                  {note && <ReviewText as="p" reviewKey={note} />}
                  {verification && <ReviewText as="p" reviewKey={'application.' + entry.slug + '.verification'} source={verification} />}
                  <ApplicationDirections application={nextSteps} slug={entry.slug} result />
                  {(bucket === 'matched' || bucket === 'review') && (
                    documents ? (
                      <details open={single || undefined} className="result-documents">
                        <summary>{t('documentChecklist')}</summary>
                        {documents.scope && <ReviewText as="p" reviewKey={'document.' + entry.slug + '.scope'} source={documents.scope} />}
                        <ul lang="en" dir="ltr">{documents.items.map((item, index) => (
                          <li key={item}><ReviewText reviewKey={'document.' + entry.slug + '.' + index} source={item} /></li>
                        ))}</ul>
                        <p><a href={documents.sourceUrl} target="_blank" rel="noreferrer">{t('documentSource')}</a></p>
                      </details>
                    ) : <ReviewText as="p" reviewKey="documentFallback" />
                  )}
                  {source && <p><a href={source} target="_blank" rel="noreferrer">{eligibilityText(lang, 'official')}</a></p>}
                </article>
              );
            })}
          </section>
        );
      })}
      {!single && (
        <div className="result-coverage">
          <ReviewText as="p" reviewKey="matchCoverage" />
          <p><Link to="/schemes">{t('browse')}</Link></p>
        </div>
      )}
    </section>
  );
}
