const options = ['yes', 'no', 'unknown'];

function wholeNumber(value, min, max) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

const fields = {
  age: (value) => wholeNumber(value, 0, 120),
  income: (value) => wholeNumber(value, 0, 100_000_000),
  area: (value) => ['urban', 'rural'].includes(value),
  citizen: (value) => options.includes(value),
  savings: (value) => options.includes(value),
  autoDebit: (value) => options.includes(value),
  solarRoof: (value) => options.includes(value),
  solarConnection: (value) => options.includes(value),
  solarSubsidy: (value) => options.includes(value),
};

const rules = {
  pmjjby: {
    age: { min: 18, max: 50, reviewFrom: 50 },
    savings: { equals: 'yes' },
    autoDebit: { equals: 'yes' },
  },
  pmsby: {
    age: { min: 18, max: 70, reviewFrom: 69 },
    savings: { equals: 'yes' },
    autoDebit: { equals: 'yes' },
  },
  'pm-surya-ghar': {
    citizen: { equals: 'yes' },
    solarRoof: { equals: 'yes', reviewWhenDifferent: true },
    solarConnection: { equals: 'yes' },
    solarSubsidy: { equals: 'no', reviewWhenDifferent: true },
  },
};

function validProfile(profile) {
  return profile && typeof profile === 'object' && !Array.isArray(profile)
    && Object.entries(profile).every(([key, value]) => Object.hasOwn(fields, key) && fields[key](value));
}

function fromProfile(profile) {
  const { age, income, area, citizen, savings } = profile;
  const answers = {};
  if (citizen) answers.citizen = citizen;
  // A participating account confirms the broader bank or post office question.
  if (savings === 'yes') answers.savings = savings;
  if (age !== undefined && age !== 40) answers.pensionAge = age >= 18 && age < 40 ? 'yes' : 'no';
  if (age >= 60) answers.pensionCategory = 'yes';
  if (age < 18) answers.adultWoman = 'no';
  if (area === 'rural') answers.urban = 'no';
  if (income !== undefined) answers.housingIncome = income <= 900_000 ? 'yes' : 'no';
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
  if (value < rule.min || value > rule.max) return 'unmatched';
  return value >= rule.reviewFrom ? 'review' : 'matched';
}

function outcome(checks) {
  if (checks.some(({ status }) => status === 'unmatched')) return 'unmatched';
  if (checks.some(({ status }) => status !== 'matched')) return 'review';
  return 'matched';
}

function evaluateProfile(profile, criteria) {
  const checks = Object.entries(criteria).map(([key, rule]) => ({
    key, status: checkField(profile, key, rule),
    ...(key === 'age' && { range: [rule.min, rule.max] }),
  }));
  return { status: outcome(checks), checks };
}

module.exports = { rules, validProfile, fromProfile, evaluateProfile, outcome };
