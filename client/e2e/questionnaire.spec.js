import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const legacy = require('../../server/legacyEligibilityChecks.js');
const { questionnaire } = require('../../server/questionnaire.js');
const { evaluateLegacy, evaluateProfile } = require('../src/eligibilityMatcher.mjs');

test('360px questionnaire supports keyboard navigation, editing and pruning without persisting answers', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const slug = 'pm-ujjwala-yojana';
  const sourceUrl = legacy[slug].sourceUrl;
  const heading = 'Is the applicant a woman aged 18 or older?';
  const called = [];
  const requests = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'fetch') requests.push([request.method(), new URL(request.url()).pathname, request.postData()]);
  });
  await page.route(`**/api/eligibility/${slug}`, async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: legacy[slug] });
    const body = route.request().postDataJSON();
    called.push(body);
    return route.fulfill({ json: { ...evaluateLegacy(body.answers, legacy[slug]), sourceUrl } });
  });
  await page.goto(`/eligibility?scheme=${slug}`);
  const question = page.getByRole('heading', { name: heading });
  await expect(question).toBeFocused();
  const before = await page.evaluate(() => ({
    local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage),
  }));
  const cookies = await context.cookies();
  await expect(page.getByRole('progressbar', { name: 'Question 1 of up to 3' })).toHaveAttribute('value', '1');
  await expect(page.locator('form select')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.getByLabel(heading).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  const lpg = page.getByRole('heading', { name: /already have an LPG connection/ });
  await expect(lpg).toBeFocused();
  await page.getByLabel(/already have an LPG connection/).selectOption('no');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(lpg).toBeFocused();
  await expect(page.getByLabel(/already have an LPG connection/)).toHaveValue('no');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByLabel(heading).selectOption('no');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Eligibility results' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Not matched' })).toBeVisible();
  await expect(page.getByText('Requirement not met. Expected answer · Yes.')).toBeVisible();
  expect(called).toEqual([{ answers: { adultWoman: 'no' }, partial: true }]);

  await page.getByRole('button', { name: 'Edit answers' }).click();
  await page.getByLabel(heading).selectOption('yes');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel(/already have an LPG connection/)).toHaveValue('');
  await page.getByLabel(/already have an LPG connection/).selectOption('unknown');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel(/official deprivation declaration/).selectOption('yes');
  await page.getByRole('button', { name: 'Check eligibility' }).click();
  await expect(page.getByRole('heading', { name: 'Possible matches, needs verification' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Likely matches' })).toHaveCount(0);
  await expect(page.locator('li').filter({ hasText: /already have an LPG connection/ })).toContainText('Not sure.');
  expect(called[1]).toEqual({ answers: { adultWoman: 'yes', lpg: 'unknown', deprivation: 'yes' } });
  expect(requests.filter(([, , body]) => body)).toEqual(called.map((body) =>
    ['POST', `/api/eligibility/${slug}`, JSON.stringify(body)]));

  await page.getByRole('button', { name: 'Share as text' }).click();
  await expect(page.getByRole('textbox', { name: /scheme names and official links/ }))
    .toHaveValue(`Pradhan Mantri Ujjwala Yojana\n${sourceUrl}`);
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('textbox', { name: /scheme names and official links/ })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Pradhan Mantri Ujjwala Yojana' })).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  expect(await page.evaluate(() => ({
    local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage),
  }))).toEqual(before);
  expect(await context.cookies()).toEqual(cookies);
  expect(new URL(page.url()).search).toBe(`?scheme=${slug}`);
  await page.reload();
  await expect(page.getByLabel(heading)).toHaveValue('');
});

test('numeric uncertainty reaches only the matcher and keeps public access separate', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.addInitScript(() => localStorage.setItem('schemesathi.auth', JSON.stringify({
    token: 'test-token', user: { name: 'Test resident' },
  })));
  const entries = questionnaire.filter(({ slug }) => ['pmjdy', 'jan-aushadhi'].includes(slug));
  const writes = [];
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: { name: 'Test resident' } } }));
  await page.route('**/api/eligibility/questionnaire', (route) => route.fulfill({ json: entries }));
  await page.route('**/api/eligibility/matches', (route) => {
    const { answers, profile } = route.request().postDataJSON();
    writes.push({ answers, profile });
    expect(new URL(route.request().url()).search).toBe('');
    return route.fulfill({ json: { results: entries.map(({ slug, criteria, sourceUrl }) => ({
      slug, sourceUrl, ...evaluateProfile(profile, criteria),
      ...(slug === 'pmjdy' && profile.age !== 'unknown' && { nextSteps: { visit: 'Ask at a Bank Mitra outlet.' } }),
    })) } });
  });
  await page.goto('/my-schemes');
  await page.getByRole('checkbox', { name: 'Not sure' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel(/bank account of your own/).selectOption('no');
  await page.getByRole('button', { name: 'Show my matches' }).click();
  await expect(page.getByRole('heading', { name: 'Open to the public' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Likely matches' })).toHaveCount(0);
  await expect(page.getByText('Age in completed years')).toBeVisible();
  expect(writes).toEqual([{ answers: {}, profile: { age: 'unknown', bankAccount: 'no' } }]);
  await page.getByRole('button', { name: 'Edit answers' }).click();
  await page.getByRole('checkbox', { name: 'Not sure' }).uncheck();
  await page.getByLabel('Age in completed years').fill('22');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel(/bank account of your own/)).toHaveValue('no');
  await page.getByRole('button', { name: 'Show my matches' }).click();
  await expect(page.getByText('Check the official page for required documents')).toBeVisible();
  await expect(page.getByText('Ask at a Bank Mitra outlet.')).toBeVisible();
  expect(writes[1]).toEqual({ answers: {}, profile: { age: 22, bankAccount: 'no' } });
});
