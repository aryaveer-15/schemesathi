const options = ['yes', 'no', 'unknown'];
const yesNo = (value) => options.includes(value);

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
  bankAccount: (value) => options.includes(value),
  informalWork: (value) => options.includes(value),
  workerIncomeLimit: (value) => options.includes(value),
  workerExclusion: (value) => options.includes(value),
  smallFarmRecord: (value) => options.includes(value),
  farmerPensionExclusion: (value) => options.includes(value),
  traderWork: yesNo,
  traderTurnover: yesNo,
  traderExclusion: yesNo,
  minorAge: (value) => wholeNumber(value, 0, 120),
  vatsalyaGuardian: yesNo,
  vatsalyaCitizenship: yesNo,
  schoolScreening: yesNo,
  jsskCare: yesNo,
  publicFacility: yesNo,
  csssMerit: yesNo,
  csssCourse: yesNo,
  csssIncome: yesNo,
  csssOtherAid: yesNo,
  aicteCourse: yesNo,
  aicteIncome: yesNo,
  aicteOtherAid: yesNo,
  pragatiStudent: yesNo,
  pragatiFamily: yesNo,
  sakshamDisability: yesNo,
};

const freshTechnicalScholarship = {
  aicteCourse: { equals: 'yes' },
  aicteIncome: { equals: 'yes' },
  aicteOtherAid: { equals: 'no' },
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
  pmjdy: {
    age: { min: 18, reviewBelow: true },
    bankAccount: { equals: 'no' },
  },
  'pm-shram-yogi-maandhan': {
    age: { min: 18, max: 40 },
    informalWork: { equals: 'yes' },
    workerIncomeLimit: { equals: 'yes' },
    workerExclusion: { equals: 'no' },
  },
  'pm-kisan-maandhan': {
    age: { min: 18, max: 40 },
    smallFarmRecord: { equals: 'yes' },
    farmerPensionExclusion: { equals: 'no' },
  },
  'nps-traders': {
    age: { min: 18, max: 40 },
    citizen: { equals: 'yes' },
    traderWork: { equals: 'yes' },
    traderTurnover: { equals: 'yes' },
    traderExclusion: { equals: 'no' },
  },
  'nps-vatsalya': {
    minorAge: { min: 0, max: 17 },
    vatsalyaGuardian: { equals: 'yes' },
    vatsalyaCitizenship: { equals: 'yes' },
  },
  'rashtriya-bal-swasthya': {
    minorAge: { min: 0, max: 18, reviewFrom: 18 },
    schoolScreening: { equals: 'yes', reviewWhenDifferent: true, skipBelowAge: 6 },
  },
  'janani-shishu-suraksha': {
    jsskCare: { equals: 'yes' },
    publicFacility: { equals: 'yes', reviewWhenDifferent: true },
  },
  'pm-usp-college-scholarship': {
    csssMerit: { equals: 'yes' },
    csssCourse: { equals: 'yes' },
    csssIncome: { equals: 'yes' },
    csssOtherAid: { equals: 'no' },
  },
  'aicte-pragati': {
    ...freshTechnicalScholarship,
    pragatiStudent: { equals: 'yes' },
    pragatiFamily: { equals: 'yes' },
  },
  'aicte-saksham': {
    ...freshTechnicalScholarship,
    sakshamDisability: { equals: 'yes' },
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
  if (value < rule.min) return rule.reviewBelow ? 'review' : 'unmatched';
  if (rule.max !== undefined && value > rule.max) return 'unmatched';
  return rule.reviewFrom !== undefined && value >= rule.reviewFrom ? 'review' : 'matched';
}

function outcome(checks) {
  if (checks.some(({ status }) => status === 'unmatched')) return 'unmatched';
  if (checks.some(({ status }) => status !== 'matched')) return 'review';
  return 'matched';
}

function evaluateProfile(profile, criteria) {
  const checks = Object.entries(criteria)
    .filter(([, rule]) => rule.skipBelowAge === undefined || (profile.minorAge ?? Infinity) >= rule.skipBelowAge)
    .map(([key, rule]) => ({
      key, status: checkField(profile, key, rule),
      ...(rule.min !== undefined && rule.max !== undefined && { range: [rule.min, rule.max] }),
    }));
  return { status: outcome(checks), checks };
}

module.exports = { rules, validProfile, fromProfile, evaluateProfile, outcome };
