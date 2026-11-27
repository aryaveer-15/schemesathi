const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test, before, after } = require('node:test');
const createApp = require('../app');
const app = createApp({ siteOrigin: 'https://schemes.example.org' });

let server;
let base;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api/eligibility`;
});

after(() => server?.close());

async function check(slug, answers) {
  const response = await fetch(`${base}/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://schemes.example.org', 'X-SchemeSathi-Request': '1' },
    body: JSON.stringify({ answers }),
  });
  return { code: response.status, result: await response.json() };
}

const matches = {
  'atal-pension-yojana': { pensionAge: 'yes', citizen: 'yes', savings: 'yes', taxpayer: 'no', pensionAccount: 'no' },
  'sukanya-samriddhi-yojana': { guardian: 'yes', childAge: 'yes', childResident: 'yes', childAccount: 'no', familyAccounts: 'no' },
  'pm-kisan': { land: 'yes', exclusions: 'no', landReview: 'no' },
  'ayushman-bharat-pmjay': { beneficiary: 'yes' },
  'pm-ujjwala-yojana': { adultWoman: 'yes', lpg: 'no', deprivation: 'yes' },
  'pm-awas-yojana': { urban: 'yes', house: 'no', housingBenefit: 'no', housingIncome: 'yes' },
  'nsap-pension': { poverty: 'yes', pensionCategory: 'yes' },
  'pm-mudra-yojana': { business: 'yes', loanLimit: 'yes' },
};

test('each questionnaire matches the API and exposes its official source', async () => {
  const { schemeQuestions } = await import('../../client/src/eligibilityContent.js');
  assert.deepEqual(Object.keys(schemeQuestions).sort(), Object.keys(matches).sort());

  for (const [slug, answers] of Object.entries(matches)) {
    assert.deepEqual(Object.keys(schemeQuestions[slug].questions), Object.keys(answers), slug);
    const { code, result } = await check(slug, answers);
    assert.equal(code, 200, slug);
    assert.equal(result.status, 'matched', slug);
    assert.ok(result.application?.online || result.application?.visit, slug);
    if (result.application.online) assert.equal(new URL(result.application.url).protocol, 'https:', slug);
    assert.deepEqual(result.checks, Object.keys(answers).map((key) => ({ key, status: 'matched' })), slug);
    const response = await fetch(`${base}/${slug}`);
    assert.equal(response.status, 200, slug);
    assert.equal((await response.json()).sourceUrl, result.sourceUrl, slug);
    assert.equal(new URL(result.sourceUrl).protocol, 'https:', slug);
  }
});

test('uncertainty, exceptions, and unmet requirements retain distinct results', async () => {
  for (const [slug, overrides, expected] of [
    ['atal-pension-yojana', { pensionAge: 'unknown' }, 'review'],
    ['atal-pension-yojana', { taxpayer: 'yes' }, 'unmatched'],
    ['atal-pension-yojana', { taxpayer: 'yes', savings: 'unknown' }, 'review'],
    ['sukanya-samriddhi-yojana', { familyAccounts: 'yes' }, 'review'],
    ['pm-kisan', { landReview: 'yes' }, 'review'],
    ['ayushman-bharat-pmjay', { beneficiary: 'no' }, 'review'],
    ['pm-ujjwala-yojana', { lpg: 'yes' }, 'unmatched'],
    ['pm-awas-yojana', { urban: 'no' }, 'unmatched'],
    ['nsap-pension', { pensionCategory: 'unknown' }, 'review'],
    ['pm-mudra-yojana', { loanLimit: 'no' }, 'unmatched'],
  ]) {
    const { code, result } = await check(slug, { ...matches[slug], ...overrides });
    assert.equal(code, 200);
    assert.equal(result.status, expected, slug);
    assert.equal(result.application, undefined, slug);
  }
});

test('rejects missing answers, unexpected fields, invalid values, and unknown schemes', async () => {
  const slug = 'ayushman-bharat-pmjay';
  for (const answers of [undefined, {}, [], { beneficiary: true }, { beneficiary: 'yes', extra: 'yes' }]) {
    assert.equal((await check(slug, answers)).code, 400);
  }
  assert.equal((await check('toString', {})).code, 404);
});
