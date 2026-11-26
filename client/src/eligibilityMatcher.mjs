export function fromProfile(profile) {
  const { age, income, area, citizen, savings } = profile;
  const answers = {};
  if (citizen) answers.citizen = citizen;
  // A participating account confirms the broader bank or post office question.
  if (savings === 'yes') answers.savings = savings;
  if (typeof age === 'number' && age !== 40) answers.pensionAge = age >= 18 && age < 40 ? 'yes' : 'no';
  if (age >= 60) answers.pensionCategory = 'yes';
  if (age < 18) answers.adultWoman = 'no';
  if (area === 'rural') answers.urban = 'no';
  if (typeof income === 'number') answers.housingIncome = income <= 900_000 ? 'yes' : 'no';
  return answers;
}

function checkField(profile, field, rule) {
  const value = profile[field];
  if (value === undefined) return 'unanswered';
  if (value === 'unknown') return 'review';
  if ('equals' in rule) {
    if (value === rule.equals) return 'matched';
    return rule.reviewWhenDifferent ? 'review' : 'unmatched';
  }
  if (value < rule.min) return rule.reviewBelow ? 'review' : 'unmatched';
  if (rule.max !== undefined && value > rule.max) return 'unmatched';
  return rule.reviewFrom !== undefined && value >= rule.reviewFrom ? 'review' : 'matched';
}

export function outcome(checks, values) {
  if (checks.some(({ key }) => values?.[key] === 'unknown')) return 'review';
  if (checks.some(({ status }) => status === 'unmatched')) return 'unmatched';
  if (checks.some(({ status }) => status !== 'matched')) return 'review';
  return 'matched';
}

export function evaluateProfile(profile, criteria) {
  const minorAge = typeof profile.minorAge === 'number' ? profile.minorAge : Infinity;
  const checks = Object.entries(criteria)
    .filter(([, rule]) => rule.skipBelowAge === undefined || minorAge >= rule.skipBelowAge)
    .map(([key, rule]) => ({
      key, status: checkField(profile, key, rule),
      ...(rule.question && { question: rule.question }),
      ...(rule.min !== undefined && rule.max !== undefined && { range: [rule.min, rule.max] }),
    }));
  return { status: outcome(checks, profile), checks };
}

export function evaluateLegacy(answers, { criteria, reviewCriteria = [] }) {
  const checks = Object.entries(criteria).map(([key, expected]) => {
    if (!Object.hasOwn(answers, key)) return { key, status: 'unanswered' };
    if (answers[key] === expected) return { key, status: 'matched' };
    if (answers[key] === 'unknown' || reviewCriteria.includes(key)) return { key, status: 'review' };
    return { key, status: 'unmatched' };
  });
  return { status: outcome(checks, answers), checks };
}

export function effectiveInputs(answers, profile) {
  const effectiveAnswers = { ...answers, ...fromProfile(profile) };
  for (const [key, value] of Object.entries(answers)) {
    if (value === 'unknown') effectiveAnswers[key] = value;
  }
  return {
    effectiveAnswers,
    effectiveProfile: {
      ...profile,
      citizen: effectiveAnswers.citizen,
      bankAccount: profile.savings === 'yes' && profile.bankAccount !== 'unknown' ? 'yes' : profile.bankAccount,
    },
  };
}
