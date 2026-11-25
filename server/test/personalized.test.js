const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { test, before, after } = require('node:test');
const jwt = require('jsonwebtoken');
const createApp = require('../app');

let server;
let base;
let token;

before(async () => {
  process.env.JWT_SECRET = randomUUID();
  token = jwt.sign({ id: 'test-user', role: 'user' }, process.env.JWT_SECRET);
  const app = createApp();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server?.close());

function post(path, data, signedIn = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (signedIn) headers.Authorization = `Bearer ${token}`;
  return fetch(base + path, { method: 'POST', headers, body: JSON.stringify(data) });
}

test('one authenticated questionnaire returns matches, exclusions and missing details', async () => {
  const answers = { pensionAge: 'yes', citizen: 'yes', savings: 'yes', taxpayer: 'no', pensionAccount: 'no', lpg: 'yes' };
  assert.equal((await post('/eligibility/matches', { answers }, false)).status, 401);
  assert.equal((await post('/eligibility/matches', { answers: {} })).status, 400);
  assert.equal((await post('/eligibility/matches', { answers: { aadhaar: 'yes' } })).status, 400);
  const response = await post('/eligibility/matches', { answers });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const { results } = await response.json();
  assert.equal(results.length, 11);
  const bySlug = Object.fromEntries(results.map((result) => [result.slug, result]));
  assert.equal(bySlug['atal-pension-yojana'].status, 'matched');
  assert.equal(bySlug['pm-ujjwala-yojana'].status, 'unmatched');
  assert.equal(bySlug['ayushman-bharat-pmjay'].status, 'review');
  assert.deepEqual(bySlug['ayushman-bharat-pmjay'].checks, [{ key: 'beneficiary', status: 'unanswered' }]);
});

test('rooftop solar uses shared citizenship and reviews missing or exceptional details', async () => {
  const profile = { citizen: 'yes', solarRoof: 'yes', solarConnection: 'yes', solarSubsidy: 'no' };
  async function matchSolar(details) {
    const response = await post('/eligibility/matches', { profile: details });
    assert.equal(response.status, 200);
    return (await response.json()).results.find(({ slug }) => slug === 'pm-surya-ghar');
  }
  assert.equal((await matchSolar(profile)).status, 'matched');
  assert.equal((await matchSolar({ citizen: 'yes' })).status, 'review');
  assert.equal((await matchSolar({ ...profile, solarSubsidy: 'yes' })).status, 'review');
  assert.equal((await matchSolar({ ...profile, solarConnection: 'no' })).status, 'unmatched');
});

test('shared profile applies to multiple schemes and reviews age boundaries', async () => {
  const profile = { age: 32, income: 500_000, area: 'rural', citizen: 'yes', savings: 'yes', autoDebit: 'yes' };
  const response = await post('/eligibility/matches', { profile });
  assert.equal(response.status, 200);
  const { results, effectiveAnswers } = await response.json();
  const bySlug = Object.fromEntries(results.map((result) => [result.slug, result]));
  assert.equal(bySlug.pmjjby.status, 'matched');
  assert.equal(bySlug.pmsby.status, 'matched');
  assert.equal(bySlug['pm-awas-yojana'].status, 'unmatched');
  assert.equal(effectiveAnswers.pensionAge, 'yes');
  assert.equal(effectiveAnswers.citizen, 'yes');
  assert.equal(effectiveAnswers.housingIncome, 'yes');
  assert.equal(effectiveAnswers.urban, 'no');

  const boundary = await post('/eligibility/matches', { profile: { ...profile, age: 50 } });
  assert.equal((await boundary.json()).results.find(({ slug }) => slug === 'pmjjby').status, 'review');
  const accidentBoundary = await post('/eligibility/matches', { profile: { ...profile, age: 69 } });
  assert.equal((await accidentBoundary.json()).results.find(({ slug }) => slug === 'pmsby').status, 'review');
  assert.equal((await post('/eligibility/matches', { profile: { age: '32' } })).status, 400);
  assert.equal((await post('/eligibility/matches', { profile: { aadhaar: 'unknown' } })).status, 400);
});
