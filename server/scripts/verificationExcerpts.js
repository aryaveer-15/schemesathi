const { spawnSync } = require('node:child_process');
const { checkLink, collectLinks } = require('./checkSchemeLinks');

const byteLimit = 2_000_000;
const evidenceWords = /\b(?:age|aged|income|amount|rupees?|lakh|crore|inr|deadline|last date|closing date|apply by)\b|₹/i;
const entities = { amp: '&', lt: '<', gt: '>', nbsp: ' ', quot: '"', apos: "'", rsquo: '’', ndash: '–', mdash: '—' };

function htmlText(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(?:p|div|br|li|table|tr|section|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
      if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? entity;
      const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : ' ';
    });
}

function excerpt(text) {
  const candidates = text.split(/\n+/).map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length >= 30 && evidenceWords.test(line));
  const line = candidates.find((candidate) => /\d/.test(candidate)) ?? candidates[0];
  if (!line) return null;
  const words = line.split(' ');
  const matchIndex = words.findIndex((word) => evidenceWords.test(word));
  const start = Math.max(0, Math.min(matchIndex - 6, words.length - 24));
  const end = Math.min(start + 24, words.length);
  return (start ? '… ' : '') + words.slice(start, end).join(' ') + (end < words.length ? ' …' : '');
}

async function readSource(url, allowed, request = fetch, pdf = 'pdftotext') {
  let payload;
  let issue;
  const result = await checkLink(url, {
    request: async (target, options) => {
      if (!allowed.has(new URL(target).hostname.replace(/^www\./i, ''))) throw new Error('Redirect host is outside the published source list');
      const response = await request(target, options);
      if (!response.ok) return response;
      const type = response.headers.get('content-type') ?? '';
      if (!/^(?:text\/(?:html|plain)|application\/(?:pdf|xhtml\+xml))\b/i.test(type)) {
        issue = 'unsupported document type';
        return response;
      }
      const reader = response.body?.getReader();
      if (!reader) return response;
      const chunks = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > byteLimit) {
            issue = 'source exceeded the 2 MB download limit';
            await reader.cancel();
            break;
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      if (!issue) {
        const bytes = Buffer.concat(chunks);
        if (type.toLowerCase().startsWith('application/pdf')) {
          const converted = spawnSync(pdf, ['-layout', '-enc', 'UTF-8', '-', '-'], {
            input: bytes, encoding: 'utf8', timeout: 5000, maxBuffer: 2_000_000, windowsHide: true,
          });
          if (converted.status === 0) payload = converted.stdout;
          else issue = converted.error?.code === 'ENOENT' ? 'PDF needs optional pdftotext' : 'PDF text extraction failed';
        } else payload = /html/i.test(type) ? htmlText(bytes.toString('utf8')) : bytes.toString('utf8');
      }
      return response;
    },
  });
  const destination = result.chain.at(-1)?.url ?? url;
  const sample = payload && excerpt(payload);
  return { url: destination, sample, issue: issue ?? (result.outcome === 'reachable' ? 'no matching readable text' : [result.outcome, result.detail].filter(Boolean).join(' · ')) };
}

async function collectExcerpts({ pdf } = {}) {
  const links = await collectLinks();
  const allowed = new Set(links.map(({ url }) => new URL(url).hostname.replace(/^www\./i, '')));
  const byScheme = new Map();
  const all = new Map();
  const read = (url) => {
    if (!all.has(url)) all.set(url, readSource(url, allowed, fetch, pdf));
    return all.get(url);
  };
  for (const { url, references } of links) {
    for (const { slug, field } of references) {
      const list = byScheme.get(slug) ?? [];
      list.push({ url, field });
      byScheme.set(slug, list);
    }
  }
  const entries = [...byScheme];
  const excerpts = new Map();
  for (let start = 0; start < entries.length; start += 8) {
    await Promise.all(entries.slice(start, start + 8).map(async ([slug, list]) => {
      const primary = list.find(({ field }) => field === 'sourceUrl');
      const candidates = new Set([primary.url, ...list.filter(({ field }) => field.includes('eligibility') || field.endsWith('.sourceUrl')).map(({ url }) => url)]);
      const attempts = [];
      for (const url of candidates) {
        const result = await read(url);
        attempts.push(result);
        if (result.sample) break;
      }
      excerpts.set(slug, attempts);
    }));
  }
  return excerpts;
}

module.exports = { collectExcerpts, excerpt, htmlText, readSource };
