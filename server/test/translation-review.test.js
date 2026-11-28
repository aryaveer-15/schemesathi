const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { dictionaries, getText } = require('../../client/src/locales/index.js');
const { approvedText } = require('../../client/src/locales/reviewedText.js');
const { csv } = require('../scripts/exportReviews');
const { parseSheet } = require('../scripts/reviewCsv');
const { critical, interfaceText } = require('../scripts/translationInventory');
const { exportCritical, importTranslations, protectTranslation } = require('../scripts/reviewTranslations');

async function fixture(context) {
  const dir = await mkdtemp(join(tmpdir(), 'schemesathi-translation-review-'));
  context.after(() => rm(dir, { recursive: true }));
  const path = join(dir, 'approvals.json');
  const file = join(dir, 'review.csv');
  const messages = [];
  await writeFile(path, '{}\n');
  return { path, file, messages, run: (lang, apply) =>
    importTranslations({ file, lang, apply }, { path, output: (line) => messages.push(line) }) };
}

test('critical export includes every source, starts blank and is UTF-8 with BOM', async (context) => {
  const { file } = await fixture(context);
  assert.equal(critical.size, 367);
  assert.equal(interfaceText.size, 120);
  assert.equal(exportCritical({ lang: 'ur', output: file }), critical.size);
  const bytes = await readFile(file);
  assert.deepEqual([...bytes.subarray(0, 3)], [239, 187, 191]);
  const [header, ...rows] = parseSheet(bytes.toString('utf8'));
  assert.equal(header.at(-1), 'Date');
  assert.deepEqual(new Map(rows.map((row) => [row[1], row[2]])), critical);
  assert.ok(rows.every((row) => row[0] === 'ur' && row.slice(3).every((cell) => cell === '')));
  for (const prefix of ['question.', 'summary.', 'criterion.', 'application.', 'result.', 'document.']) {
    assert.ok(rows.some((row) => row[1].startsWith(prefix)), prefix);
  }
  assert.throws(() => exportCritical({ lang: 'ur', output: file }), { code: 'EEXIST' });
});

for (const lang of ['hi', 'ta', 'kn', 'ur']) {
  test(lang + ' review round trip gates critical copy and rejects stale English', async (context) => {
    const item = await fixture(context);
    exportCritical({ lang, output: item.file });
    const [header] = parseSheet(await readFile(item.file, 'utf8'));
    const source = dictionaries.en.ageRequired;
    const candidate = dictionaries[lang].browse + ' ' + source;
    const name = { hi: 'आरती', ta: 'மாலா', kn: 'ಮಾಲಾ', ur: 'عالیہ' }[lang];
    const date = '2026-11-28';
    const rows = [
      [lang, 'ageRequired', source, '', 'Corrected', candidate, name, date],
      [lang, 'browse', dictionaries.en.browse, dictionaries[lang].browse, 'OK', '', name, date],
    ];
    await writeFile(item.file, csv([header, ...rows]), 'utf8');
    const expected = { lang, ok: 1, corrected: 1, rejected: 0, skipped: 0 };
    assert.deepEqual(item.run(lang), expected);
    assert.match(item.messages[0], /\| 1 \| 1 \| 0 \| 0 \|/);
    assert.match(item.messages.at(-1), /\+\+\+ proposed server\/translationApprovals\.json/);
    assert.equal(await readFile(item.path, 'utf8'), '{}\n');
    assert.equal(getText(lang, 'ageRequired', {}), source);
    assert.deepEqual(item.run(lang, true), expected);
    const approvals = JSON.parse(await readFile(item.path, 'utf8'));
    assert.deepEqual(approvals[lang].ageRequired, { language: lang, reviewer: name, date, english: source, text: candidate });
    assert.equal(getText(lang, 'ageRequired', approvals), candidate);
    assert.equal(getText('en', 'ageRequired', approvals), source);
    assert.equal(approvedText(lang, 'ageRequired', source + ' Changed.', approvals), null);
    approvals[lang].ageRequired.english = 'Older source';
    approvals[lang].browse.english = 'Older link label';
    assert.equal(getText(lang, 'ageRequired', approvals), source);
    assert.equal(getText(lang, 'browse', approvals), dictionaries.en.browse);
  });
}

test('rejects invalid status, absent metadata, stale copy, changed numbers and missing placeholders per row', async (context) => {
  const item = await fixture(context);
  exportCritical({ lang: 'hi', output: item.file });
  const [header] = parseSheet(await readFile(item.file, 'utf8'));
  const row = (key, text, overrides = {}) => Object.assign([
    'hi', key, critical.get(key) ?? dictionaries.en[key], '', 'Corrected', text, 'आरती', '2026-11-28',
  ], overrides);
  const rows = [
    row('healthScope', critical.get('healthScope').replace('70', '71')),
    row('ageRange', critical.get('ageRange').replace('{min}', '')),
    row('browse', dictionaries.hi.browse, { 4: 'Approved' }),
    row('login', dictionaries.hi.login, { 6: '' }),
    row('register', dictionaries.hi.register, { 7: '' }),
    row('disclaimer', 'old', { 2: 'previous English' }),
    row('schemeChat', '', { 4: 'OK', 3: 'edited Current translation' }),
  ];
  await writeFile(item.file, csv([header, ...rows]), 'utf8');
  assert.deepEqual(item.run('hi', true), { lang: 'hi', ok: 0, corrected: 0, rejected: rows.length, skipped: 0 });
  for (let index = 0; index < rows.length; index++) {
    assert.ok(item.messages.some((entry) => entry.startsWith('Row ' + (index + 2) + ' rejected.')));
  }
  assert.equal(await readFile(item.path, 'utf8'), '{}\n');
});

test('protected tokens detect edits to literal URLs, currency, limits, names and identifiers', () => {
  const source = 'AICTE Pragati Scholarship: ₹20 lakh from ages 18–40. Read {officialUrl} or https://example.gov.in/form.';
  for (const edited of [
    source.replace('/form', '/new'), source.replace('{officialUrl}', '{portal}'),
    source.replace('₹', '$'), source.replace('lakh', 'crore'),
    source.replace('18–40', '40–18'), source.replace('AICTE Pragati', 'AICTE Saksham'),
  ]) assert.throws(() => protectTranslation(source, edited), /must match the English source/);
  assert.doesNotThrow(() => protectTranslation(source, source));
});
