const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const catalog = require('./catalog');
const Scheme = require('./models/Scheme');
const { classifySchemeId, findScheme } = require('./schemeLookup');

const entries = new Map(catalog.map((scheme) => [scheme.slug, scheme]));
const generic = { title: 'SchemeSathi', description: 'Discover government schemes in India and check preliminary eligibility.' };
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);

function renderMetadata(shell, scheme, siteOrigin, image) {
  const title = scheme ? scheme.title.en + ' | ' + generic.title : generic.title;
  const description = scheme?.summary.en ?? generic.description;
  const url = siteOrigin && scheme ? new URL('/schemes/' + encodeURIComponent(scheme.slug), siteOrigin).href : null;
  const tags = [
    ['name', 'description', description],
    ['property', 'og:type', 'website'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
  ].filter(([, , value]) => value).map(([attribute, key, value]) => (
    `<meta data-server-scheme-metadata ${attribute}="${key}" content="${escapeHtml(value)}">`
  ));
  if (url) tags.push(`<link data-server-scheme-metadata rel="canonical" href="${escapeHtml(url)}">`);
  return shell.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(title)}</title>\n    ${tags.join('\n    ')}`);
}

function createSchemePages(staticDir, siteOrigin) {
  const shell = readFileSync(path.join(staticDir, 'index.html'), 'utf8');
  const assets = path.join(staticDir, 'assets');
  const imageFile = readdirSync(assets).find((file) => /^public-640-[\w-]{8}\.webp$/.test(file));
  const image = imageFile && siteOrigin ? new URL('/assets/' + imageFile, siteOrigin).href : null;

  return async (req, res) => {
    const id = req.params.id;
    const kind = classifySchemeId(id);
    const fromRepo = entries.get(id);
    const stored = !fromRepo && kind && Scheme.db.readyState === 1 ? await findScheme(id, kind) : null;
    const scheme = fromRepo ?? entries.get(stored?.slug);
    res.status(scheme || stored ? 200 : 404).set('Cache-Control', 'no-cache')
      .type('html').send(renderMetadata(shell, scheme, siteOrigin, image));
  };
}

module.exports = { createSchemePages, renderMetadata };
