const { writeFile } = require('node:fs/promises');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { inventory, money, deadlines } = require('../verificationInventory');
const records = require('../verificationRecords.json');
const { collectExcerpts } = require('./verificationExcerpts');

function plain(value) {
  return String(value).replace(/[\r\n\u0000-\u001f]/g, ' ').replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\\`*_\[\]|]/g, '\\$&');
}

function sourceLink(url) {
  return '<' + url.replace(/[<>\s]/gu, (character) => encodeURIComponent(character)) + '>';
}

function checklist({ rows = inventory, entries = records, excerpts } = {}) {
  const usedSources = new Map();
  const riskNames = ['Age, income or financial values', 'Application timing', 'Other criteria, links and artwork'];
  const sorted = [...rows].sort((a, b) => a.risk - b.risk || a.scheme.title.en.localeCompare(b.scheme.title.en, 'en'));
  const lines = [
    '# SchemeSathi verification checklist', '',
    'Start with age, income and money, then check deadlines, URLs and banner rights. This lists the repo’s current copy and rules for human comparison.',
    'A review covers the exact scheme snapshot. Compare the linked requirements, application paths and documents before marking yes.',
    'Excerpts may describe another route or programme on the same page. Compare the full official document yourself.',
    excerpts ? 'Official-source excerpts were attempted. PDF extraction requires pdftotext. Some pages may be blocked, unreadable or rely on JavaScript.'
      : 'Offline mode. No official-source excerpts were fetched.',
  ];
  function notesFor(row) {
    const { scheme, criteria, copy, risk, profileInferences, checkSource, questionnaireSource, applicationUrl, documents, publicAccess } = row;
    const record = entries[scheme.slug];
    const review = record?.review;
    const values = [
      '', `## ${plain(scheme.title.en)}`, '',
      `- Scheme ID · ${plain(scheme.slug)}`,
      `- Review priority · ${riskNames[risk - 1]}`,
      `- Official URL · ${sourceLink(scheme.sourceUrl)}`,
      ...[...new Set([checkSource, scheme.eligibilitySourceUrl, questionnaireSource, applicationUrl]
        .filter((url) => url && url !== scheme.sourceUrl))]
        .map((url) => `- Additional published source · ${sourceLink(url)}`),
      `- Catalogue classification · category ${plain(scheme.category)}, level ${plain(scheme.level ?? 'central')}, state ${plain(scheme.state ?? 'All India')}. Match rules are listed below.`,
      '', '### Current matcher rules', '',
      ...(criteria.length ? criteria.map(({ key, question, values, reviewOnMismatch }) =>
        `- ${plain(key)} · ${plain(question)} · \`${JSON.stringify(values)}\`${reviewOnMismatch ? ' · mismatch needs review' : ''}`)
        : [publicAccess ? 'Listed as public access. The matcher has no personal criteria for this listing.' : 'No eligibility criteria in the matcher.']),
      ...profileInferences.map((line) => `- Shared profile inference · \`${line}\``),
      '', '### Amounts, deadlines and other published wording', '',
      ...(copy.some(([, body]) => money.test(body) || deadlines.test(body)) ? []
        : ['No amount or deadline wording detected. Check the published wording and the official source.']),
      ...copy.map(([label, text]) => `- ${money.test(text) ? '[Money] ' : ''}${deadlines.test(text) ? '[Timing] ' : ''}${plain(label)} · ${plain(text)}`),
      '', '### Published documents checklist', '',
      ...(documents ? [
        `- Source · ${sourceLink(documents.sourceUrl)}`,
        ...(documents.scope ? [`- Scope · ${plain(documents.scope)}`] : []),
        ...documents.items.map((item) => `- ${plain(item)}`),
      ] : ['Check the official page for required documents.']),
    ];
    if (excerpts) {
      const attempts = excerpts.get(scheme.slug) ?? [];
      values.push('', '### Unverified official-source excerpt', '');
      for (const attempt of attempts) {
        if (!attempt.sample) {
          values.push(`- ${sourceLink(attempt.url)} · ${plain(attempt.issue)}`);
        } else if (usedSources.has(attempt.url)) {
          values.push(`- Shared source ${sourceLink(attempt.url)} · see excerpt under ${plain(usedSources.get(attempt.url))}.`);
        } else {
          values.push(`- Source fetched · ${sourceLink(attempt.url)}`, '', `> ${plain(attempt.sample)}`);
          usedSources.set(attempt.url, scheme.title.en);
        }
      }
      if (attempts.length === 0) values.push('No excerpt was retrieved.');
    }
    values.push('', '### Human review', '',
      `- Snapshot ID · ${row.fingerprint}`,
      `- Verified on · ${review?.matches === 'yes' && review.fingerprint === row.fingerprint ? plain(review.date) : '__________'}`,
      `- Verified by · ${review ? plain(review.by) : '__________'}`,
      '- Matches official source · yes / no / unclear',
      ...(review ? [
        `- Recorded decision · ${plain(review.matches)} on ${plain(review.date)}${review.fingerprint !== row.fingerprint ? ' (earlier snapshot, review again)' : ''}`,
      ] : []),
      `- Notes · ${review?.notes ? plain(review.notes) : '__________'}`,
      ...(review?.proposedCorrection ? [`- Reviewer correction proposal · ${plain(review.proposedCorrection.field)} = ${plain(review.proposedCorrection.value)}`] : []),
      `- Banner photo enabled · ${record?.bannerDisabled === true ? 'no' : 'yes'}`, '');
    return values;
  }
  for (const row of sorted) lines.push(...notesFor(row));
  return lines.join('\n');
}

async function run() {
  const { values } = parseArgs({ options: {
    online: { type: 'boolean', default: false }, output: { type: 'string' }, pdf: { type: 'string' },
  } });
  const excerpts = values.online ? await collectExcerpts({ pdf: values.pdf }) : undefined;
  const output = path.resolve(values.output ?? path.join(__dirname, '../../VERIFICATION_CHECKLIST.md'));
  await writeFile(output, checklist({ excerpts }), 'utf8');
  console.log(`Wrote ${inventory.length} scheme sections to ${output}`);
}

if (require.main === module) run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { checklist };
