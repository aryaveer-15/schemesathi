import { effectiveInputs, evaluateLegacy, evaluateProfile } from './eligibilityMatcher.mjs';
import { schemeTitle } from './eligibilityContent';
import { getText } from './locales';
import { localizedScheme } from './schemeText';

const profileLabels = {
  age: 'profileAge',
  savings: 'profileSavings',
  autoDebit: 'profileDebit',
};

export function entryTitle(entry, lang) {
  return entry.title ? localizedScheme(entry, 'title', lang) : schemeTitle(lang, entry.slug);
}

export function questionLabel(entry, key, suppliedText) {
  return suppliedText ?? entry.criteria?.[key]?.question ?? getText('en', profileLabels[key] ?? key);
}

export function matcherInputs(records) {
  const inputs = { answers: {}, profile: {} };
  for (const { group, key, value } of records) inputs[group][key] = value;
  return inputs;
}

export function remainingQuestions(entries, records, single, requestedScheme) {
  const { answers, profile } = matcherInputs(records);
  const { effectiveAnswers, effectiveProfile } = effectiveInputs(answers, profile);
  const questions = new Map();
  for (const entry of entries) {
    if (entry.publicAccess || !entry.criteria) continue;
    const { checks } = entry.group === 'answers'
      ? evaluateLegacy(single ? answers : effectiveAnswers, entry)
      : evaluateProfile(effectiveProfile, entry.criteria);
    if (checks.some(({ status }) => status === 'unmatched')) continue;
    for (const { key, status } of checks) {
      if (status !== 'unanswered') continue;
      const group = !single && key === 'citizen' ? 'profile' : entry.group;
      const id = `${group}:${key}`;
      if (!questions.has(id)) questions.set(id, { entry, id, group, key });
    }
  }
  const ordered = [...questions.values()];
  if (single) return ordered;
  const shared = ['age', 'citizen', 'savings', 'autoDebit'];
  function priority({ entry, group, key }) {
    if (entry.slug === requestedScheme) return 0;
    return group === 'profile' && shared.includes(key) ? 1 + shared.indexOf(key) : 5;
  }
  return ordered.sort((a, b) => priority(a) - priority(b));
}

export function replayAnswers(entries, prefix, records, single, requestedScheme) {
  const kept = [...prefix];
  for (const record of records) {
    if (remainingQuestions(entries, kept, single, requestedScheme).some(({ id }) => id === record.id)) {
      kept.push(record);
    }
  }
  return kept;
}
