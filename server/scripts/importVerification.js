const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseArgs } = require('node:util');
const { parseSheet } = require('./reviewCsv');
const { inventory } = require('../verificationInventory');
const { proposedRecords } = require('./recordVerification');
const ledgerDiff = require('./ledgerDiff');
const updateLedger = require('./updateLedger');
const defaultLedger = resolve(__dirname, '../verificationRecords.json');

const schemes = new Map();
for (const entry of inventory) {
  const title = entry.scheme.title.en;
  const entries = schemes.get(title) ?? [];
  entries.push(entry);
  schemes.set(title, entries);
}

function selectedRows(selection, lastRow) {
  if (selection === undefined) return () => true;
  const ranges = selection.split(',').map((part) => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    const first = Number(match?.[1]);
    const last = Number(match?.[2] ?? match?.[1]);
    if (!match || first < 2 || last < first || last > lastRow) {
      throw new Error('Use --only-rows with sheet row numbers from 2 through ' + lastRow + ', such as 2,4-6.');
    }
    return [first, last];
  });
  return (number) => ranges.some(([first, last]) => number >= first && number <= last);
}

function reviewRows(text, onlyRows) {
  const [header = [], ...rows] = parseSheet(text);
  const columns = header.map((name) => name.trim());
  if (new Set(columns).size !== columns.length || !['Scheme', 'Official value', 'Matches', 'Notes', 'Checked by', 'Date']
    .every((name) => columns.includes(name))) {
    throw new Error('Use a verification.csv sheet with its original, unique column headers.');
  }
  const selected = selectedRows(onlyRows, rows.length + 1);
  return rows.map((cells, index) => ({ cells, number: index + 2 }))
    .filter(({ cells, number }) => selected(number) && cells.some((cell) => cell.trim()))
    .map(({ cells, number }) => ({
      number,
      validWidth: cells.length === columns.length,
      get: (name) => cells[columns.indexOf(name)] ?? '',
    }));
}

function reviewOptions({ get, validWidth }) {
  const title = get('Scheme').trim();
  const entries = schemes.get(title);
  if (!entries || entries.length !== 1) throw new Error('Unknown or ambiguous maintained scheme name.');
  const [{ scheme, fingerprint }] = entries;
  const snapshot = get('Snapshot').trim();
  if (snapshot !== fingerprint) {
    throw new Error('Snapshot missing or stale. The data may have changed after the reviewer checked it. Compare the reviewed version before retrying.');
  }
  if (!validWidth) throw new Error('Column count differs from the header.');
  const matches = get('Matches').trim().toLowerCase();
  if (!['yes', 'no', 'unclear'].includes(matches)) throw new Error('Matches must be exactly yes, no or unclear.');
  const by = get('Checked by').trim();
  const date = get('Date').trim();
  if (!by || !date) throw new Error('Checked by (reviewer initials) and Date are required.');
  const value = get('Official value');
  if (matches === 'yes' && !value.trim()) {
    throw new Error('Suspicious yes with an empty Official value. Ask the reviewer to supply it.');
  }
  const correction = matches !== 'yes' && value.trim() ? { field: 'Official value', value } : {};
  return { scheme: scheme.slug, snapshot, matches, by, date, notes: get('Notes'), ...correction };
}

function importVerification({ file, onlyRows, apply }, { path = defaultLedger, output = console.log, today } = {}) {
  if (!file) throw new Error('Provide the returned CSV path with --file.');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file));
  const rows = reviewRows(text, onlyRows);
  const counts = { yes: 0, no: 0, unclear: 0, rejected: 0 };
  const rejected = [];
  const names = new Map();
  for (const row of rows) {
    const title = row.get('Scheme').trim();
    names.set(title, (names.get(title) ?? 0) + 1);
  }
  updateLedger(apply, (before) => {
    let after = before;
    for (const row of rows) {
      try {
        const options = reviewOptions(row);
        if (names.get(row.get('Scheme').trim()) > 1) {
          throw new Error('Scheme appears more than once in this batch. Select one reviewed row per scheme.');
        }
        after = proposedRecords(after, options, today);
        counts[options.matches]++;
      } catch (error) {
        counts.rejected++;
        rejected.push('Row ' + row.number + ' rejected. ' + error.message);
      }
    }
    const sorted = Object.fromEntries(Object.entries(after).sort(([a], [b]) => a.localeCompare(b)));
    if (JSON.stringify(sorted) === JSON.stringify(before)) after = before;
    else if (after !== before) after = sorted;
    output(['| Yes | No | Unclear | Rejected |', '| ---: | ---: | ---: | ---: |',
      '| ' + Object.values(counts).join(' | ') + ' |'].join('\n'));
    for (const message of rejected) output(message);
    output(ledgerDiff(before, after, 'server/verificationRecords.json'));
    return after;
  }, path);
  return counts;
}

if (require.main === module) {
  try {
    const { values } = parseArgs({ options: {
      file: { type: 'string' }, 'only-rows': { type: 'string' }, apply: { type: 'boolean', default: false },
    } });
    const file = values.file && resolve(process.env.INIT_CWD || process.cwd(), values.file);
    importVerification({ file, onlyRows: values['only-rows'], apply: values.apply });
    console.log(values.apply ? 'Import complete. Only accepted rows were saved.' : 'Preview only. Add --apply to save accepted rows.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { importVerification };
