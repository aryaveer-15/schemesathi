import { expect, test } from '@playwright/test';
import { schemeQuestions } from '../src/eligibilityContent.js';
import { additionalTranslations } from '../src/locales/index.js';
import { translatedScheme } from '../src/schemeText.js';

const scheme = {
  _id: '64f000000000000000000001',
  slug: 'pm-ujjwala-yojana',
  title: { en: 'Pradhan Mantri Ujjwala Yojana' },
  summary: { en: 'LPG connections for eligible households.' },
  category: 'women',
  state: 'All India',
  sourceUrl: 'https://www.pmuy.gov.in/Ujjwala2.html',
};

test('home, keyboard navigation, catalog and eligibility result', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme] }));
  await page.route(`**/api/schemes/${scheme._id}`, (route) => route.fulfill({ json: scheme }));
  await page.route('**/api/eligibility/pm-ujjwala-yojana', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { sourceUrl: scheme.sourceUrl } });
    expect(route.request().postDataJSON()).toEqual({ answers: { adultWoman: 'yes', lpg: 'no', deprivation: 'yes' } });
    await route.fulfill({ json: {
      status: 'matched',
      checks: ['adultWoman', 'lpg', 'deprivation'].map((key) => ({ key, status: 'matched' })),
      sourceUrl: scheme.sourceUrl,
    } });
  });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#content')).toBeFocused();
  await page.getByRole('link', { name: 'Browse schemes' }).click();
  await page.getByRole('searchbox').fill('ujjwala');
  await page.getByRole('link', { name: scheme.title.en }).click();
  await expect(page.getByRole('link', { name: 'Visit the official scheme website' })).toHaveAttribute('href', scheme.sourceUrl);
  await page.getByRole('main').getByRole('link', { name: 'Check eligibility' }).click();
  await expect(page.getByLabel('Scheme to check')).toHaveValue(scheme.slug);
  await page.getByRole('button', { name: 'Check eligibility' }).click();
  await expect(page.getByRole('alert')).toContainText('Answer every question');
  await expect(page.getByLabel('Is the applicant a woman aged 18 or older?')).toBeFocused();
  await expect(page.getByLabel('Is the applicant a woman aged 18 or older?')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Is the applicant a woman aged 18 or older?').selectOption('yes');
  await page.getByLabel('Does anyone in the household already have an LPG connection?').selectOption('no');
  await page.getByLabel('Does the household qualify as poor under the official deprivation declaration?').selectOption('yes');
  await page.getByRole('button', { name: 'Check eligibility' }).click();
  await expect(page.getByRole('heading', { name: 'Potential match' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('recovers from an unavailable API and handles missing schemes', async ({ page }) => {
  let available = false;
  await page.route('**/api/schemes', (route) => available
    ? route.fulfill({ json: [scheme] })
    : route.abort('failed'));
  await page.route(`**/api/schemes/${scheme._id}`, (route) => route.fulfill({ status: 404, json: {} }));
  await page.goto('/schemes');
  await expect(page.getByRole('alert')).toContainText('Could not load');
  available = true;
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('link', { name: scheme.title.en }).click();
  await expect(page.getByRole('alert')).toHaveText('Scheme not found');
  await expect(page.getByRole('link', { name: 'Back to schemes' })).toBeVisible();
});

test('keeps the selected language and clears expired sign-ins', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401, json: {} }));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('test-session-loaded')) {
      localStorage.setItem('schemesathi.auth', JSON.stringify({ token: 'expired-test-token', user: { name: 'Test User' } }));
      sessionStorage.setItem('test-session-loaded', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await page.getByLabel('Language').selectOption('hi');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'सरकारी योजनाएँ खोजें' })).toBeVisible();
  await page.getByLabel('भाषा').selectOption('kn');
  await expect(page.getByRole('heading', { name: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('all added languages translate the site, catalog, and eligibility forms', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme] }));
  await page.route('**/api/eligibility/*', (route) => route.fulfill({ json: { sourceUrl: scheme.sourceUrl } }));
  await page.goto('/');
  const language = page.getByRole('banner').getByRole('combobox');
  for (const [code, copy] of Object.entries(additionalTranslations)) {
    await language.selectOption(code);
    await expect(page.getByRole('heading', { name: copy.homeTitle })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.locator('html')).toHaveAttribute('dir', code === 'ur' ? 'rtl' : 'ltr');
    for (const [slug, { questions }] of Object.entries(schemeQuestions)) {
      expect(translatedScheme(slug, 'title', code)).toBeTruthy();
      expect(translatedScheme(slug, 'summary', code)).toBeTruthy();
      for (const key of Object.keys(questions)) {
        expect(copy[key], `${code} translation for ${slug} question ${key}`).toBeTruthy();
      }
    }
  }
  await language.selectOption('ur');
  await page.getByRole('link', { name: additionalTranslations.ur.browse }).click();
  await page.getByRole('searchbox').fill('اجولا');
  await expect(page.getByRole('link', { name: additionalTranslations.ur.ujjwalaTitle })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('navigation').getByRole('link', { name: additionalTranslations.ur.eligibility }).click();
  await expect(page.getByLabel(additionalTranslations.ur.pensionAge)).toBeVisible();
  await page.getByRole('button', { name: additionalTranslations.ur.eligibility }).click();
  await expect(page.getByRole('alert')).toHaveText(additionalTranslations.ur.answerRequired);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
