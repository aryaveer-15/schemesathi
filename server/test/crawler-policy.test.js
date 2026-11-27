const assert = require('node:assert/strict');
const { test } = require('node:test');
const { once } = require('node:events');
const createApp = require('../app');
const siteConfig = require('../siteConfig');
const catalog = require('../catalog');

const origin = 'https://schemesathi-qx5e.onrender.com';
const env = { NODE_ENV: 'production', RENDER: 'true', RENDER_EXTERNAL_URL: origin };

async function serve(t, config) {
  const server = createApp({ production: true, logger: {}, ...config }).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');
  return 'http://127.0.0.1:' + server.address().port;
}

test('crawler files use the confirmed deployment origin and all 51 canonical catalogue slugs', async (t) => {
  const base = await serve(t, siteConfig(env));
  const headers = { 'X-Forwarded-Host': 'other.example' };
  const xml = await fetch(base + '/sitemap.xml', { headers });
  assert.equal(xml.status, 200);
  assert.match(xml.headers.get('content-type'), /application\/xml/);
  const body = await xml.text();
  assert.match(body, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(urls).size, 53);
  assert.deepEqual(urls, [origin + '/', origin + '/schemes', ...catalog.map((s) => origin + '/schemes/' + s.slug)]);
  const robots = await fetch(base + '/robots.txt', { headers });
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('content-type'), /text\/plain/);
  assert.equal(await robots.text(), 'User-agent: *\nAllow: /\nDisallow: /api\nSitemap: ' + origin + '/sitemap.xml\n');
});

test('Render requires a valid HTTPS origin and gives explicit configuration priority', () => {
  assert.equal(siteConfig({ ...env, PUBLIC_SITE_ORIGIN: 'https://custom.example' }).siteOrigin, 'https://custom.example');
  assert.throws(() => siteConfig({ RENDER: 'true' }), /PUBLIC_SITE_ORIGIN.*RENDER_EXTERNAL_URL/);
  for (const invalid of ['http://example.com', 'https://example.com/path', 'invalid']) {
    assert.throws(() => siteConfig({ ...env, RENDER_EXTERNAL_URL: invalid }), /PUBLIC_SITE_ORIGIN/);
  }
});

test('the environment switch moves the same full policy from reporting to enforcement', async (t) => {
  const report = await serve(t, siteConfig(env));
  const enforce = await serve(t, siteConfig({ ...env, CSP_MODE: 'enforce' }));
  const first = (await fetch(report + '/robots.txt')).headers;
  const second = (await fetch(enforce + '/robots.txt')).headers;
  const full = first.get('content-security-policy-report-only');
  for (const directive of ["script-src 'self'", "connect-src 'self'", "style-src 'self'", "object-src 'none'"]) {
    assert.ok(full.split(';').includes(directive));
  }
  assert.doesNotMatch(full, /unsafe-inline|unsafe-eval/);
  assert.equal(second.get('content-security-policy'), full);
  assert.equal(second.get('content-security-policy-report-only'), null);
  assert.ok(first.get('content-security-policy').includes("frame-ancestors 'none'"));
  assert.deepEqual(siteConfig({ ...env, CSP_MODE: 'report-only' }), siteConfig(env));
  assert.throws(() => siteConfig({ ...env, CSP_MODE: 'typo' }), /CSP_MODE/);
});
