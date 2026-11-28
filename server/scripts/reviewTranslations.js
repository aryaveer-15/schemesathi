const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const { parseArgs } = require('node:util');
const { dictionaries } = require('../../client/src/locales/index.js');
const { approvedText } = require('../../client/src/locales/reviewedText.js');
const { schemeAliases } = require('../../client/src/searchTerms.js');
const catalog = require('../catalog');
const { csv } = require('./exportReviews');
const { parseSheet } = require('./reviewCsv');
const updateLedger = require('./updateLedger');
const ledgerDiff = require('./ledgerDiff');
const { critical, sources } = require('./translationInventory');

const ledger = resolve(__dirname, '../translationApprovals.json');
const columns = ['Language', 'Key', 'English text', 'Current translation', 'OK or Corrected',
  'Corrected text', 'Reviewer', 'Date'];
const schemeNames = [...new Set(catalog.flatMap(({ title, slug }) => [
  title.en, ...title.en.split(/[()–]/u),
  title.en.replace(/\s+(?:Scholarship|Scheme|Yojana|Programme)$/u, ''),
  ...(schemeAliases[slug] ?? []),
]).map((name) => name.trim()).filter((name) => name.length >= 3))].map((name) => {
  const escaped = [...name].map((char) => '.*+?^$(){}[]|\\'.includes(char) ? '\\' + char : char).join('');
  return new RegExp('(?<![\\p{L}\\p{N}])' + escaped + '(?![\\p{L}\\p{N}])', 'giu');
});

function protectTranslation(english, text) {
  const tokens = (value) => {
    const literals = value.match(/https?:\/\/[^\s<>()]+|www\.[^\s<>()]+|\{[^{}\s]+\}|[₹$€£%]|\p{Nd}+(?:[.,]\p{Nd}+)*|\b(?:INR|Rs\.?|lakhs?|crores?)\b/giu) ?? [];
    const names = schemeNames.flatMap((pattern) => value.match(pattern) ?? []);
    const abbreviations = value.match(/\b[A-Z]{2,}(?:-[A-Z]+)*\b/g) ?? [];
    return JSON.stringify([literals, [...names, ...abbreviations].sort()]);
  };
  if (tokens(english) !== tokens(text)) {
    throw new Error('Numbers, amounts, catalogue names, abbreviations, and links or placeholders must match the English source.');
  }
}

function languageCode(lang) {
  if (lang === 'en' || !Object.hasOwn(dictionaries, lang)) throw new Error('Use one supported non-English language code.');
  return lang;
}

function exportCritical({ lang, output, approvals = {} }) {
  languageCode(lang);
  const rows = [...critical].map(([key, english]) => [
    lang, key, english, approvedText(lang, key, english, approvals) ?? '', '', '', '', '',
  ]);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, csv([columns, ...rows]), { flag: 'wx' });
  return rows.length;
}

function loadReview(row, lang, stored) {
  if (row.length !== columns.length) throw new Error('Column count differs from the header.');
  const [code, rawKey, english, current, rawStatus, corrected, rawReviewer, rawDate] = row;
  if (code.trim() !== lang) throw new Error('The language differs from the selected language.');
  const key = rawKey.trim();
  if (!sources.has(key)) throw new Error('Unknown review key.');
  if (english !== sources.get(key)) throw new Error('The English source changed. Export and review the current text.');
  const status = rawStatus.trim().toLowerCase();
  if (!['ok', 'corrected'].includes(status)) throw new Error('Status must be OK or Corrected.');
  const reviewer = rawReviewer.trim();
  const date = rawDate.trim();
  const parsedDate = new Date(date);
  if (!/^[\p{L}][\p{L}\p{M} .’'-]{0,119}$/u.test(reviewer)
    || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error('Provide a reviewer name and a valid date in YYYY-MM-DD format.');
  }
  const currentSource = approvedText(lang, key, english, stored) ?? dictionaries[lang][key];
  if (status === 'ok' && current !== currentSource) {
    throw new Error('Current translation differs from the exported text. Use Corrected and supply the reviewed text.');
  }
  const text = (status === 'ok' ? current : corrected).trim();
  if (!text) throw new Error('Reviewed translation is empty.');
  protectTranslation(english, text);
  return { key, status, record: { language: lang, reviewer, date, english, text } };
}

function importTranslations({ file, lang, apply }, { path = ledger, output = console.log } = {}) {
  const sheet = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file));
  const [header = [], ...rows] = parseSheet(sheet);
  if (JSON.stringify(header) !== JSON.stringify(columns)) throw new Error('Keep the original translation CSV headers.');
  lang = languageCode(lang ?? rows.find((row) => row[0]?.trim())?.[0].trim());
  const counts = { ok: 0, corrected: 0, rejected: 0, skipped: 0 };
  const reviewKeys = new Map();
  for (const row of rows.filter((row) => row[0]?.trim() === lang && row[4]?.trim())) {
    const key = row[1]?.trim();
    reviewKeys.set(key, (reviewKeys.get(key) ?? 0) + 1);
  }
  updateLedger(apply, (before) => {
    const accepted = new Map();
    const rejected = [];
    for (const [index, row] of rows.entries()) {
      try {
        if (row.every((cell) => !cell.trim())) continue;
        if (row[0].trim() === lang && row.length === columns.length && !row[4].trim()
          && row.slice(5).every((value) => !value.trim())) {
          counts.skipped++;
          continue;
        }
        const { key, status, record } = loadReview(row, lang, before);
        if (reviewKeys.get(key) > 1) throw new Error('Duplicate review key in the sheet.');
        accepted.set(key, record);
        counts[status]++;
      } catch (error) {
        counts.rejected++;
        rejected.push('Row ' + (index + 2) + ' rejected. ' + error.message);
      }
    }
    const after = accepted.size ? { ...before, [lang]: { ...before[lang], ...Object.fromEntries(accepted) } } : before;
    output('| OK | Corrected | Rejected | Skipped |\n| ---: | ---: | ---: | ---: |\n| '
      + Object.values(counts).join(' | ') + ' |');
    rejected.forEach(output);
    output(ledgerDiff(before, after, 'server/translationApprovals.json'));
    return after;
  }, path);
  return { lang, ...counts };
}

if (require.main === module) {
  try {
    const { positionals: [command], values } = parseArgs({ allowPositionals: true, options: {
      file: { type: 'string' }, language: { type: 'string' }, output: { type: 'string' }, apply: { type: 'boolean' },
    } });
    const cwd = process.env.INIT_CWD || process.cwd();
    if (command === 'export') {
      const lang = languageCode(values.language);
      const output = values.output ? resolve(cwd, values.output) : resolve(__dirname, '../../exports/critical_' + lang + '.csv');
      const approvals = JSON.parse(readFileSync(ledger, 'utf8'));
      console.log('Exported ' + exportCritical({ lang, output, approvals }) + ' critical strings to ' + output);
    } else if (command === 'import' && values.file) {
      importTranslations({ file: resolve(cwd, values.file), lang: values.language, apply: values.apply });
      console.log(values.apply ? 'Accepted rows saved.' : 'Preview only. Add --apply to save accepted rows.');
    } else {
      throw new Error('Use export --language <code> or import --file <csv>.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { exportCritical, importTranslations, protectTranslation };
