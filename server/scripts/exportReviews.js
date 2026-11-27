const { access, mkdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { inventory, money, deadlines } = require('../verificationInventory');
const { checklist } = require('./verificationChecklist');
const { dictionaries, languages } = require('../../client/src/locales/index.js');

const root = path.resolve(__dirname, '../..');
const client = path.join(root, 'client', 'src');
const bySlug = new Map(inventory.map((row) => [row.scheme.slug, row]));
const cutoffOrDate = /\b(?:ages?|aged|birthday|income|turnover|years? old|loan limit|qualifying date)\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i;
const reviewText = (value) => cutoffOrDate.test(value) || money.test(value) || deadlines.test(value);

function csv(rows) {
  return '\uFEFF' + rows.map((row) => row.map((cell) => {
    const value = String(cell);
    if (/^[\p{White_Space}\p{Cf}]*[=+\-@]/u.test(value)) throw new Error('A source cell could be interpreted as a spreadsheet formula.');
    return '"' + value.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n') + '\r\n';
}

function verificationRows() {
  // Reuse the checklist's risk and name ordering without its review decisions.
  const order = [...checklist({ entries: {} }).matchAll(/^- Scheme ID · ([a-z0-9-]+)$/gm)];
  if (order.length !== bySlug.size) throw new Error('Could not read all scheme IDs from the verification checklist.');
  return [
    ['Order', 'Scheme', 'State or central', 'Official link', 'Our value (age, income, amount, deadline)',
      'Official value', 'Matches', 'Notes', 'Checked by', 'Date'],
    ...order.map(([, slug], index) => {
      const { scheme, criteria, copy, profileInferences } = bySlug.get(slug);
      const values = [
        ...copy.filter(([, value]) => reviewText(value)).map(([, value]) => value),
        ...criteria.filter(({ values }) => Number.isFinite(values.min) || Number.isFinite(values.max))
          .map(({ key, values }) => `${key} · ${JSON.stringify(values)}`),
        ...profileInferences.filter((line) => /\b(?:age|income)\b/.test(line)),
        ...(scheme.amount === undefined ? [] : [String(scheme.amount)]),
        ...(scheme.deadline === undefined ? [] : [String(scheme.deadline)]),
      ];
      return [index + 1, scheme.title.en, scheme.level === 'state' ? scheme.state : 'Central',
        scheme.sourceUrl, [...new Set(values)].join('\n'), '', '', '', '', ''];
    }),
  ];
}

function linkRows(report) {
  const section = report.split(/^## /m).find((part) => part.split(/\r?\n/, 1)[0].trim() === 'Needs human check');
  if (!section) throw new Error('LINK_REPORT.md lacks the Needs human check section. Regenerate it with npm.cmd --prefix server run check:links.');
  const issues = section.split(/\r?\n/).filter((line) => line.startsWith('- '));
  return [
    ['Scheme', 'URL', 'Automated result', "Checker's result", 'New official URL if it fails', 'Checked by', 'Date'],
    ...issues.map((line) => {
      const fields = /^- (.+?) · (https:\/\/\S+) · (.+)$/.exec(line);
      if (!fields) throw new Error('Unexpected item in the link report human-check section.');
      const [, slugs, encodedUrl, result] = fields;
      const scheme = slugs.split(', ').map((slug) => {
        if (!bySlug.has(slug)) throw new Error(`Unknown scheme in link report: ${slug}`);
        return bySlug.get(slug).scheme.title.en;
      }).join(', ');
      const url = encodedUrl.replaceAll('&#124;', '|').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
      return [scheme, url, result === 'not found 404' ? `Known 404 · ${result}` : result, '', '', '', ''];
    }),
  ];
}

function bannerMap(source, name) {
  // Read the three literal maps without evaluating the Vite-only JSX module.
  const definition = new RegExp(`^const ${name} = new Map\\(\\[\\r?\\n([\\s\\S]*?)^\\]\\);$`, 'm').exec(source);
  if (!definition) throw new Error(`Could not find the ${name} map in SchemeBanner.jsx.`);
  const rows = definition[1].trim().split(/\r?\n/).map((line) => {
    const entry = /^\s*\['([^']+)', '([^']+)'\],?\s*$/.exec(line);
    if (!entry) throw new Error(`Unexpected ${name} entry in SchemeBanner.jsx.`);
    return entry.slice(1);
  });
  return new Map(rows);
}

async function bannerRows(source, assets = path.join(client, 'assets')) {
  const photos = bannerMap(source, 'schemePhotos');
  const categories = bannerMap(source, 'categoryPhotos');
  const descriptions = bannerMap(source, 'descriptions');
  const rows = await Promise.all(inventory.map(async ({ scheme }) => {
    const name = photos.get(scheme.slug) ?? categories.get(scheme.category) ?? 'public';
    const file = name + '.webp';
    const alt = descriptions.get(name);
    if (!alt) throw new Error(`Missing banner alt text for ${scheme.slug}.`);
    try {
      await access(path.join(assets, 'schemes', file));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await access(path.join(assets, 'scholarships', file));
    }
    return [scheme.title.en, file, alt, '', '', '', ''];
  }));
  return [['Scheme', 'Banner file name', 'Current alt text', 'Does the photo fit', 'Source or licence', 'Notes', 'Checked by'], ...rows];
}

const criticalKeys = new Set([
  ...inventory.flatMap(({ criteria }) => criteria.map(({ key }) => key)),
  'ageAtLeast', 'ageRange', 'ageRequired', 'answerOne', 'answerRequired', 'authorityReviewReason',
  'disclaimer', 'documentChecklist', 'documentFallback', 'documentSource', 'eligibilityRequirements',
  'eligibilityResults', 'eligibilitySource', 'expectedAnswer', 'familyException', 'healthScope', 'helpApplyAnswer',
  'housingScope', 'howToGetBenefit', 'howToVerifyScheme', 'likelyMatches', 'matchCoverage', 'matched',
  'matchedCheck', 'missingReason', 'notMatched', 'officialCheck', 'openOfficialPortal', 'pensionScope',
  'possibleMatches', 'preliminaryResultNotice', 'profileAge', 'profileArea', 'profileDebit', 'profileIncome',
  'profileSavings', 'publicAccessResults', 'publicSchemeAccess', 'resultReasons', 'review', 'uncertainReason',
  'unknown', 'unmatched', 'unmetReason', 'verifyListAndLocally', 'verifyLocally', 'verifyOfficialList',
]);

function translationRows(code) {
  const keys = Object.keys(dictionaries.en);
  const ordered = [...keys.filter((key) => criticalKeys.has(key)), ...keys.filter((key) => !criticalKeys.has(key))];
  return [
    ['Language', 'Key', 'English text', 'Current translation', 'OK or Corrected', 'Corrected text', 'Reviewer', 'Date'],
    ...ordered.map((key) => [code, key, dictionaries.en[key], dictionaries[code][key] ?? '', '', '', '', '']),
  ];
}

async function exportReviews({ output = path.join(root, 'exports'), report } = {}) {
  const linkReport = report ?? await readFile(path.join(root, 'LINK_REPORT.md'), 'utf8').catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    throw new Error('LINK_REPORT.md is missing. Generate it with npm.cmd --prefix server run check:links.');
  });
  const bannerSource = await readFile(path.join(client, 'SchemeBanner.jsx'), 'utf8');
  const files = new Map([
    ['verification.csv', verificationRows()],
    ['links.csv', linkRows(linkReport)],
    ['banners.csv', await bannerRows(bannerSource)],
    ...languages.filter(({ code }) => code !== 'en').map(({ code }) => [`translations_${code}.csv`, translationRows(code)]),
  ].map(([name, rows]) => [name, csv(rows)]));
  await mkdir(output, { recursive: true });
  // Exclusive writes keep a second export from overwriting anyone's review.
  for (const name of files.keys()) {
    try {
      await access(path.join(output, name));
      throw new Error(`Move your existing review file before exporting again: ${path.join(output, name)}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const [name, content] of files) await writeFile(path.join(output, name), content, { flag: 'wx' });
  return files.size;
}

if (require.main === module) {
  exportReviews().then((count) => console.log(`Wrote ${count} CSV files to exports/.`)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { csv, exportReviews, linkRows, verificationRows };
