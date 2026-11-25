const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test, before, after } = require('node:test');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const createApp = require('../app');
const Scheme = require('../models/Scheme');

const logs = [];
let base;
let server;
let staticDir;
let ready = true;

before(async () => {
  staticDir = await mkdtemp(path.join(os.tmpdir(), 'schemesathi-release-'));
  await writeFile(path.join(staticDir, 'index.html'), '<title>SchemeSathi test build</title>');
  const app = createApp({
    staticDir,
    origins: ['https://schemes.example.org'],
    isReady: () => ready,
    logger: { error: (message) => logs.push(JSON.parse(message)) },
  });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  if (staticDir) await rm(staticDir, { recursive: true });
});

test('serves SPA routes and keeps API 404s in JSON', async () => {
  const page = await fetch(`${base}/schemes/example`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /SchemeSathi test build/);
  const missing = await fetch(`${base}/api/unknown`);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /application\/json/);
});

test('allows only configured cross-origin callers and reports readiness', async () => {
  const allowed = await fetch(`${base}/api/health`, { headers: { Origin: 'https://schemes.example.org' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://schemes.example.org');
  const denied = await fetch(`${base}/api/health`, { headers: { Origin: 'https://other.example.org' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await fetch(`${base}/api/auth/login`, {
    method: 'OPTIONS', headers: {
      Origin: 'https://schemes.example.org',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(preflight.status, 204);
  ready = false;
  try {
    const unavailable = await fetch(`${base}/api/health`);
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get('cache-control'), 'no-store');
    assert.equal(logs.at(-1).requestId, unavailable.headers.get('x-request-id'));
  } finally {
    ready = true;
  }
});

test('rate limits repeated auth requests but leaves public browsing available', async () => {
  for (let index = 0; index < 20; index += 1) {
    const response = await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    assert.equal(response.status, 400);
  }
  const response = await fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(logs.at(-1).status, 429);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

test('publishes current catalog content for existing scheme IDs and searches it', async (context) => {
  const original = {
    _id: '64f000000000000000000001',
    slug: 'nsap-pension',
    title: { en: 'National Social Assistance Programme' },
    summary: { en: 'Older stored wording' },
    sourceUrl: 'https://nsap.nic.in',
  };
  const custom = { slug: 'custom', title: { en: 'Custom scheme' }, summary: { en: 'Custom summary' } };
  context.mock.method(Scheme, 'find', () => ({ lean: async () => [original, custom] }));
  context.mock.method(Scheme, 'findById', () => ({ lean: async () => original }));
  const response = await fetch(`${base}/api/schemes?q=Samajik`);
  const matches = await response.json();
  assert.equal(matches.length, 1);
  assert.equal(matches[0]._id, original._id);
  assert.match(matches[0].title.en, /Samajik Sahayata/);
  assert.match(matches[0].sourceUrl, /^https:\/\/www\.pib\.gov\.in\//);
  const detail = await fetch(`${base}/api/schemes/${original._id}`);
  const { application, ...schemeDetail } = await detail.json();
  assert.match(application.visit, /Gram Panchayat/);
  assert.deepEqual(schemeDetail, matches[0]);
  assert.equal(original.title.en, 'National Social Assistance Programme');
  const list = await (await fetch(`${base}/api/schemes`)).json();
  assert.deepEqual(list.find((entry) => entry.slug === custom.slug), custom);
});
