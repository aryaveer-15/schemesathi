const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, readFile, readdir, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { csv, exportReviews, linkRows } = require('../scripts/exportReviews');
const { checklist } = require('../scripts/verificationChecklist');
const { inventory } = require('../verificationInventory');
const { dictionaries, languages } = require('../../client/src/locales/index.js');

const report = [
  '# Fixture', '## Needs human check', '### Observed failures',
  '- pm-usp-college-scholarship · https://education.gov.in/missing.pdf · not found 404',
  '- soil-health-card · https://diragri.assam.gov.in/missing · not found 404',
  '### Possible false alarms',
  '- pm-kisan, kisan-credit-card · https://example.gov.in/shared?q=one,two · timeout',
  '### Other issues',
  '- pm-internship · https://example.gov.in/old · redirect 200',
  '## Full link inventory',
  '| soil-health-card | https://example.gov.in/extra | not found 404 |',
].join('\r\n');

function readCsv(buffer) {
  assert.deepEqual([...buffer.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const content = buffer.subarray(3).toString('utf8');
  const rows = [];
  let row = [];
  const fields = /"((?:[^"]|"")*)"(,|\r\n)/gy;
  let length = 0;
  for (const [token, value, separator] of content.matchAll(fields)) {
    length += token.length;
    row.push(value.replaceAll('""', '"'));
    if (separator === '\r\n') {
      rows.push(row);
      row = [];
    }
  }
  assert.equal(length, content.length, 'All CSV bytes were parsed into cells');
  assert.equal(row.length, 0);
  return rows;
}

test('CSV quoting preserves comma, quote, newline, long text, Urdu and Hindi cells in full', () => {
  const text = 'कृपया "आधिकारिक, पेज" देखें।\nاردو میں پوری عبارت۔ ' + 'अ'.repeat(40000);
  const input = [[text, '', 'second, "quoted" cell']];
  const result = csv(input);
  assert.ok(result.includes('""आधिकारिक, पेज""'));
  assert.deepEqual(readCsv(Buffer.from(result, 'utf8')), input);
  assert.throws(() => csv([['=1+1']]), /spreadsheet formula/);
});

test('link rows come only from the human-check list with 404s first and manual columns empty', () => {
  const [header, ...rows] = linkRows(report);
  assert.equal(rows.length, 4);
  assert.equal(header.length, 7);
  assert.deepEqual(rows.map((row) => row[2]), ['Known 404 · not found 404', 'Known 404 · not found 404', 'timeout', 'redirect 200']);
  assert.match(rows[2][0], /PM-KISAN.*Kisan Credit Card/);
  assert.equal(rows[2][1], 'https://example.gov.in/shared?q=one,two');
  assert.ok(rows.every((row) => row.slice(3).every((cell) => cell === '')));
  assert.throws(() => linkRows('## Full link inventory'), /Needs human check/);
});

test('export writes all BOM-encoded files with 51 schemes and complete original language strings', async (context) => {
  const output = await mkdtemp(join(tmpdir(), 'schemesathi-review-export-'));
  context.after(() => rm(output, { recursive: true }));
  assert.equal(await exportReviews({ output, report }), 13);
  assert.equal((await readdir(output)).length, 13);
  const sheet = async (file) => readCsv(await readFile(join(output, file)));
  const [, ...verification] = await sheet('verification.csv');
  const [, ...banners] = await sheet('banners.csv');
  assert.equal(verification.length, 51);
  assert.equal(banners.length, 51);
  const bySlug = new Map(inventory.map(({ scheme }) => [scheme.slug, scheme.title.en]));
  const titles = [...checklist({ entries: {} }).matchAll(/^- Scheme ID · ([a-z0-9-]+)$/gm)].map(([, slug]) => bySlug.get(slug));
  assert.deepEqual(verification.map((row) => row[1]), titles);
  assert.deepEqual(banners.map((row) => row[0]).sort(), titles.slice().sort());
  assert.ok(verification.every((row, index) => row.length === 10 && row[0] === String(index + 1)
    && row.slice(5).every((cell) => cell === '')));
  assert.ok(banners.every((row) => row.length === 7 && row[1].endsWith('.webp') && row[2] && row.slice(3).every((cell) => cell === '')));
  const housing = verification.find((row) => row[1] === bySlug.get('pm-awas-yojana'));
  assert.ok(housing[4].includes(dictionaries.en.housingIncome));
  assert.ok(housing[4].includes('income <= 900_000'));
  assert.ok(verification.some((row) => row[4].includes('"min":18,"max":50,"reviewFrom":50')));
  assert.equal(await sheet('links.csv').then((rows) => rows.length), 5);
  for (const { code } of languages.filter(({ code }) => code !== 'en')) {
    const [, ...rows] = await sheet(`translations_${code}.csv`);
    assert.equal(rows.length, Object.keys(dictionaries.en).length);
    const entries = new Map(rows.map(([language, key, english, translation, ...review]) => {
      assert.equal(language, code);
      assert.equal(english, dictionaries.en[key]);
      assert.equal(translation, dictionaries[code][key]);
      assert.deepEqual(review, ['', '', '', '']);
      return [key, translation];
    }));
    assert.deepEqual(Object.fromEntries(entries), dictionaries[code]);
    assert.ok(rows.findIndex((row) => row[1] === 'housingIncome') < rows.findIndex((row) => row[1] === 'appName'));
  }
  const notes = join(output, 'verification.csv');
  await writeFile(notes, 'Reviewer notes', 'utf8');
  await assert.rejects(exportReviews({ output, report }), /Move your existing review file/);
  assert.equal(await readFile(notes, 'utf8'), 'Reviewer notes');
});
