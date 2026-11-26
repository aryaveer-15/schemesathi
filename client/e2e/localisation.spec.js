import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { dictionaries, languages } from '../src/locales/index.js';
import { localizedScheme } from '../src/schemeText.js';

const require = createRequire(import.meta.url);
const catalog = require('../../server/catalog');
const legacy = require('../../server/legacyEligibilityChecks');
const applications = require('../../server/applicationDirections');
const sourceScheme = catalog.find(({ slug }) => slug === 'pm-surya-ghar');
const slug = 'pm-ujjwala-yojana';

const scriptFonts = {
  en: 'Georgia',
  hi: 'Noto Sans Devanagari',
  mr: 'Noto Sans Devanagari',
  bn: 'Noto Sans Bengali',
  te: 'Noto Sans Telugu',
  ta: 'Noto Sans Tamil',
  gu: 'Noto Sans Gujarati',
  ur: 'Noto Nastaliq Urdu',
  kn: 'Noto Sans Kannada',
  or: 'Noto Sans Oriya',
  ml: 'Noto Sans Malayalam',
};

async function expectNoClipping(page) {
  const layout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const clips = [...document.querySelectorAll('h1,h2,h3,h4,p,button,.translation-note,nav a')].filter((element) => {
      if (!element.getClientRects().length) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.left < -1 || rect.right > viewport + 1
        || ((style.overflowX === 'hidden' || style.overflowX === 'clip') && element.scrollWidth > element.clientWidth + 1)
        || ((style.overflowY === 'hidden' || style.overflowY === 'clip') && element.scrollHeight > element.clientHeight + 1);
    }).map(({ textContent }) => textContent);
    return { width: document.documentElement.scrollWidth, viewport, clips };
  });
  expect(layout).toEqual({ width: 360, viewport: 360, clips: [] });
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/\b(?:results|errors|questions|application|chat)\.[a-z][a-zA-Z0-9_.]+\b|\{(?:current|total|min|max|officialUrl|answer)\}/);
}

for (const { code, direction } of languages) {
  test(`${code} fits the catalogue, critical text and chat at 360 px`, async ({ page }) => {
    const copy = dictionaries[code];
    const en = dictionaries.en;
    const entry = { ...sourceScheme, _id: 'solar', eligibilityMode: 'profile', application: applications[sourceScheme.slug] };
    const odisha = { ...catalog.find(({ slug }) => slug === 'odisha-subhadra'), _id: 'odisha', eligibilityMode: 'profile' };
    await page.setViewportSize({ width: 360, height: 780 });
    await page.route('**/api/schemes', (route) => route.fulfill({ json: [entry, odisha] }));
    await page.route('**/api/schemes/solar', (route) => route.fulfill({ json: entry }));
    await page.route(`**/api/eligibility/${slug}`, (route) => route.fulfill({
      json: route.request().method() === 'GET' ? legacy[slug] : {
        status: 'review',
        sourceUrl: legacy[slug].sourceUrl,
        checks: [{ key: 'adultWoman', status: 'review' }, { key: 'lpg', status: 'matched' }, { key: 'deprivation', status: 'matched' }],
      },
    }));
    await page.goto('/');
    const language = page.locator('header .lang select');
    await expect(language).toBeVisible();
    expect(await language.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height >= 44;
    })).toBe(true);
    await language.selectOption(code);
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.locator('html')).toHaveAttribute('dir', direction ?? 'ltr');
    await expect(page).toHaveTitle(copy.appName);
    const home = page.getByRole('heading', { name: copy.homeTitle });
    await expect(home).toBeVisible();
    expect(await home.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(scriptFonts[code]);
    expect(await page.evaluate(() => localStorage.getItem('schemesathi.language'))).toBe(code);
    await expectNoClipping(page);

    await page.goto('/schemes');
    await expect(language).toHaveValue(code);
    await expect(page.locator('#scheme-region option[value="Odisha"]')).toHaveText(copy.stateOdisha);
    await expect(page.getByText(entry.summary.en, { exact: true })).toHaveAttribute('lang', 'en');
    await expectNoClipping(page);
    await page.getByRole('link', { name: localizedScheme(entry, 'title', code) }).click();
    await expect(page.getByRole('region', { name: copy.eligibilityRequirements })).toContainText(sourceScheme.eligibilityRequirements[0].en);
    await expect(page.getByRole('link', { name: copy.openOfficialPortal })).toHaveAttribute('href', entry.application.url);
    await expect(page.getByText(entry.application.online, { exact: true })).toHaveAttribute('lang', 'en');
    await expect(page.locator('main .translation-note')).toHaveCount(code === 'en' ? 0 : 1);
    if (code !== 'en') await expect(page.getByText(copy.translationUnderReview)).toBeVisible();
    await expectNoClipping(page);

    await page.goto(`/eligibility?scheme=${slug}`);
    await expect(page.getByRole('heading', { name: en.adultWoman })).toHaveAttribute('lang', 'en');
    await page.getByLabel(en.adultWoman).selectOption('unknown');
    await page.getByRole('button', { name: copy.nextQuestion }).click();
    await page.getByLabel(en.lpg).selectOption('no');
    await page.getByRole('button', { name: copy.nextQuestion }).click();
    await page.getByLabel(en.deprivation).selectOption('yes');
    await expectNoClipping(page);
    await page.getByRole('button', { name: copy.eligibility }).click();
    await expect(page.getByRole('heading', { name: en.possibleMatches })).toHaveAttribute('dir', 'ltr');
    await expect(page.getByText(en.uncertainReason, { exact: true })).toBeVisible();
    await expect(page.getByText(en.adultWoman, { exact: false })).toBeVisible();
    await expectNoClipping(page);

    await page.goto('/scheme-chat?topic=apply');
    await expect(page.getByRole('heading', { name: copy.schemeChat })).toBeVisible();
    await expect(page.getByText(en.helpApplyAnswer, { exact: true })).toHaveAttribute('lang', 'en');
    if (code !== 'en') await expect(page.getByText(copy.translationUnderReview)).toBeVisible();
    await expectNoClipping(page);
  });
}
