import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import { dictionaries } from '../src/locales/index.js';
import { unknownAnswer } from '../src/helpTopics.js';

const require = createRequire(import.meta.url);
const axeScript = require.resolve('axe-core/axe.min.js');
const legacy = require('../../server/legacyEligibilityChecks');
const { questionnaire } = require('../../server/questionnaire');
const { evaluateProfile } = require('../src/eligibilityMatcher.mjs');
const scheme = {
  ...require('../../server/catalog').find(({ slug }) => slug === 'pm-surya-ghar'),
  _id: 'solar', eligibilityMode: 'profile',
  application: require('../../server/applicationDirections')['pm-surya-ghar'],
};

async function audit(page, name) {
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ path: axeScript });
  const findings = await page.evaluate(async () => {
    const scan = await window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    });
    return scan.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }));
  });
  expect(findings, name).toEqual([]);
}

for (const code of ['en', 'hi', 'ur']) {
  test(`${code} main pages pass axe checks, including questionnaire and results`, async ({ page }) => {
    test.setTimeout(60_000);
    const copy = dictionaries[code];
    const plan = questionnaire.filter(({ slug }) => ['pmjdy', 'jan-aushadhi'].includes(slug));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.addInitScript((language) => {
      localStorage.setItem('schemesathi.language', language);
    }, code);
    await page.route('**/api/auth/session', (route) => route.fulfill({ json: { user: { name: 'Demo' } } }));
    await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme] }));
    await page.route('**/api/schemes/solar', (route) => route.fulfill({ json: scheme }));
    await page.route('**/api/eligibility/atal-pension-yojana', (route) => route.fulfill({ json: legacy['atal-pension-yojana'] }));
    await page.route('**/api/eligibility/questionnaire', (route) => route.fulfill({ json: plan }));
    await page.route('**/api/eligibility/matches', (route) => route.fulfill({
      json: { results: plan.map(({ slug, criteria, sourceUrl }) => ({
        slug, sourceUrl, ...evaluateProfile(route.request().postDataJSON().profile, criteria),
      })) },
    }));

    for (const [route, heading, loaded] of [
      ['/', copy.homeTitle],
      ['/schemes', copy.schemes, '.scheme-list'],
      ['/schemes/solar', null, '.scheme-detail'],
      ['/eligibility', copy.eligibility, '#question-heading'],
      ['/login', copy.login],
      ['/register', copy.register],
      ['/scheme-chat?topic=eligibility', copy.schemeChat, '.chat-message-answer'],
      ['/my-schemes', copy.findSchemes, '#question-heading'],
    ]) {
      await page.goto(route);
      if (heading) await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible();
      if (loaded) await expect(page.locator(loaded)).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', code);
      await expect(page.locator('html')).toHaveAttribute('dir', code === 'ur' ? 'rtl' : 'ltr');
      await audit(page, route);
    }
    await page.getByRole('spinbutton', { name: dictionaries.en.profileAge }).fill('32');
    await page.getByRole('button', { name: copy.showMatches }).click();
    await expect(page.getByRole('heading', { name: copy.eligibilityResults })).toBeFocused();
    await audit(page, '/my-schemes results');
  });
}

test('keyboard users can recover from account-validation errors and read only the newest chat announcement', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [] }));
  let attempts = 0;
  await page.route('**/api/auth/login', (route) => {
    attempts++;
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto('/login');
  const button = page.getByRole('button', { name: 'Log in' });
  await button.focus();
  await page.keyboard.press('Enter');
  const summary = page.locator('#account-form-feedback');
  const email = page.getByRole('textbox', { name: 'Email' });
  await expect(summary).toBeFocused();
  await expect(email).toHaveAttribute('aria-describedby', 'account-form-feedback-email');
  await summary.getByRole('link', { name: 'Email' }).focus();
  await page.keyboard.press('Enter');
  await expect(email).toBeFocused();
  expect(attempts).toBe(0);
  await email.fill('demo@example.test');
  await page.getByLabel('Password').fill('test-password');
  await button.click();
  await expect(summary).toBeFocused();
  await expect(email).toHaveAttribute('aria-describedby', 'account-form-feedback');
  expect(attempts).toBe(1);
  await audit(page, 'account errors');

  await page.getByRole('navigation').getByRole('link', { name: 'Help chat' }).click();
  await expect(page.getByRole('heading', { name: 'Help chat', exact: true })).toBeFocused();
  const composer = page.getByRole('textbox', { name: 'Your question' });
  await composer.fill('How do I apply?');
  await page.getByRole('button', { name: 'Send' }).focus();
  await page.keyboard.press('Enter');
  await expect(composer).toBeFocused();
  const announcement = page.getByRole('status');
  await expect(announcement).toHaveText(dictionaries.en.helpApplyAnswer);
  await composer.fill('something unrelated');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(announcement).toHaveText(unknownAnswer);
  await expect(page.locator('.chat-message-answer')).toHaveCount(2);
  await expect(page.locator('.chat-turn [aria-live]')).toHaveCount(0);
});

test('mobile actions and inline links expose a 44 px touch area without shifting the layout', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5193', viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true,
  });
  try {
    const page = await context.newPage();
    await page.route('**/api/schemes/solar', (route) => route.fulfill({ json: scheme }));
    await page.goto('/schemes/solar');
    const link = page.getByRole('link', { name: 'Back to schemes' });
    await expect(link).toBeVisible();
    const target = await link.evaluate((element) => {
      const r = element.getBoundingClientRect();
      const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      return [-21, 21].every((y) => document.elementFromPoint(center.x, center.y + y)?.closest('a') === element);
    });
    expect(target).toBe(true);
    const action = page.getByRole('main').getByRole('link', { name: 'Find my schemes' });
    const box = await action.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);

    await page.route('**/api/schemes', (route) => route.fulfill({ json: [] }));
    await page.goto('/scheme-chat?topic=eligibility');
    const links = page.locator('.chat-message-answer ul li > a');
    await expect(links).toHaveCount(2);
    const [first, second] = await Promise.all([links.nth(0).boundingBox(), links.nth(1).boundingBox()]);
    for (const target of [first, second]) {
      expect(target.height).toBeGreaterThanOrEqual(44);
      expect(target.width).toBeGreaterThanOrEqual(44);
    }
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  } finally {
    await context.close();
  }
});
