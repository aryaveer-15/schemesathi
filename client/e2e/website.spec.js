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
      application: {
        url: scheme.sourceUrl,
        online: 'Pick an LPG provider and start an application.',
        visit: 'You can also visit a participating LPG distributor.',
      },
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
  await expect(page.getByRole('link', { name: 'Open the official portal' })).toHaveAttribute('href', scheme.sourceUrl);
  await expect(page.getByText('You can also visit a participating LPG distributor.')).toBeVisible();
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

test('registration opens the match questionnaire', async ({ page }) => {
  const user = { name: 'Demo Resident' };
  await page.route('**/api/auth/register', (route) => route.fulfill({ status: 201, json: { token: 'demo-token', user } }));
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user } }));
  await page.route('**/api/eligibility/profile-checks', (route) => route.fulfill({ json: [{
    slug: 'pm-matru-vandana',
    title: { en: 'PMMVY maternity support' },
    sourceUrl: 'https://pmmvy.wcd.gov.in/',
    questions: [{ key: 'maternityStage', text: 'Is this for your first living child?' }],
  }] }));
  await page.route('**/api/eligibility/matches', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer demo-token');
    expect(route.request().postDataJSON()).toEqual({
      answers: {},
      profile: { citizen: 'yes', solarConnection: 'yes', minorAge: 12, ruralHousingList: 'unknown', maternityStage: 'yes' },
    });
    await route.fulfill({ json: {
      results: [{
        slug: 'atal-pension-yojana',
        status: 'review',
        checks: [{ key: 'citizen', status: 'matched' }, { key: 'savings', status: 'unanswered' }],
        sourceUrl: 'https://pfrda.org.in/',
      }, {
        slug: 'pm-surya-ghar',
        title: { en: 'PM Surya Ghar' },
        status: 'review',
        checks: [{ key: 'citizen', status: 'matched' }, { key: 'solarConnection', status: 'matched' }],
        sourceUrl: 'https://pmsuryaghar.gov.in/',
      }, {
        slug: 'pm-awas-gramin',
        title: { en: 'PMAY Gramin' },
        status: 'review',
        checks: [{ key: 'ruralHousingList', status: 'review' }],
        sourceUrl: 'https://pmayg.dord.gov.in/',
        verification: 'Ask your Gram Panchayat to check the beneficiary list.',
      }, {
        slug: 'pmjjby',
        title: { en: 'PMJJBY' },
        status: 'matched',
        checks: [],
        sourceUrl: 'https://www.indiapost.gov.in/insurance-services/pmjjby',
        application: { visit: 'Ask your participating bank or post office for the enrolment form.' },
      }],
      effectiveAnswers: { citizen: 'yes' },
    } });
  });
  await page.goto('/my-schemes?scheme=pm-matru-vandana');
  await expect(page).toHaveURL(/\/login\?scheme=pm-matru-vandana$/);
  await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
  await page.getByLabel('Name', { exact: true }).fill(user.name);
  await page.getByLabel('Email', { exact: true }).fill('test@example.test');
  await page.getByLabel('Password', { exact: true }).fill('example-password');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page).toHaveURL(/\/my-schemes\?scheme=pm-matru-vandana$/);
  await page.getByLabel('Is this for your first living child?').selectOption('yes');
  await page.getByRole('region', { name: 'About you' }).getByLabel('Are you an Indian citizen?').selectOption('yes');
  await page.getByText('PM Surya Ghar rooftop solar', { exact: true }).click();
  await page.getByLabel('Does the home have a residential grid connection with the local electricity distributor?').selectOption('yes');
  await page.getByText('NPS Vatsalya and child health screening', { exact: true }).click();
  await page.getByLabel('Age of the child being checked, in completed years').fill('12');
  await page.getByText('PMAY Gramin rural housing', { exact: true }).click();
  await page.getByLabel(/confirmed that your household is on the approved PMAY-G/).selectOption('unknown');
  await page.getByRole('button', { name: 'Show my matches' }).click();
  await expect(page.getByRole('heading', { name: 'Needs verification' })).toBeVisible();
  await expect(page.getByText('Ask your Gram Panchayat to check the beneficiary list.')).toBeVisible();
  await expect(page.getByText('Ask your participating bank or post office for the enrolment form.')).toBeVisible();
  await page.getByText('PM Surya Ghar', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Read the official criteria' }).last()).toHaveAttribute('href', 'https://pmsuryaghar.gov.in/');
});

test('guest help chat shows official scheme links without sending chat messages', async ({ page }) => {
  const network = [];
  page.on('request', (request) => network.push([request.method(), new URL(request.url()).pathname]));
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme] }));
  await page.goto('/scheme-chat');
  await expect(page.getByRole('heading', { name: 'Help chat' })).toBeVisible();
  await page.getByRole('button', { name: 'Where do I apply?' }).click();
  await expect(page.getByRole('link', { name: 'Browse schemes' })).toBeVisible();
  await page.getByLabel('Your question', { exact: true }).fill('Where do I apply for PMUY?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Visit the official scheme website' })).toHaveAttribute('href', scheme.sourceUrl);
  await page.getByLabel('Your question', { exact: true }).fill('Something unrelated');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Choose a topic below or type one of the listed scheme names.')).toBeVisible();
  expect(network.filter(([method, path]) => method !== 'GET' || path.startsWith('/api/chat'))).toEqual([]);
});

test('the homepage Help chat prompt opens the matching answer', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [] }));
  await page.goto('/');
  const help = page.getByRole('region', { name: 'Help chat' });
  await expect(help).toBeVisible();
  await help.getByRole('link', { name: 'Where do I apply?' }).click();
  await expect(page).toHaveURL(/\/scheme-chat\?topic=apply$/);
  await expect(page.getByText('Open a scheme and follow its official link for application instructions.')).toBeVisible();
});

test('state filters retain national listings and show official verification for unverified schemes', async ({ page }) => {
  const stateScheme = {
    ...scheme, _id: 'abc', slug: 'odisha-sample', title: { en: 'Odisha scheme' }, level: 'state', state: 'Odisha',
    eligibilityRequirements: [{ en: 'Applicants must live in Odisha.' }],
  };
  const other = { ...stateScheme, _id: 'xyz', slug: 'karnataka-sample', title: { en: 'Karnataka scheme' }, state: 'Karnataka' };
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme, stateScheme, other] }));
  await page.route('**/api/schemes/abc', (route) => route.fulfill({ json: stateScheme }));
  await page.goto('/schemes');
  await page.getByLabel('All states and union territories', { exact: true }).selectOption('Odisha');
  await expect(page.getByRole('link', { name: scheme.title.en })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Karnataka scheme' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Odisha scheme' }).click();
  await expect(page.getByRole('region', { name: 'Who may qualify' })).toContainText('Applicants must live in Odisha.');
  await expect(page.getByRole('link', { name: 'Check on the official portal' })).toHaveAttribute('href', scheme.sourceUrl);
});

test('scholarships have distinct photo banners in the catalog and on their detail page', async ({ page }) => {
  const slugs = [
    'national-means-merit-scholarship', 'pm-usp-college-scholarship', 'aicte-pragati',
    'aicte-saksham', 'aicte-swanath', 'wb-svmcm', 'wb-kanyashree', 'tn-pudhumai-penn',
  ];
  const scholarships = slugs.map((slug) => ({
    ...scheme, _id: slug, slug, title: { en: slug }, category: 'education',
  }));
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme, ...scholarships] }));
  await page.route('**/api/schemes/aicte-pragati', (route) => route.fulfill({ json: scholarships[2] }));
  await page.goto('/schemes');
  const photos = page.locator('.scheme-card .scholarship-banner img');
  await expect(photos).toHaveCount(8);
  const sources = await photos.evaluateAll((images) => images.map((image) => image.src));
  expect(new Set(sources).size).toBe(8);
  await page.getByRole('link', { name: 'aicte-pragati' }).click();
  const detailPhoto = page.locator('.scheme-detail .scholarship-banner img');
  await expect(detailPhoto).toBeVisible();
  await expect.poll(() => detailPhoto.evaluate((image) => image.naturalWidth)).toBe(1280);
  expect(await detailPhoto.evaluate((image) => image.src)).toBe(sources[2]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
