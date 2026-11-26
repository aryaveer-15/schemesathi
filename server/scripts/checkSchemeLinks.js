const { writeFile } = require('node:fs/promises');
const { isIP } = require('node:net');
const path = require('node:path');
const catalog = require('../catalog');
const applications = require('../applicationDirections');
const legacyChecks = require('../legacyEligibilityChecks');
const profileChecks = require('../remainingEligibility');

const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const redirectLimit = 5;
const timeoutMs = 8000;

async function collectLinks() {
  const { schemeQuestionSources } = await import('../../client/src/schemeQuestionSources.js');
  const links = new Map();
  for (const { slug, sourceUrl, eligibilitySourceUrl } of catalog) {
    const fields = {
      sourceUrl,
      eligibilitySourceUrl,
      'application.url': applications[slug]?.url,
      'legacyCheck.sourceUrl': legacyChecks[slug]?.sourceUrl,
      'profileCheck.sourceUrl': profileChecks[slug]?.sourceUrl,
      'questionnaire.sourceUrl': schemeQuestionSources[slug],
    };
    for (const [field, originalUrl] of Object.entries(fields)) {
      if (!originalUrl) continue;
      const requestUrl = new URL(originalUrl);
      requestUrl.hash = '';
      const references = links.get(requestUrl.href) ?? [];
      references.push({ slug, field, originalUrl });
      links.set(requestUrl.href, references);
    }
  }
  return Array.from(links, ([url, references]) => ({ url, references }));
}

function isAllowedTarget(url) {
  return url.protocol === 'https:' && !url.username && !url.password && !url.port
    && url.hostname.includes('.') && !isIP(url.hostname)
    && !/\.(localhost|local|internal|test|example|invalid)\.?$/i.test(url.hostname);
}

async function checkLink(url, { request = fetch, signal = AbortSignal.timeout(timeoutMs) } = {}) {
  const chain = [];
  let target = new URL(url);
  const seen = new Set();
  while (isAllowedTarget(target)) {
    if (seen.has(target.href)) return { outcome: 'redirect loop', chain };
    if (chain.length > redirectLimit) return { outcome: 'redirect limit', chain };
    seen.add(target.href);
    try {
      const response = await request(target.href, { method: 'GET', redirect: 'manual', signal });
      const location = response.headers.get('location');
      chain.push({ url: target.href, status: response.status, location });
      await response.body?.cancel().catch(() => {});
      if (!redirectStatuses.has(response.status)) {
        const status = response.status;
        const outcome = status >= 200 && status < 300 ? 'reachable'
          : status === 404 || status === 410 ? 'not found'
          : [401, 403, 429].includes(status) ? 'access restricted'
          : 'HTTP error';
        return { outcome, chain };
      }
      if (!location) return { outcome: 'redirect missing destination', chain };
      try {
        target = new URL(location, target);
        target.hash = '';
      } catch {
        return { outcome: 'invalid redirect destination', chain };
      }
    } catch (error) {
      if (signal.aborted || error.name === 'TimeoutError') return { outcome: 'timeout', chain };
      return { outcome: 'request failed', detail: error.cause?.code ?? error.message, chain };
    }
  }
  return { outcome: 'unsupported target', chain };
}

function cell(value) {
  return String(value).replace(/[\r\n]/g, ' ').replaceAll('|', '&#124;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function humanCheck(results) {
  const groups = [
    ['Observed failures · HTTP 404/410 or DNS name resolution', []],
    ['May depend on the checker or network · timeout, access restriction or TLS', []],
    ['Other issues and redirects · confirm the intended destination', []],
  ];
  for (const { url, outcome, detail, chain, references } of results) {
    if (outcome === 'reachable' && chain.length <= 1) continue;
    const group = outcome === 'not found' || /^(?:ENOTFOUND|EAI_NONAME|EAI_NODATA)$/.test(detail ?? '') ? 0
      : ['timeout', 'access restricted'].includes(outcome) || /CERT|TLS|SSL|SIGNATURE|EAI_AGAIN/i.test(detail ?? '') ? 1 : 2;
    const published = references[0]?.originalUrl ?? url;
    const names = [...new Set(references.map(({ slug }) => slug))].join(', ');
    const note = detail ?? [outcome === 'reachable' ? 'redirect' : outcome, chain.at(-1)?.status].filter(Boolean).join(' ');
    groups[group][1].push(`- ${cell(names)} · ${cell(published)} · ${cell(note)}`);
  }
  return ['## Needs human check', '',
    'DNS and HTTP results reflect this run. Recheck them before replacing a link. Retry inconclusive requests in a normal browser or another network.',
    ...groups.flatMap(([title, entries]) => ['', `### ${title}`, '', ...(entries.length ? entries : ['None observed.'])]), ''];
}

function formatReport(results, checkedAt) {
  const schemeCount = new Set(results.flatMap(({ references }) => references.map(({ slug }) => slug))).size;
  const issueCount = results.filter(({ outcome, chain }) => outcome !== 'reachable' || chain.length > 1).length;
  const rows = results.flatMap(({ outcome, detail, chain, references }) => {
    const trace = chain.map(({ url, status, location }) =>
      `${status} ${url}${location ? ` → ${location}` : ''}`).join(' · ');
    const result = [outcome, detail, trace].filter(Boolean).join(' · ');
    return references.map(({ slug, field, originalUrl }) =>
      `| ${cell(slug)} | ${cell(field)} | ${cell(originalUrl)} | ${cell(result)} |`);
  });
  return [
    '# SchemeSathi official link report',
    '',
    `Checked at ${checkedAt.toISOString()}. ${schemeCount} schemes, ${results.length} unique URLs, ${issueCount} URLs to review.`,
    '',
    `GET checks allow up to ${redirectLimit} redirects and ${timeoutMs / 1000} seconds per URL. A 2xx response indicates an HTTP response only. Verify the destination and criteria separately. Timeouts, restrictions and transport failures may depend on the network.`,
    '',
    ...humanCheck(results),
    '## Full link inventory',
    '',
    '| Scheme | Field | Published URL | Result and redirect chain |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

async function run() {
  const links = await collectLinks();
  const results = [];
  for (let start = 0; start < links.length; start += 5) {
    results.push(...await Promise.all(links.slice(start, start + 5)
      .map(async (link) => ({ ...link, ...await checkLink(link.url) }))));
  }
  const output = path.resolve(__dirname, '../../LINK_REPORT.md');
  await writeFile(output, formatReport(results, new Date()));
  console.log(`Checked ${results.length} unique URLs. Report written to ${output}`);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { checkLink, collectLinks, formatReport };
