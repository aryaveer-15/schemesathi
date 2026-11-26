const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const catalog = require('../catalog');
const { bySlug, verificationFor } = require('../verification');
const { proposedRecords, record } = require('../scripts/recordVerification');
const { checklist } = require('../scripts/verificationChecklist');
const { readSource } = require('../scripts/verificationExcerpts');
const { formatReport } = require('../scripts/checkSchemeLinks');

const scheme = 'pm-awas-yojana';
const review = { scheme, date: '2026-11-25', by: 'AB', matches: 'yes' };
const today = '2026-11-26';

test('the checklist includes one section per maintained scheme, with exact rules and labelled sources', () => {
  const report = checklist({ entries: {} });
  assert.equal(report.split(/^## /m).length - 1, 51);
  const schemeSections = report.split(/^## /m).slice(1);
  for (const { slug, sourceUrl } of catalog) {
    const sections = schemeSections.filter((section) => section.includes(`Scheme ID · ${slug}\n`));
    assert.equal(sections.length, 1, slug);
    assert.ok(sections[0].includes(`<${sourceUrl}>`), slug);
    for (const key of bySlug.get(slug).criteria) assert.ok(sections[0].includes(JSON.stringify(key.values)), key.key);
    assert.ok(sections[0].includes('Matches official source · yes / no / unclear'), slug);
  }
  assert.match(report, /income <= 900_000/);
  assert.match(report, /"min":18,"max":50,"reviewFrom":50/);
  assert.match(report, /Age in completed years/);
  assert.match(report, /PMJJBY consent and declaration form/);
  assert.match(report, /Listed as public access/);
  assert.ok(report.lastIndexOf('Review priority · Age, income or financial values')
    < report.indexOf('Review priority · Other criteria'));
});

test('the checklist labels unverified excerpts, suppresses markup and quotes a shared source once', () => {
  const sample = 'The income amount depends on the intake. <script>alert(1)</script>';
  const url = 'https://scheme.gov.in/details';
  const excerpts = new Map(['pm-ujjwala-yojana', 'pm-kisan'].map((slug) => [slug, [{ url, sample }]]));
  const report = checklist({ entries: {}, excerpts });
  assert.match(report, /Unverified official-source excerpt/);
  assert.equal(report.split('The income amount depends on the intake.').length, 2);
  assert.match(report, /Shared source/);
  assert.doesNotMatch(report, /<script>/);
  assert.doesNotMatch(report, /Verified on · 20/);
});

test('the official-page reader extracts bounded text, skips scripts and rejects unknown redirect hosts', async () => {
  const url = 'https://scheme.gov.in/start';
  const allowed = new Set(['scheme.gov.in']);
  const body = '<script>Income 123456789 is not shown here.</script><main><p>The annual income limit is &#8377;5 lakh for the pilot scheme and depends on the official route in the published scheme guidelines for this window.</p></main>';
  const result = await readSource(url, allowed, async () => new Response(body, { headers: { 'content-type': 'text/html' } }));
  assert.match(result.sample, /annual income limit is ₹5 lakh/);
  assert.doesNotMatch(result.sample, /123456789/);
  assert.ok(result.sample.replaceAll('…', '').trim().split(/\s+/).length <= 24);
  const redirected = await readSource(url, allowed, async () =>
    new Response(null, { status: 301, headers: { location: 'https://outside.gov.in/redirect' } }));
  assert.equal(redirected.sample, undefined);
  assert.match(redirected.issue, /outside the published source list/);
});

test('verification preview shows a diff without writing, and apply writes only the ledger', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'schemesathi-review-'));
  context.after(() => rm(directory, { recursive: true }));
  const path = join(directory, 'verificationRecords.json');
  await writeFile(path, '{}\n');
  const diffs = [];
  const options = { path, output: (text) => diffs.push(text), today };
  record(review, options);
  assert.equal(await readFile(path, 'utf8'), '{}\n');
  assert.match(diffs[0], /^--- current verification record/m);
  assert.match(diffs[0], /^\+\s+"by": "AB"/m);
  record({ ...review, apply: true }, options);
  const entries = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(verificationFor(scheme, entries).lastVerifiedAt, '2026-11-25');
});

test('unclear, negative and stale reviews never show a verification date, and corrections remain proposals', () => {
  for (const matches of ['no', 'unclear']) {
    const entries = proposedRecords({}, { ...review, matches, field: 'housingIncome', value: 'reviewer-supplied text' }, today);
    assert.equal(verificationFor(scheme, entries).lastVerifiedAt, null);
    assert.equal(entries[scheme].review.proposedCorrection.value, 'reviewer-supplied text');
  }
  const entries = proposedRecords({}, review, today);
  entries[scheme].review.fingerprint = 'stale';
  assert.equal(verificationFor(scheme, entries).lastVerifiedAt, null);
  assert.throws(() => proposedRecords({}, { ...review, date: '2026-02-30' }, today), /valid/);
  assert.throws(() => proposedRecords({}, { ...review, date: '2026-11-27' }, today), /non-future/);
  assert.throws(() => proposedRecords({}, { ...review, field: 'income', value: 'reviewer-supplied text' }, today), /no or unclear/);
  assert.throws(() => proposedRecords({}, { ...review, scheme: 'unknown' }, today), /maintained scheme ID/);
  assert.throws(() => proposedRecords({}, { ...review, snapshot: 'old-checklist' }, today), /snapshot ID changed/);
});

test('the optional banner flag is independent of the reviewer and verification date', () => {
  const reviewed = proposedRecords({}, review, today);
  const off = proposedRecords(reviewed, { scheme, banner: 'off' });
  assert.deepEqual(verificationFor(scheme, off), { bannerDisabled: true, lastVerifiedAt: review.date });
  const on = proposedRecords(off, { scheme, banner: 'on' });
  assert.deepEqual(verificationFor(scheme, on), { bannerDisabled: false, lastVerifiedAt: review.date });
});

test('the human link report groups observed failures, possible false alarms and redirects', () => {
  const results = [
    ['missing', 'not found', '', [404]], ['removed-host', 'request failed', 'ENOTFOUND', []],
    ['slow', 'timeout', '', []], ['bot-block', 'access restricted', '', [403]],
    ['cert', 'request failed', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', []],
    ['moved', 'reachable', '', [301, 200]],
  ].map(([slug, outcome, detail, statuses]) => ({
    outcome, detail, chain: statuses.map((status) => ({ status, url: 'https://scheme.gov.in' })),
    references: [{ slug, field: 'sourceUrl', originalUrl: `https://scheme.gov.in/${slug}` }],
  }));
  const [failures, possible, other] = formatReport(results, new Date()).split('### ').slice(1);
  for (const name of ['missing', 'removed-host']) assert.ok(failures.includes(name));
  for (const name of ['slow', 'bot-block', 'cert']) assert.ok(possible.includes(name));
  assert.ok(other.includes('moved'));
});
