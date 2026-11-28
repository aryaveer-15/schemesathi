import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { dictionaries } from '../src/locales/index.js';
import { unknownAnswer } from '../src/helpTopics.js';

const catalog = createRequire(import.meta.url)('../../server/catalog').map((scheme) => ({ ...scheme, _id: scheme.slug }));
const solar = catalog.find(({ slug }) => slug === 'pm-surya-ghar');

test('catalogue query and both filters are shareable and Back restores the previous search', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: catalog }));
  await page.goto('/schemes');
  const search = page.getByRole('searchbox');
  await search.pressSequentially('kisan');
  await expect(page).toHaveURL(/\?q=kisan$/);
  await expect(page.getByRole('link', { name: /PM-KISAN/ })).toBeVisible();
  await page.locator('#scheme-category').selectOption('agriculture');
  await page.locator('#scheme-region').selectOption('Odisha');
  const shared = new URL(page.url());
  expect(Object.fromEntries(shared.searchParams)).toEqual({ q: 'kisan', category: 'agriculture', state: 'Odisha' });
  await expect(page.getByRole('link', { name: /CM KISAN/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Krishak Bandhu/ })).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('#scheme-region')).toHaveValue('');
  await expect(page.getByRole('link', { name: /Krishak Bandhu/ })).toBeVisible();
  await page.goBack();
  await expect(page.locator('#scheme-category')).toHaveValue('');
  await page.goBack();
  await expect(search).toHaveValue('');
  await page.goto(shared.href);
  await expect(search).toHaveValue('kisan');
  await expect(page.locator('#scheme-region')).toHaveValue('Odisha');
  await expect(page.locator('#scheme-category')).toHaveValue('agriculture');
});

test('a direct scheme URL uses catalogue metadata and restores the site title on exit', async ({ page, request }) => {
  const path = '/schemes/' + solar.slug;
  await page.route('**/api' + path, (route) => route.fulfill({ json: solar }));
  const html = await (await request.get(path)).text();
  expect(html).not.toContain('og:title');
  await page.goto(path);
  await expect(page).toHaveTitle(solar.title.en + ' | ' + dictionaries.en.appName);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', solar.summary.en);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', solar.title.en + ' | ' + dictionaries.en.appName);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', solar.summary.en);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', page.url());
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^http:\/\/127\.0\.0\.1:5193\/.*\.webp$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', page.url());
  await page.locator('header .lang select').selectOption('ur');
  await expect(page).toHaveTitle(solar.title.en + ' | ' + dictionaries.ur.appName);
  await page.locator('main .back-link a').click();
  await expect(page).toHaveTitle(dictionaries.ur.appName);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(0);
});

test('chat links a named factual question to its official source and keeps input out of requests, URLs and storage', async ({ page }) => {
  const question = 'Is the income limit for AICTE Pragati 87654321?';
  const scheme = catalog.find(({ slug }) => slug === 'aicte-pragati');
  const seen = [];
  page.on('request', (event) => seen.push({ url: event.url(), method: event.method(), body: event.postData() }));
  await page.route('**/api/schemes', (route) => route.fulfill({ json: catalog }));
  const ready = page.waitForResponse('**/api/schemes');
  await page.goto('/scheme-chat');
  await ready;
  await page.locator('main summary').click();
  await expect(page.locator('main details button').first()).toBeVisible();
  const initialRequests = seen.filter(({ url }) => new URL(url).pathname.startsWith('/api/')).length;
  await page.getByLabel('Your question', { exact: true }).fill(question);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const reply = page.locator('.chat-message-answer').last();
  await expect(reply.getByRole('link', { name: 'Visit the official scheme website' })).toHaveAttribute('href', scheme.sourceUrl);
  await expect(reply.getByRole('link', { name: scheme.title.en })).toHaveAttribute('href', '/schemes/' + scheme.slug);
  await expect(reply).toContainText('The responsible authority makes the final decision.');
  await expect(reply).not.toContainText('87654321');
  await page.getByLabel('Your question', { exact: true }).fill('Can you check my Aadhaar status?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(reply).toContainText(unknownAnswer);
  await expect(reply.getByRole('link', { name: 'Browse schemes' })).toHaveAttribute('href', '/schemes');
  await expect(page).toHaveURL(/\/scheme-chat$/);
  const origin = new URL(page.url()).origin;
  expect(seen.every(({ url, method, body }) => new URL(url).origin === origin && method === 'GET' && !body
    && !decodeURIComponent(url).includes('87654321'))).toBe(true);
  const apiRequests = seen.filter(({ url }) => new URL(url).pathname.startsWith('/api/'));
  expect(initialRequests).toBeGreaterThan(0);
  expect(apiRequests).toHaveLength(initialRequests);
  expect(apiRequests.every(({ url }) => ['/api/schemes', '/api/auth/session'].includes(new URL(url).pathname))).toBe(true);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage, document.cookie]))).not.toContain('87654321');
  await page.reload();
  await expect(page.locator('.chat-turn')).toHaveCount(0);
});

test('chat links unanswered questions to catalogue-only search results', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: catalog }));
  await page.goto('/scheme-chat');
  await page.locator('main summary').click();
  await expect(page.locator('main details button').first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Your question' }).fill('PM ksan deadline 8675309');
  await page.getByRole('button', { name: 'Send' }).click();
  const reply = page.locator('.chat-message-answer').last();
  await expect(reply).toContainText(unknownAnswer);
  await expect(reply.getByRole('heading', { name: /PM-KISAN/ })).toBeVisible();
  await expect(reply.getByRole('link', { name: 'Browse schemes' })).toHaveAttribute('href', '/schemes?suggested=pm-kisan');
  await reply.getByRole('link', { name: 'Browse schemes' }).click();
  await expect(page).toHaveURL(/\/schemes\?suggested=pm-kisan$/);
  await expect(page.locator('.scheme-card')).toHaveCount(1);
  await expect(page.locator('.scheme-card h2')).toContainText('PM-KISAN');
  await page.reload();
  await expect(page.locator('.scheme-card')).toHaveCount(1);
});

test('chat distinguishes related schemes and never gives personal eligibility or benefit verdicts', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: catalog }));
  const loaded = page.waitForResponse('**/api/schemes');
  await page.goto('/scheme-chat');
  await loaded;
  for (const [question, slugs] of [
    ['Am I eligible for PM Kisan if I have 3 acres?', ['pm-kisan']],
    ['How much does PM Kisan pay?', ['pm-kisan']],
    ['What is the age limit for Atal Pension Yojana?', ['atal-pension-yojana']],
    ['What is the income limit and deadline for PMAY?', ['pm-awas-gramin', 'pm-awas-yojana']],
    ['Do I qualify for Kanyashree?', ['wb-kanyashree']],
  ]) {
    await page.locator('textarea').fill(question);
    await page.locator('form button[type=submit]').click();
    const reply = page.locator('.chat-message-answer').last();
    await expect(reply).toContainText('The responsible authority makes the final decision.');
    await expect(reply).not.toContainText(/\b(?:you (?:are|qualify|will|can|meet)|you['’]re|the applicant (?:is|qualifies|will|can|meets))\b[^.!?]*\b(?:eligible|qualif(?:y|ies)|receive|criteria|approved)\b/i);
    await expect(reply).not.toContainText(/\byou qualify\b|\bthe applicant qualifies\b/i);
    await expect(reply).not.toContainText('3 acres');
    await expect(reply.locator('section')).toHaveCount(slugs.length);
    for (const slug of slugs) {
      const scheme = catalog.find((entry) => entry.slug === slug);
      const listing = reply.locator('section').filter({ has: page.locator('a[href="/schemes/' + slug + '"]') });
      await expect(listing.getByRole('link', { name: 'Visit the official scheme website' })).toHaveAttribute('href', scheme.sourceUrl);
      if (scheme.state) await expect(listing).toContainText(scheme.state);
    }
  }
});
