const assert = require('node:assert/strict');
const { test } = require('node:test');
const { rules, validProfile, fromProfile, evaluateProfile } = require('../profileEligibility');

test('shared profile age and income inferences retain their current cutoff behavior', () => {
  for (const [age, expected] of [[17, 'no'], [18, 'yes'], [39, 'yes'], [40, undefined], [41, 'no']]) {
    assert.equal(fromProfile({ age }).pensionAge, expected, age);
  }
  assert.equal(fromProfile({ age: 17 }).adultWoman, 'no');
  assert.equal(fromProfile({ age: 18 }).adultWoman, undefined);
  assert.equal(fromProfile({ age: 59 }).pensionCategory, undefined);
  assert.equal(fromProfile({ age: 60 }).pensionCategory, 'yes');
  for (const [income, expected] of [[0, 'yes'], [899999, 'yes'], [900000, 'yes'], [900001, 'no']]) {
    assert.equal(fromProfile({ income }).housingIncome, expected, income);
  }
  assert.deepEqual(fromProfile({}), {});
  assert.deepEqual(fromProfile({ area: 'rural', savings: 'yes', citizen: 'unknown' }),
    { urban: 'no', savings: 'yes', citizen: 'unknown' });
  assert.deepEqual(fromProfile({ area: 'urban', savings: 'no' }), {});
});

test('numeric profile boundaries accept whole numbers only', () => {
  for (const profile of [{ age: 0 }, { age: 120 }, { income: 0 }, { income: 100_000_000 }]) {
    assert.equal(validProfile(profile), true);
  }
  for (const profile of [{ age: -1 }, { age: 121 }, { age: 18.5 }, { income: '900000' },
    { income: null }, { income: -1 }, { income: 1.5 }, { income: 100_000_001 }]) {
    assert.equal(validProfile(profile), false);
  }
});

test('age edges distinguish matches, declines and manual review in the configured matcher', () => {
  const examples = {
    pmjjby: [[17, 'unmatched'], [18, 'matched'], [49, 'matched'], [50, 'review'], [51, 'unmatched']],
    pmsby: [[17, 'unmatched'], [18, 'matched'], [68, 'matched'], [69, 'review'], [70, 'review'], [71, 'unmatched']],
    pmjdy: [[17, 'review'], [18, 'matched']],
    'nps-traders': [[17, 'unmatched'], [18, 'matched'], [40, 'matched'], [41, 'unmatched']],
    'pm-shram-yogi-maandhan': [[17, 'unmatched'], [18, 'matched'], [40, 'matched'], [41, 'unmatched']],
    'pm-kisan-maandhan': [[17, 'unmatched'], [18, 'matched'], [40, 'matched'], [41, 'unmatched']],
    'pm-vishwakarma': [[17, 'unmatched'], [18, 'matched']],
  };
  for (const [slug, boundaries] of Object.entries(examples)) {
    const criteria = rules[slug];
    for (const [age, expected] of boundaries) {
      assert.equal(evaluateProfile({ age }, criteria).checks.find(({ key }) => key === 'age').status,
        expected, `${slug} at age ${age}`);
    }
  }
});

test('school screening depends on the beneficiary age and preserves uncertainty when it is missing', () => {
  const rule = rules['rashtriya-bal-swasthya'];
  assert.deepEqual(evaluateProfile({ minorAge: 5 }, rule).checks.map(({ key }) => key), ['minorAge']);
  assert.equal(evaluateProfile({ minorAge: 6 }, rule).status, 'review');
  assert.equal(evaluateProfile({ minorAge: 6, schoolScreening: 'no' }, rule).status, 'review');
  assert.equal(evaluateProfile({ schoolScreening: 'yes' }, rule).status, 'review');
  assert.equal(evaluateProfile({ minorAge: 18, schoolScreening: 'yes' }, rule).status, 'review');
  assert.equal(evaluateProfile({ minorAge: 19, schoolScreening: 'yes' }, rule).status, 'unmatched');
  const minor = { vatsalyaGuardian: 'yes', vatsalyaCitizenship: 'yes' };
  assert.equal(evaluateProfile({ ...minor, minorAge: 0 }, rules['nps-vatsalya']).status, 'matched');
  assert.equal(evaluateProfile({ ...minor, minorAge: 17 }, rules['nps-vatsalya']).status, 'matched');
  assert.equal(evaluateProfile({ ...minor, minorAge: 18 }, rules['nps-vatsalya']).status, 'unmatched');
});

test('all reviewable answers preserve missing, unknown and exception states', () => {
  for (const [slug, criteria] of Object.entries(rules)) {
    for (const [key, rule] of Object.entries(criteria)) {
      if (!rule.reviewWhenDifferent) continue;
      const check = (profile) => evaluateProfile(profile, criteria).checks.find((entry) => entry.key === key).status;
      assert.equal(check({}), 'unanswered', slug);
      assert.equal(check({ [key]: 'unknown' }), 'review', slug);
      assert.equal(check({ [key]: rule.equals === 'yes' ? 'no' : 'yes' }), 'review', slug);
    }
  }
  const shakti = { shaktiResident: 'yes', shaktiPassenger: 'yes' };
  assert.equal(evaluateProfile(shakti, rules['ka-shakti']).status, 'review');
  assert.equal(evaluateProfile({ ...shakti, shaktiService: 'no' }, rules['ka-shakti']).status, 'unmatched');
  const jsy = rules['janani-suraksha'];
  assert.equal(evaluateProfile({ jsyDelivery: 'yes', jsyLocalRules: 'no' }, jsy).status, 'review');
  assert.equal(evaluateProfile({ jsyDelivery: 'no' }, jsy).status, 'unmatched');
  assert.deepEqual(evaluateProfile({ jsyDelivery: 'no', jsyLocalRules: 'unknown' }, jsy).checks.map(({ status }) => status),
    ['unmatched', 'review']);
  assert.equal(evaluateProfile({ jsyDelivery: 'no', jsyLocalRules: 'unknown' }, jsy).status, 'review');
  assert.deepEqual(evaluateProfile({}, rules['jan-aushadhi']), { status: 'matched', checks: [] });
});
