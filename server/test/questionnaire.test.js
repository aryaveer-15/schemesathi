const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test, before, after } = require('node:test');
const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const createApp = require('../app');
const { questionnaire, documentChecklists } = require('../questionnaire');
const { collectLinks } = require('../scripts/checkSchemeLinks');
const mongoose = require('mongoose');

let server;
let base;
let token;
const logs = [];
let requestNumber = 0;

before(async () => {
  process.env.JWT_SECRET = randomUUID();
  token = jwt.sign({ id: '000000000000000000000001', role: 'user' }, process.env.JWT_SECRET, { audience: 'schemesathi-cookie-v1', expiresIn: '1h' });
  server = createApp({ siteOrigin: 'https://schemes.example.org', proxyHops: 1, logger: { error: (entry) => logs.push(entry) } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api/eligibility`;
});

after(() => server?.close());

function post(path, body) {
  const index = requestNumber++;
  return fetch(`${base}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', Origin: 'https://schemes.example.org', 'X-SchemeSathi-Request': '1',
      Cookie: `schemesathi_session=${token}`,
      'X-Forwarded-For': `198.18.${Math.floor(index / 250)}.${index % 250 + 1}`,
    },
    body: JSON.stringify(body),
  });
}

for (const entry of questionnaire.filter(({ publicAccess }) => !publicAccess)) {
  test(`${entry.slug} requires verification for every applicable Not sure answer`, async () => {
    const matches = Object.fromEntries(Object.entries(entry.criteria).map(([key, criterion]) =>
      [key, typeof criterion === 'string' ? criterion : criterion.equals ?? (key === 'minorAge' ? 6 : criterion.min)]));
    for (const key of Object.keys(matches)) {
      const input = { ...matches, [key]: 'unknown' };
      const response = await post('matches', { [entry.group]: input });
      assert.equal(response.status, 200);
      const { results } = await response.json();
      const result = results.find(({ slug }) => slug === entry.slug);
      assert.equal(result.status, 'review', key);
      assert.equal(result.checks.find((check) => check.key === key)?.status, 'review', key);
      assert.equal(result.application, undefined, key);
      if (entry.group === 'answers') {
        const single = await post(entry.slug, { answers: input });
        assert.equal(single.status, 200);
        assert.equal((await single.json()).status, 'review', key);
      }
    }
  });
}

test('the questionnaire exposes all current schemes and only already-linked sources for document checklists', async () => {
  const plan = await (await fetch(`${base}/questionnaire`)).json();
  assert.equal(plan.length, 51);
  assert.deepEqual(plan.filter(({ publicAccess }) => publicAccess).map(({ slug }) => slug), ['jan-aushadhi']);
  assert.ok(plan.filter(({ publicAccess }) => !publicAccess).every(({ criteria }) => Object.keys(criteria).length));
  const links = (await collectLinks()).flatMap(({ references }) => references);
  for (const [slug, { items, sourceUrl }] of Object.entries(documentChecklists)) {
    assert.ok(items.length, slug);
    assert.ok(links.some((link) => link.slug === slug && link.originalUrl === sourceUrl), slug);
  }
});

test('explicit uncertainty is retained when shared fields would otherwise override it', async () => {
  const response = await post('matches', {
    answers: { citizen: 'unknown', pensionAge: 'unknown', housingIncome: 'unknown', savings: 'unknown' },
    profile: { age: 39, income: 900000, citizen: 'yes', savings: 'yes', bankAccount: 'unknown' },
  });
  assert.equal(response.status, 200);
  const { results } = await response.json();
  for (const [slug, key] of [['atal-pension-yojana', 'pensionAge'], ['atal-pension-yojana', 'citizen'],
    ['atal-pension-yojana', 'savings'], ['pm-awas-yojana', 'housingIncome'], ['pmjdy', 'bankAccount']]) {
    const result = results.find((scheme) => scheme.slug === slug);
    assert.equal(result.status, 'review', slug);
    assert.equal(result.checks.find((check) => check.key === key).status, 'review', key);
  }
});

test('submitted answers are processed without database access, cookies, or logging', async (context) => {
  const access = context.mock.method(mongoose.Connection.prototype, 'collection', () => {
    throw new Error('Eligibility must not access database collections');
  });
  const single = await post('pm-ujjwala-yojana', { answers: { adultWoman: 'no' }, partial: true });
  assert.equal(single.status, 200);
  assert.equal(single.headers.get('cache-control'), 'no-store');
  assert.equal(single.headers.get('set-cookie'), null);
  const decline = await single.json();
  assert.equal(decline.status, 'unmatched');
  assert.deepEqual(decline.checks, [
    { key: 'adultWoman', status: 'unmatched' }, { key: 'lpg', status: 'unanswered' },
    { key: 'deprivation', status: 'unanswered' },
  ]);
  const multi = await post('matches', { profile: { age: 73 } });
  assert.equal(multi.status, 200);
  assert.equal(multi.headers.get('cache-control'), 'no-store');
  assert.equal(multi.headers.get('set-cookie'), null);
  assert.equal(access.mock.callCount(), 0);
  assert.deepEqual(logs, []);
});
