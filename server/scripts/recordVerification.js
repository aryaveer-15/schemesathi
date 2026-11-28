const updateLedger = require('./updateLedger');
const { resolve } = require('node:path');
const { parseArgs } = require('node:util');
const { bySlug } = require('../verification');

const file = resolve(__dirname, '../verificationRecords.json');

function proposedRecords(records, values, today = new Date().toISOString().slice(0, 10)) {
  const row = bySlug.get(values.scheme);
  if (!row) throw new Error('Use a maintained scheme ID from VERIFICATION_CHECKLIST.md.');
  const previous = records[values.scheme] ?? {};
  if (values.banner !== undefined) {
    if (!['on', 'off'].includes(values.banner) || ['date', 'by', 'matches', 'notes', 'field', 'value', 'snapshot']
      .some((key) => values[key] !== undefined)) {
      throw new Error('Use --banner on or --banner off separately from a review.');
    }
    return { ...records, [values.scheme]: { ...previous, bannerDisabled: values.banner === 'off' } };
  }

  const { date, by, matches, notes, field, value } = values;
  if (values.snapshot !== undefined && values.snapshot !== row.fingerprint) {
    throw new Error('The snapshot ID changed. Regenerate the checklist and review the current data.');
  }
  const parsed = new Date(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== date || date > today || date < (previous.review?.date ?? '')) {
    throw new Error('Provide a valid, non-future review date (YYYY-MM-DD) at least as recent as the recorded review.');
  }
  if (!/^[\p{L}][\p{L}.\p{M}]{0,11}$/u.test(by ?? '') || !['yes', 'no', 'unclear'].includes(matches)) {
    throw new Error('Provide reviewer initials with --by and use --matches yes, no or unclear.');
  }
  if ((field === undefined) !== (value === undefined) || (field !== undefined
    && (matches === 'yes' || !field.trim() || field.length > 100 || !value.trim() || value.length > 1000))) {
    throw new Error('A correction requires --field and --value and a no or unclear review.');
  }
  if (notes?.length > 2000) throw new Error('Limit review notes to 2,000 characters.');
  const review = { date, by, matches, fingerprint: row.fingerprint };
  if (notes?.trim()) review.notes = notes.trim();
  if (field !== undefined) review.proposedCorrection = { field: field.trim(), value };
  return { ...records, [values.scheme]: { ...previous, review } };
}

function record(options, { path = file, output = console.log, today } = {}) {
  return updateLedger(options.apply, (before) => {
    const after = proposedRecords(before, options, today);
    const block = (data) => JSON.stringify({ [options.scheme]: data[options.scheme] ?? null }, null, 2).split('\n');
    const diff = ['--- current verification record', '+++ proposed verification record',
      ...block(before).map((line) => '-' + line), ...block(after).map((line) => '+' + line)].join('\n');
    output(diff);
    return after;
  }, path);
}

if (require.main === module) {
  try {
    const options = Object.fromEntries(['scheme', 'date', 'by', 'matches', 'notes', 'field', 'value', 'banner', 'snapshot']
      .map((name) => [name, { type: 'string' }]));
    options.apply = { type: 'boolean', default: false };
    const { values } = parseArgs({ options });
    record(values);
    console.log(values.apply ? 'Recorded locally. Review with git diff before committing.' : 'Preview only. Add --apply to save this record.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { proposedRecords, record };
