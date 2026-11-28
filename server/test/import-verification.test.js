const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, readdir, readFile, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { importVerification } = require('../scripts/importVerification');
const { csv, verificationRows } = require('../scripts/exportReviews');
const { bySlug } = require('../verification');

const today = '2026-11-28';
const date = '2026-11-27';
const header = verificationRows()[0];
const columns = new Map(header.map((name, index) => [name, index]));

function sheetRow(slug, updates = {}) {
  const { scheme, fingerprint } = bySlug.get(slug);
  const row = Array(header.length).fill('');
  for (const [name, value] of Object.entries({
    Scheme: scheme.title.en, 'Official value': 'Reviewer-supplied value',
    Matches: 'yes', 'Checked by': 'AB', Date: date, Snapshot: fingerprint,
    ...updates,
  })) row[columns.get(name)] = value;
  return row;
}

async function fixture(t, text) {
  const dir = await mkdtemp(join(tmpdir(), 'schemesathi-import-'));
  t.after(() => rm(dir, { recursive: true }));
  const path = join(dir, 'ledger.json');
  const file = join(dir, 'sheet.csv');
  const messages = [];
  await writeFile(path, '{}\n');
  await writeFile(file, text);
  return {
    dir, path, messages,
    run: (options) => importVerification({ file, ...options }, { path, today, output: (line) => messages.push(line) }),
  };
}

test('dry run shows counts first and a ledger diff, then apply records the selected decisions and preserves Indic notes', async (t) => {
  const notes = '“आधिकारिक”, पेज\nاردو میں نوٹ "جائزہ"';
  const value = 'اصلاح, "नई जानकारी"';
  const rows = [
    sheetRow('pm-kisan', { Matches: ' YeS ', 'Checked by': ' BK ' }),
    sheetRow('pm-awas-yojana', { Matches: 'no', 'Official value': value, Notes: notes }),
    sheetRow('pm-awas-gramin', { Matches: 'UNCLEAR', Notes: notes }),
    sheetRow('ka-shakti'),
  ];
  // Google Sheets can emit unquoted headers, LF row breaks, and no BOM.
  const googleHeader = header.map((cell) => cell.includes(',') ? '"' + cell + '"' : cell).join(',');
  const sheet = googleHeader + '\n' + csv(rows).slice(1).replaceAll('\r\n', '\n').trimEnd();
  const testFile = await fixture(t, sheet);
  const expected = { yes: 1, no: 1, unclear: 1, rejected: 0 };
  assert.deepEqual(testFile.run({ onlyRows: '2,3-4' }), expected);
  assert.match(testFile.messages[0], /\| 1 \| 1 \| 1 \| 0 \|/);
  assert.match(testFile.messages.at(-1), /^--- current server\/verificationRecords\.json/m);
  assert.match(testFile.messages.at(-1), /"by": "BK"/);
  assert.equal(await readFile(testFile.path, 'utf8'), '{}\n');
  assert.deepEqual((await readdir(testFile.dir)).sort(), ['ledger.json', 'sheet.csv']);

  assert.deepEqual(testFile.run({ onlyRows: '2-4', apply: true }), expected);
  const data = JSON.parse(await readFile(testFile.path, 'utf8'));
  assert.deepEqual(Object.keys(data).sort(), ['pm-awas-gramin', 'pm-awas-yojana', 'pm-kisan']);
  assert.deepEqual(data['pm-kisan'].review, { by: 'BK', date, matches: 'yes', fingerprint: bySlug.get('pm-kisan').fingerprint });
  assert.deepEqual(data['pm-awas-yojana'].review.proposedCorrection, { field: 'Official value', value });
  assert.equal(data['pm-awas-yojana'].review.notes, notes);
  assert.equal(data['pm-awas-gramin'].review.matches, 'unclear');
  assert.equal(data['pm-awas-gramin'].review.proposedCorrection.value, 'Reviewer-supplied value');
  assert.equal(data['pm-awas-gramin'].review.notes, notes);
});

test('invalid rows are rejected individually and apply writes only valid rows', async (t) => {
  const cases = [
    ['pm-kisan', { 'Checked by': '' }, /Checked by/],
    ['pm-awas-yojana', { Date: '' }, /Date are required/],
    ['pm-awas-gramin', { Snapshot: 'wrong' }, /changed after the reviewer checked/],
    ['ka-shakti', { Scheme: 'Unknown Scheme' }, /Unknown or ambiguous/],
    ['pm-mudra-yojana', { 'Official value': ' ' }, /Suspicious yes/],
    ['pm-ujjwala-yojana', { Matches: 'yes, verified' }, /exactly yes, no or unclear/],
    ['atal-pension-yojana', { Snapshot: '' }, /Snapshot missing or stale/],
    ['sukanya-samriddhi-yojana', { Date: '2026-02-30' }, /non-future review date/],
    ['nps-vatsalya', { 'Checked by': 'Full Name' }, /reviewer initials/],
  ];
  const rows = cases.map(([slug, changes]) => sheetRow(slug, changes));
  rows.push(sheetRow('pm-surya-ghar', { Matches: 'unclear', 'Official value': '' }));
  const testFile = await fixture(t, csv([header, ...rows]));
  assert.deepEqual(testFile.run({ apply: true }), { yes: 0, no: 0, unclear: 1, rejected: cases.length });
  cases.forEach(([, , reason], index) => {
    assert.ok(testFile.messages.some((line) => line.startsWith('Row ' + (index + 2) + ' rejected.') && reason.test(line)));
  });
  const data = JSON.parse(await readFile(testFile.path, 'utf8'));
  assert.deepEqual(Object.keys(data), ['pm-surya-ghar']);
  assert.equal(data['pm-surya-ghar'].review.proposedCorrection, undefined);
});

test('old exports, duplicate rows, invalid row selections and malformed quoting cannot change the ledger', async (t) => {
  const row = sheetRow('pm-kisan');
  const old = await fixture(t, csv([header.slice(0, -1), row.slice(0, -1)]));
  assert.equal(old.run({ apply: true }).rejected, 1);
  assert.ok(old.messages.some((line) => /Snapshot missing or stale/.test(line)));
  assert.equal(await readFile(old.path, 'utf8'), '{}\n');

  const duplicate = await fixture(t, csv([header, row, row]));
  assert.equal(duplicate.run({ apply: true }).rejected, 2);
  assert.throws(() => duplicate.run({ onlyRows: '1,2-3' }), /sheet row numbers/);
  assert.equal(await readFile(duplicate.path, 'utf8'), '{}\n');
  assert.equal(duplicate.run({ onlyRows: '3', apply: true }).yes, 1);

  const malformed = await fixture(t, header.join(',') + '\n"unclosed');
  assert.throws(() => malformed.run({ apply: true }), /Invalid CSV quoting/);
  assert.equal(await readFile(malformed.path, 'utf8'), '{}\n');
});
