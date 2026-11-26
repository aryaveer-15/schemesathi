const assert = require('node:assert/strict');
const { test } = require('node:test');
const { collectLinks, checkLink, formatReport } = require('../scripts/checkSchemeLinks');
const catalog = require('../catalog');

test('the link inventory covers all 51 schemes and preserves every URL reference', async () => {
  const links = await collectLinks();
  const references = links.flatMap((link) => link.references);
  assert.equal(catalog.length, 51);
  assert.deepEqual(references.filter(({ field }) => field === 'sourceUrl')
    .map(({ slug }) => slug).sort(), catalog.map(({ slug }) => slug).sort());
  assert.equal(new Set(links.map(({ url }) => url)).size, links.length);
  assert.ok(links.find(({ url }) => url === 'https://scholarships.gov.in/All-Scholarships')
    .references.some(({ slug, field }) => slug === 'aicte-swanath' && field === 'application.url'));
  for (const [slug, field] of [
    ['pm-surya-ghar', 'eligibilitySourceUrl'], ['pm-kisan', 'legacyCheck.sourceUrl'],
    ['odisha-subhadra', 'profileCheck.sourceUrl'], ['pm-vishwakarma', 'questionnaire.sourceUrl'],
  ]) {
    assert.ok(references.some((ref) => ref.slug === slug && ref.field === field), field);
  }
});

const initialUrl = 'https://scheme.gov.in/start';

test('the checker follows redirects and records original locations and response codes', async () => {
  const responses = new Map([
    [initialUrl, new Response(null, { status: 301, headers: { location: '/current' } })],
    ['https://scheme.gov.in/current', new Response(null, { status: 302, headers: { location: 'https://other.gov.in/details' } })],
    ['https://other.gov.in/details', new Response('page', { status: 200 })],
  ]);
  const result = await checkLink(initialUrl, {
    request: async (url, options) => {
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'manual');
      assert.ok(options.signal instanceof AbortSignal);
      return responses.get(url);
    },
  });
  assert.equal(result.outcome, 'reachable');
  assert.deepEqual(result.chain.map(({ status }) => status), [301, 302, 200]);
  assert.equal(result.chain[0].location, '/current');
  assert.equal(result.chain.at(-1).url, 'https://other.gov.in/details');
  assert.equal(responses.get('https://other.gov.in/details').bodyUsed, true);
});

test('the checker distinguishes HTTP failures, restrictions, timeouts and TLS errors', async () => {
  for (const [status, outcome] of [[404, 'not found'], [410, 'not found'], [403, 'access restricted'],
    [429, 'access restricted'], [503, 'HTTP error']]) {
    const result = await checkLink(initialUrl, { request: async () => new Response(null, { status }) });
    assert.equal(result.outcome, outcome);
    assert.equal(result.chain[0].status, status);
  }
  const tls = await checkLink(initialUrl, {
    request: async () => { throw new Error('fetch failed', { cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } }); },
  });
  assert.deepEqual(tls, { outcome: 'request failed', detail: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', chain: [] });
  const controller = new AbortController();
  const timeout = await checkLink(initialUrl, {
    signal: controller.signal,
    request: async (_url, { signal }) => { controller.abort(); signal.throwIfAborted(); },
  });
  assert.equal(timeout.outcome, 'timeout');
});

test('the checker stops at redirect loops, hop limits and unsupported destinations', async () => {
  for (const [location, expected] of [
    ['/start#section', 'redirect loop'], ['file:///test', 'unsupported target'],
    ['https://127.0.0.1/', 'unsupported target'], ['http://scheme.gov.in/', 'unsupported target'],
    ['https://[invalid', 'invalid redirect destination'], [null, 'redirect missing destination'],
  ]) {
    let calls = 0;
    const result = await checkLink(initialUrl, {
      request: async () => {
        calls++;
        return new Response(null, { status: 302, headers: location ? { location } : {} });
      },
    });
    assert.equal(result.outcome, expected);
    assert.equal(calls, 1);
  }
  let calls = 0;
  const result = await checkLink(initialUrl, {
    request: async () => new Response(null, { status: 302, headers: { location: `/${++calls}` } }),
  });
  assert.equal(result.outcome, 'redirect limit');
  assert.equal(calls, 6);
});

test('the report includes every published reference and reviewable redirect', async () => {
  const report = formatReport([{
    outcome: 'reachable',
    chain: [{ url: initialUrl, status: 301, location: '/new' }, { url: 'https://scheme.gov.in/new', status: 200 }],
    references: [
      { slug: 'scheme-one', field: 'sourceUrl', originalUrl: initialUrl },
      { slug: 'scheme-two', field: 'application.url', originalUrl: initialUrl },
    ],
  }], new Date('2026-01-01T00:00:00.000Z'));
  assert.match(report, /2 schemes, 1 unique URLs, 1 URLs to review/);
  assert.ok(report.includes('301 https://scheme.gov.in/start → /new'));
  assert.ok(report.includes('| scheme-two | application.url |'));
});
