const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const { test, before, after } = require('node:test');
const jwt = require('jsonwebtoken');
const createApp = require('../app');
const catalog = require('../catalog');
const remainingEligibility = require('../remainingEligibility');

let server;
let base;
let token;

before(async () => {
  process.env.JWT_SECRET = randomUUID();
  token = jwt.sign({ id: '000000000000000000000001', role: 'user' }, process.env.JWT_SECRET, { audience: 'schemesathi-cookie-v1', expiresIn: '1h' });
  const app = createApp({ siteOrigin: 'https://schemes.example.org' });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server?.close());

function post(path, data, signedIn = true) {
  const headers = { 'Content-Type': 'application/json', Origin: 'https://schemes.example.org', 'X-SchemeSathi-Request': '1' };
  if (signedIn) headers.Cookie = `schemesathi_session=${token}`;
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
  assert.equal(results.length, 51);
  const bySlug = Object.fromEntries(results.map((result) => [result.slug, result]));
  assert.equal(bySlug['atal-pension-yojana'].status, 'matched');
  assert.match(bySlug['atal-pension-yojana'].application.visit, /bank or post office/);
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
  const match = await matchSolar(profile);
  assert.equal(match.status, 'matched');
  assert.equal(match.application.url, 'https://www.pmsuryaghar.gov.in/');
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

test('Jan-Dhan and both Maandhan schemes evaluate shared age and give enrolment locations', async () => {
  const profile = {
    age: 40, bankAccount: 'no', informalWork: 'yes', workerIncomeLimit: 'yes',
    workerExclusion: 'no', smallFarmRecord: 'yes', farmerPensionExclusion: 'no',
  };
  async function resultsFor(details) {
    const response = await post('/eligibility/matches', { profile: details });
    assert.equal(response.status, 200);
    return Object.fromEntries((await response.json()).results.map((result) => [result.slug, result]));
  }
  const matches = await resultsFor(profile);
  assert.equal(matches.pmjdy.status, 'matched');
  assert.match(matches.pmjdy.application.visit, /Bank Mitra/);
  for (const slug of ['pm-shram-yogi-maandhan', 'pm-kisan-maandhan']) {
    assert.equal(matches[slug].status, 'matched');
    assert.match(matches[slug].application.visit, /Common Service Centre/);
  }
  const exclusions = await resultsFor({ ...profile, savings: 'yes', workerIncomeLimit: 'no', farmerPensionExclusion: 'unknown' });
  assert.equal(exclusions.pmjdy.status, 'unmatched');
  assert.equal(exclusions['pm-shram-yogi-maandhan'].status, 'unmatched');
  assert.equal(exclusions['pm-kisan-maandhan'].status, 'review');
  assert.equal(exclusions['pm-kisan-maandhan'].application, undefined);
  assert.equal((await resultsFor({ age: 16, bankAccount: 'no' })).pmjdy.status, 'review');
  assert.equal((await resultsFor({ ...profile, age: 41 }))['pm-kisan-maandhan'].status, 'unmatched');
});

test('the seven new checks give next steps only when the stated requirements match', async () => {
  const profile = {
    age: 29, citizen: 'yes', traderWork: 'yes', traderTurnover: 'yes', traderExclusion: 'no',
    minorAge: 12, vatsalyaGuardian: 'yes', vatsalyaCitizenship: 'yes', schoolScreening: 'yes',
    jsskCare: 'yes', publicFacility: 'yes',
    csssMerit: 'yes', csssCourse: 'yes', csssIncome: 'yes', csssOtherAid: 'no',
    aicteCourse: 'yes', aicteIncome: 'yes', aicteOtherAid: 'no',
    pragatiStudent: 'yes', pragatiFamily: 'yes', sakshamDisability: 'yes',
  };
  async function resultsFor(details) {
    const response = await post('/eligibility/matches', { profile: details });
    assert.equal(response.status, 200);
    return Object.fromEntries((await response.json()).results.map((result) => [result.slug, result]));
  }
  const matches = await resultsFor(profile);
  for (const slug of ['nps-traders', 'nps-vatsalya', 'rashtriya-bal-swasthya', 'janani-shishu-suraksha',
    'pm-usp-college-scholarship', 'aicte-pragati', 'aicte-saksham']) {
    assert.equal(matches[slug].status, 'matched', slug);
    assert.ok(matches[slug].application?.online || matches[slug].application?.visit, slug);
  }
  const changed = await resultsFor({ ...profile, minorAge: 18, publicFacility: 'unknown', aicteIncome: 'no' });
  assert.equal(changed['nps-vatsalya'].status, 'unmatched');
  assert.equal(changed['rashtriya-bal-swasthya'].status, 'review');
  assert.equal(changed['janani-shishu-suraksha'].status, 'review');
  assert.equal(changed['janani-shishu-suraksha'].application, undefined);
  assert.equal(changed['aicte-pragati'].status, 'unmatched');
  assert.equal(changed['aicte-saksham'].status, 'unmatched');
  assert.equal((await resultsFor({ minorAge: 2 }))['rashtriya-bal-swasthya'].status, 'matched');
  assert.equal((await resultsFor({ schoolScreening: 'yes' }))['rashtriya-bal-swasthya'].status, 'review');
});

test('ten more programmes check requirements and direct users to apply or verify records', async () => {
  const profile = {
    age: 29, citizen: 'yes', tbTreatment: 'yes', tbNotification: 'yes',
    dialysisReferral: 'yes', dialysisBpl: 'yes', shaktiResident: 'yes', shaktiPassenger: 'yes', shaktiService: 'yes',
    educationLoanAdmission: 'yes', artisanTrade: 'yes', artisanFamilyExclusion: 'no', artisanCreditExclusion: 'no',
    cropInterest: 'yes', cropNotification: 'yes', ruralHousingList: 'yes', streetVendor: 'yes', vendorCredentials: 'yes',
    kccActivity: 'yes', missedVaccination: 'yes', vaccinationRound: 'yes',
  };
  async function resultsFor(details) {
    const response = await post('/eligibility/matches', { profile: details });
    assert.equal(response.status, 200);
    return Object.fromEntries((await response.json()).results.map((result) => [result.slug, result]));
  }
  const matches = await resultsFor(profile);
  for (const slug of ['nikshay-poshan', 'pm-national-dialysis', 'ka-shakti', 'pm-vidyalaxmi', 'pm-vishwakarma',
    'pm-fasal-bima', 'pm-awas-gramin', 'pm-svanidhi', 'kisan-credit-card', 'mission-indradhanush']) {
    assert.equal(matches[slug].status, 'matched', slug);
    assert.ok(matches[slug].application?.online || matches[slug].application?.visit, slug);
  }
  const incomplete = await resultsFor({
    ...profile, age: 17, shaktiResident: 'no', cropNotification: 'no',
    ruralHousingList: 'unknown', vendorCredentials: 'no', tbNotification: 'no', vaccinationRound: 'unknown',
  });
  for (const slug of ['pm-awas-gramin', 'pm-svanidhi', 'nikshay-poshan', 'mission-indradhanush']) {
    assert.equal(incomplete[slug].status, 'review', slug);
    assert.equal(incomplete[slug].application, undefined, slug);
    assert.ok(incomplete[slug].verification, slug);
  }
  for (const slug of ['pm-vishwakarma', 'ka-shakti', 'pm-fasal-bima']) {
    assert.equal(incomplete[slug].status, 'unmatched', slug);
    assert.equal(incomplete[slug].verification, undefined, slug);
  }
});

test('all maintained listings return a result, with sourced questions and directions for the new entries', async () => {
  const response = await fetch(base + '/eligibility/profile-checks');
  assert.equal(response.status, 200);
  const sections = await response.json();
  assert.equal(sections.length, 20);
  const profile = Object.fromEntries(Object.values(remainingEligibility).flatMap(({ criteria }) =>
    Object.entries(criteria).map(([key, rule]) => [key, rule.equals])));
  const matched = await post('/eligibility/matches', { profile });
  assert.equal(matched.status, 200);
  const { results } = await matched.json();
  const bySlug = Object.fromEntries(results.map((result) => [result.slug, result]));
  assert.deepEqual(Object.keys(bySlug).sort(), catalog.map(({ slug }) => slug).sort());
  for (const section of sections) {
    const result = bySlug[section.slug];
    assert.equal(new URL(section.sourceUrl).protocol, 'https:', section.slug);
    assert.equal(result.status, 'matched', section.slug);
    assert.ok(result.application.online || result.application.visit, section.slug);
    assert.deepEqual(result.checks.map(({ key, question }) => [key, question]),
      section.questions.map(({ key, text }) => [key, text]));
  }
  assert.equal(bySlug['jan-aushadhi'].application.url, 'https://janaushadhi.gov.in/locate-kendra');
  const missing = await post('/eligibility/matches', { profile: { subhadraResident: 'yes', subhadraExclusions: 'unknown' } });
  const odisha = (await missing.json()).results.find(({ slug }) => slug === 'odisha-subhadra');
  assert.equal(odisha.status, 'review');
  assert.match(odisha.verification, /Mo Seva Kendra/);
});

test('profile inferences take precedence only when they supply a scheme answer', async () => {
  const answers = { pensionAge: 'yes', housingIncome: 'yes', urban: 'yes', citizen: 'yes' };
  const response = await post('/eligibility/matches', {
    answers,
    profile: { age: 40, income: 900001, area: 'rural', citizen: 'unknown', savings: 'yes', bankAccount: 'no' },
  });
  assert.equal(response.status, 200);
  const { effectiveAnswers, results } = await response.json();
  assert.deepEqual(effectiveAnswers, {
    pensionAge: 'yes', housingIncome: 'no', urban: 'no', citizen: 'unknown', savings: 'yes',
  });
  const janDhan = results.find(({ slug }) => slug === 'pmjdy');
  assert.equal(janDhan.checks.find(({ key }) => key === 'bankAccount').status, 'unmatched');
});
