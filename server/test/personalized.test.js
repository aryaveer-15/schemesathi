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
  assert.equal(results.length, 8);
  const bySlug = Object.fromEntries(results.map((result) => [result.slug, result]));
  assert.equal(bySlug['atal-pension-yojana'].status, 'matched');
  assert.equal(bySlug['pm-ujjwala-yojana'].status, 'unmatched');
  assert.equal(bySlug['ayushman-bharat-pmjay'].status, 'review');
  assert.deepEqual(bySlug['ayushman-bharat-pmjay'].checks, [{ key: 'beneficiary', status: 'unanswered' }]);
});
