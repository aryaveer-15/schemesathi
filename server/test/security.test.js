const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');
const { test } = require('node:test');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createApp = require('../app');
const { renderMetadata } = require('../schemeMetadata');
const Scheme = require('../models/Scheme');
const User = require('../models/User');

const secret = randomBytes(32).toString('hex');
const userId = '64f000000000000000000001';
process.env.JWT_SECRET = secret;
const quiet = {};

async function serve(context, options = {}) {
  const server = createApp({ siteOrigin: 'https://schemes.example.org', logger: quiet, ...options }).listen(0, '127.0.0.1');
  context.after(() => server.close());
  await once(server, 'listening');
  return 'http://127.0.0.1:' + server.address().port;
}

function post(path, data, headers = {}) {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'https://schemes.example.org', 'X-SchemeSathi-Request': '1', ...headers },
    body: JSON.stringify(data),
  });
}

test('credentials and catalogue filters reject non-scalars and unexpected keys before database access', async (context) => {
  const findUser = context.mock.method(User, 'findOne', () => { throw new Error('Unexpected lookup'); });
  const findSchemes = context.mock.method(Scheme, 'find', () => { throw new Error('Unexpected lookup'); });
  const base = await serve(context);
  for (const input of [
    { email: { $eq: 'email@example.org' }, password: 'example pass' },
    { email: 'email@example.org', password: ['example pass'] },
    { email: 'x'.repeat(255), password: 'example pass' },
    { email: 'email@example.org', password: 'example pass', role: 'admin' },
  ]) assert.equal((await post(base + '/api/auth/login', input)).status, 400);
  for (const input of [
    { name: ' ', email: 'email@example.org', password: 'example pass' },
    { name: 'Resident', email: 'email@example.org', password: 'अ'.repeat(25) },
    { name: 'Resident', email: 'email@example.org', password: 'example pass', preferredLanguage: ['en'] },
  ]) assert.equal((await post(base + '/api/auth/register', input)).status, 400);
  for (const query of ['category=health&category=education', 'state%5B%24eq%5D=Odisha', 'q%5B%5D=house',
    'category=invalid', 'q=' + 'x'.repeat(241)]) {
    assert.equal((await fetch(base + '/api/schemes?' + query)).status, 400);
  }
  assert.equal(findUser.mock.callCount(), 0);
  assert.equal(findSchemes.mock.callCount(), 0);
});

test('unknown and wrong credentials both use bcrypt and receive the same response', async (context) => {
  const compare = context.mock.method(bcrypt, 'compare', async () => false);
  const find = context.mock.method(User, 'findOne', async ({ email }) => email === 'resident@example.org'
    ? { passwordHash: 'existing bcrypt fixture' } : null);
  const base = await serve(context);
  const results = [];
  for (const email of [' Resident@example.org ', 'unknown@example.org']) {
    const response = await post(base + '/api/auth/login', { email, password: 'wrong-password' });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('set-cookie'), null);
    results.push(await response.json());
  }
  assert.deepEqual(results, Array(2).fill({ error: 'Invalid email or password' }));
  assert.equal(compare.mock.callCount(), 2);
  assert.deepEqual(find.mock.calls[0].arguments, [{ email: 'resident@example.org' }]);
});

test('signed session claims and JWT algorithms are checked before querying the user', async (context) => {
  const find = context.mock.method(User, 'findById', async (id) => ({ _id: id, role: 'user' }));
  const base = await serve(context);
  for (const token of [
    jwt.sign({ id: { $ne: null }, role: 'user' }, secret, { audience: 'schemesathi-cookie-v1', expiresIn: '1h' }),
    jwt.sign({ id: userId, role: 'user' }, secret, { algorithm: 'HS384', audience: 'schemesathi-cookie-v1', expiresIn: '1h' }),
    jwt.sign({ id: userId, role: 'user' }, secret, { audience: 'schemesathi-cookie-v1' }),
  ]) assert.equal((await fetch(base + '/api/auth/me', { headers: { Cookie: 'schemesathi_session=' + token } })).status, 401);
  assert.equal(find.mock.callCount(), 0);
  const goodToken = jwt.sign({ id: userId, role: 'user' }, secret, { audience: 'schemesathi-cookie-v1', expiresIn: '1h' });
  assert.equal((await fetch(base + '/api/auth/me', { headers: { Cookie: 'schemesathi_session=' + goodToken } })).status, 200);
});

test('the single trusted hop separates clients and ignores a forged left-hand entry', async (context) => {
  const base = await serve(context, { proxyHops: 1 });
  const chain = (left, client) => ({ 'X-Forwarded-For': left + ', ' + client });
  for (let index = 0; index < 20; index++) {
    const response = await post(base + '/api/auth/login', {}, chain('203.0.113.' + (index + 1), '198.51.100.12'));
    assert.equal(response.status, 400);
  }
  assert.equal((await post(base + '/api/auth/register', {}, chain('203.0.113.60', '198.51.100.12'))).status, 429);
  assert.equal((await post(base + '/api/auth/register', {}, chain('203.0.113.60', '198.51.100.25'))).status, 400);
  const profile = await fetch(base + '/api/auth/me', { headers: chain('203.0.113.60', '198.51.100.12') });
  assert.equal(profile.status, 401);
  assert.ok(profile.headers.has('ratelimit'));
  const eligibility = base + '/api/eligibility/pm-ujjwala-yojana';
  for (let index = 0; index < 90; index++) {
    assert.equal((await post(eligibility, {}, chain('203.0.113.60', '198.51.100.12'))).status, 400);
  }
  const limited = await post(base + '/api/eligibility/matches', {}, chain('203.0.113.60', '198.51.100.12'));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('cache-control'), 'no-store');
  assert.equal((await post(eligibility, {}, chain('203.0.113.60', '198.51.100.25'))).status, 400);
});

test('logs allowlisted fields only and database errors return a generic response', async (context) => {
  const logs = [];
  const capture = (message) => logs.push(JSON.parse(message));
  context.mock.method(User, 'findOne', async () => { throw new Error('mongodb://detail-marker/local/path'); });
  const base = await serve(context, { logger: { error: capture, info: capture } });
  const response = await post(base + '/api/auth/login?chat=queryMarker', {
    email: 'private-marker@example.org', password: 'passwordMarker',
  }, { Authorization: 'Bearer tokenMarker', Cookie: 'cookieMarker=private' });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Server error', requestId: response.headers.get('x-request-id') });
  const token = jwt.sign({ id: userId, role: 'user' }, secret, { audience: 'schemesathi-cookie-v1', expiresIn: '1h' });
  const matcher = await post(base + '/api/eligibility/matches?input=questionMarker', { profile: { age: 117 } },
    { Cookie: 'schemesathi_session=' + token });
  assert.equal(matcher.status, 200);
  await fetch(base + '/api/unknown/privatePathMarker?q=queryMarker');
  assert.equal(logs.length, 3);
  assert.ok(logs.some(({ route }) => route === '/matches'));
  assert.ok(logs.every((item) => Object.keys(item).sort().join(',') === 'durationMs,event,method,requestId,route,status'));
  assert.doesNotMatch(JSON.stringify(logs), /Marker|detail-marker|private-marker|"age"|eyJ/);
});

test('scheme metadata escapes hostile strings in both title and attribute contexts', () => {
  const hostile = '\"\'><script>alert(1)</script>&';
  const result = renderMetadata('<head><title>Test</title></head>', {
    title: { en: hostile }, summary: { en: hostile }, slug: 'fixture',
  }, 'https://scheme.example', 'https://scheme.example/banner.webp?a=one&b=two');
  assert.doesNotMatch(result, /<script>|content=""|<title>"/);
  assert.match(result, /&quot;&#39;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;&amp;/);
  assert.match(result, /banner\.webp\?a=one&amp;b=two/);
});

test('the candidate CSP defaults to reports while the baseline restrictions stay enforced', async (context) => {
  const base = await serve(context, { production: true });
  const headers = (await fetch(base + '/api/health')).headers;
  assert.match(headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const policy = headers.get('content-security-policy-report-only');
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /style-src 'self'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
  assert.equal(headers.get('x-frame-options'), 'DENY');
  assert.equal(headers.get('strict-transport-security'), 'max-age=31536000');
  const enforce = await serve(context, { cspReportOnly: false });
  const strict = (await fetch(enforce + '/api/health')).headers;
  assert.match(strict.get('content-security-policy'), /script-src 'self'/);
  assert.equal(strict.get('content-security-policy-report-only'), null);
});

const trusted = 'https://schemes.example.org';
const writeHeaders = { Origin: trusted, 'X-SchemeSathi-Request': '1' };
for (const path of ['/auth/register', '/auth/login', '/auth/logout', '/eligibility/matches', '/eligibility/pm-kisan']) {
  test('rejects missing origin, foreign origin and missing CSRF header on ' + path, async (context) => {
    const base = await serve(context);
    for (const headers of [
      { 'X-SchemeSathi-Request': '1' },
      { ...writeHeaders, Origin: 'https://foreign.example', 'X-Forwarded-Host': 'foreign.example' },
      { Origin: trusted },
    ]) {
      const response = await fetch(base + '/api' + path, { method: 'POST', headers });
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('set-cookie'), null);
    }
  });
}

test('production without a canonical origin rejects writes even from an allowed CORS origin', async (context) => {
  const base = await serve(context, { production: true, siteOrigin: undefined, origins: [trusted] });
  assert.equal((await fetch(base + '/api/auth/logout', { method: 'POST', headers: writeHeaders })).status, 403);
});

test('login and registration issue a seven-day private cookie and logout expires the identical scope', async (context) => {
  const logs = [];
  const capture = (value) => logs.push(value);
  const user = { _id: userId, role: 'user', name: 'Resident', email: 'resident@example.org', passwordHash: 'fixture' };
  context.mock.method(User, 'findOne', () => {
    const found = Promise.resolve(user);
    found.select = () => ({ lean: async () => null });
    return found;
  });
  context.mock.method(User, 'create', async () => user);
  context.mock.method(User, 'findById', async () => user);
  context.mock.method(bcrypt, 'compare', async () => true);
  const base = await serve(context, { production: true, logger: { info: capture, error: capture } });
  const profile = base + '/api/auth/me';
  const errors = [];
  const anonymous = await fetch(base + '/api/auth/session');
  assert.deepEqual(await anonymous.json(), { user: null });
  assert.equal(anonymous.headers.get('cache-control'), 'no-store');
  for (const action of ['register', 'login']) {
    const data = { email: user.email, password: 'fixture-password' };
    if (action === 'register') data.name = user.name;
    const response = await post(base + '/api/auth/' + action, data);
    assert.equal(response.status, action === 'register' ? 201 : 200);
    assert.deepEqual(Object.keys(await response.json()), ['user']);
    const [pair, ...attrs] = response.headers.get('set-cookie').split('; ');
    const [name, token] = pair.split('=');
    assert.equal(name, 'schemesathi_session');
    const flags = attrs.filter((item) => !/^(Max-Age|Expires)=/.test(item)).sort();
    assert.deepEqual(flags, ['HttpOnly', 'Path=/api', 'SameSite=Lax', 'Secure']);
    assert.ok(attrs.includes('Max-Age=604800'));
    const claims = jwt.verify(token, secret, { audience: 'schemesathi-cookie-v1' });
    assert.equal(claims.exp - claims.iat, 604800);
    assert.equal((await fetch(profile, { headers: { Cookie: pair } })).status, 200);
    const expired = jwt.sign({ id: userId, role: 'user' }, secret, { audience: claims.aud, expiresIn: -1 });
    const legacy = jwt.sign({ id: userId, role: 'user' }, secret, { expiresIn: '7d' });
    for (const headers of [{}, { Authorization: 'Bearer ' + token }, { Cookie: name + '=' + expired },
      { Cookie: name + '=' + legacy }, { Cookie: pair + '; ' + pair }, { Cookie: pair + 'fake' }]) {
      const denied = await fetch(profile, { headers });
      assert.equal(denied.status, 401);
      errors.push(await denied.text());
      assert.equal(denied.headers.get('set-cookie'), null);
    }
    const logout = await post(base + '/api/auth/logout', {}, { Cookie: pair });
    assert.equal(logout.status, 204);
    const [cleared, ...clearAttrs] = logout.headers.get('set-cookie').split('; ');
    assert.equal(cleared, name + '=');
    assert.deepEqual(clearAttrs.filter((item) => !item.startsWith('Expires=')).sort(), flags);
    assert.ok(clearAttrs.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT'));
    const output = [...logs, ...errors].join('\n');
    assert.ok(!output.includes(token));
    assert.doesNotMatch(output, /cookie|eyJ/i);
  }
});

test('local credentialed preflight admits the configured frontend only', async (context) => {
  const local = 'http://localhost:5000';
  const base = await serve(context, { origins: [local] });
  for (const origin of [local, 'http://127.0.0.1:5000']) {
    const response = await fetch(base + '/api/auth/logout', { method: 'OPTIONS', headers: {
      Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'x-schemesathi-request',
    } });
    assert.equal(response.headers.get('access-control-allow-origin'), origin === local ? local : null);
    if (origin === local) {
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
      assert.match(response.headers.get('access-control-allow-headers'), /X-SchemeSathi-Request/i);
    }
    assert.equal((await fetch(base + '/api/auth/logout', { method: 'POST',
      headers: { ...writeHeaders, Origin: origin } })).status, origin === local ? 204 : 403);
  }
});
