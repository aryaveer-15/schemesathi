const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test, before, after } = require('node:test');
const { mkdir, mkdtemp, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const createApp = require('../app');
const Scheme = require('../models/Scheme');
const verificationRecords = require('../verificationRecords.json');
const { bySlug } = require('../verification');

const logs = [];
let base;
let server;
let staticDir;
let ready = true;

before(async () => {
  staticDir = await mkdtemp(path.join(os.tmpdir(), 'schemesathi-release-'));
  await writeFile(path.join(staticDir, 'index.html'), '<title>SchemeSathi test build</title>');
  await mkdir(path.join(staticDir, 'assets'));
  await writeFile(path.join(staticDir, 'assets', 'Page-aBcd1234.js'), 'console.log("fixture");'.repeat(256));
  await writeFile(path.join(staticDir, 'assets', 'plain.js'), 'console.log("unhashed fixture");');
  const app = createApp({
    staticDir,
    siteOrigin: 'https://schemes.example.org',
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
  assert.equal(page.status, 404);
  assert.match(await page.text(), /<title>SchemeSathi<\/title>/);
  const missing = await fetch(`${base}/api/unknown`);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /application\/json/);
});

test('revalidates the app shell, serves compressed immutable hashes and rejects old chunks', async () => {
  for (const route of ['/', '/schemes/pm-surya-ghar', '/index.html']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.headers.get('cache-control'), 'no-cache', route);
    assert.equal(response.status, 200, route);
    const validate = await fetch(`${base}${route}`, {
      headers: { 'if-none-match': response.headers.get('etag'), 'cache-control': 'max-age=0' },
    });
    assert.equal(validate.status, 304, route);
    assert.equal(validate.headers.get('cache-control'), 'no-cache', route);
  }
  const asset = await fetch(`${base}/assets/Page-aBcd1234.js`, { headers: { 'Accept-Encoding': 'br, gzip' } });
  assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(asset.headers.get('content-encoding'), 'br');
  assert.match(asset.headers.get('vary'), /Accept-Encoding/i);
  assert.match(await asset.text(), /console.log/);
  const plain = await fetch(`${base}/assets/plain.js`);
  assert.doesNotMatch(plain.headers.get('cache-control'), /immutable/);
  const missing = await fetch(`${base}/assets/Old-bbcd1234.js`);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(await missing.text(), /SchemeSathi test build/);
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
    const live = await fetch(`${base}/api/health/live`);
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: 'ok' });
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
  assert.deepEqual(list.find((entry) => entry.slug === custom.slug), { ...custom, lastVerifiedAt: null, bannerDisabled: false });
});

test('scheme details expose a review date, an explicit unreviewed state and verification notes', async (context) => {
  const id = '64f000000000000000000001';
  const verified = new Date('2026-11-25T00:00:00.000Z');
  const slugWithReview = 'ayushman-bharat-pmjay';
  const original = verificationRecords[slugWithReview];
  verificationRecords[slugWithReview] = {
    bannerDisabled: true,
    review: { matches: 'yes', date: '2026-11-24', fingerprint: bySlug.get(slugWithReview).fingerprint },
  };
  context.after(() => {
    if (original === undefined) delete verificationRecords[slugWithReview];
    else verificationRecords[slugWithReview] = original;
  });
  assert.equal(new Scheme().lastVerifiedAt, null);
  let stored;
  context.mock.method(Scheme, 'findById', () => ({ lean: async () => stored }));
  for (const [slug, date, expectedKind] of [
    ['pm-awas-gramin', undefined, 'list-and-local'],
    ['ayushman-bharat-pmjay', verified, 'list'],
    ['janani-suraksha', null, 'local'],
    ['jan-aushadhi', undefined, null],
  ]) {
    stored = { _id: id, slug, lastVerifiedAt: date, updatedAt: verified };
    const response = await fetch(`${base}/api/schemes/${id}`);
    assert.equal(response.status, 200);
    const details = await response.json();
    assert.equal(details.lastVerifiedAt, slug === slugWithReview ? '2026-11-24' : null, slug);
    assert.equal(details.bannerDisabled, slug === slugWithReview, slug);
    assert.equal(details.verificationKind, expectedKind, slug);
  }
});

test('serves a stable scheme slug alongside existing ObjectId URLs', async (context) => {
  const entry = { _id: '64f000000000000000000001', slug: 'pm-surya-ghar' };
  const lookedUp = [];
  context.mock.method(Scheme, 'findOne', ({ slug }) => ({ lean: async () => {
    lookedUp.push(slug);
    return slug === entry.slug ? entry : null;
  } }));
  context.mock.method(Scheme, 'findById', (id) => ({ lean: async () => id === entry._id ? entry : null }));
  const slugResponse = await fetch(`${base}/api/schemes/${entry.slug}`);
  const legacyResponse = await fetch(`${base}/api/schemes/${entry._id}`);
  assert.equal(slugResponse.status, 200);
  assert.equal(legacyResponse.status, 200);
  assert.deepEqual(await slugResponse.json(), await legacyResponse.json());
  assert.equal((await fetch(`${base}/api/schemes/unknown-scheme`)).status, 404);
  assert.equal((await fetch(`${base}/api/schemes/%24ne`)).status, 400);
  assert.deepEqual(lookedUp, [entry.slug, 'unknown-scheme']);
});

test('raw scheme HTML contains stable catalogue tags and unknown URLs return a generic app with 404', async () => {
  const current = require('../catalog').find(({ slug }) => slug === 'pm-surya-ghar');
  const response = await fetch(`${base}/schemes/${current.slug}`, { headers: { 'X-Forwarded-Host': 'untrusted.example' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-cache');
  const html = await response.text();
  assert.ok(html.includes('<title>' + current.title.en + ' | SchemeSathi</title>'));
  assert.ok(html.includes('property="og:description" content="' + current.summary.en + '"'));
  assert.ok(html.includes('property="og:url" content="https://schemes.example.org/schemes/pm-surya-ghar"'));
  assert.ok(!html.includes('untrusted.example'));
  const unknown = await fetch(`${base}/schemes/nonexistent-scheme`);
  assert.equal(unknown.status, 404);
  assert.equal(unknown.headers.get('cache-control'), 'no-cache');
  const generic = await unknown.text();
  assert.match(generic, /property="og:title" content="SchemeSathi"/);
  assert.doesNotMatch(generic, /nonexistent-scheme|property="og:url"/);
});
