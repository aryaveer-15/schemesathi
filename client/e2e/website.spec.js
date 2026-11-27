import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { schemeQuestions } from '../src/eligibilityContent.js';
import { additionalTranslations, dictionaries } from '../src/locales/index.js';
import { localizedScheme, translatedScheme } from '../src/schemeText.js';
import { unknownAnswer } from '../src/helpTopics.js';

const catalog = createRequire(import.meta.url)('../../server/catalog.js');
const { questionnaire, documentChecklists } = createRequire(import.meta.url)('../../server/questionnaire.js');
const legacyChecks = createRequire(import.meta.url)('../../server/legacyEligibilityChecks.js');

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
  await page.route(`**/api/schemes/${scheme.slug}`, (route) => route.fulfill({ json: scheme }));
  await page.route('**/api/eligibility/pm-ujjwala-yojana', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: legacyChecks[scheme.slug] });
    expect(route.request().postDataJSON()).toEqual({ answers: { adultWoman: 'yes', lpg: 'no', deprivation: 'yes' } });
    await route.fulfill({ json: {
      status: 'matched',
      checks: ['adultWoman', 'lpg', 'deprivation'].map((key) => ({ key, status: 'matched' })),
      sourceUrl: scheme.sourceUrl,
      nextSteps: {
        url: scheme.sourceUrl,
        online: 'Pick an LPG provider and start an application.',
        visit: 'You can also visit a participating LPG distributor.',
      },
      documents: documentChecklists[scheme.slug],
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
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('alert')).toContainText('Answer every question');
  await expect(page.getByLabel('Is the applicant a woman aged 18 or older?')).toBeFocused();
  await expect(page.getByLabel('Is the applicant a woman aged 18 or older?')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Is the applicant a woman aged 18 or older?').selectOption('yes');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Does anyone in the household already have an LPG connection?').selectOption('no');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Does the household qualify as poor under the official deprivation declaration?').selectOption('yes');
  await page.getByRole('button', { name: 'Check eligibility' }).click();
  await expect(page.getByRole('heading', { name: 'Likely matches' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the official portal' })).toHaveAttribute('href', scheme.sourceUrl);
  await expect(page.getByText('You can also visit a participating LPG distributor.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Source for this checklist' })).toHaveAttribute('href', scheme.sourceUrl);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('scheme details show the last review and where users must verify eligibility', async ({ page }) => {
  let lastVerifiedAt = null;
  let verificationKind = 'list-and-local';
  await page.route(`**/api/schemes/${scheme._id}`, (route) =>
    route.fulfill({ json: { ...scheme, lastVerifiedAt, verificationKind } }));
  await page.goto(`/schemes/${scheme._id}`);
  await expect(page.getByText('Last verified · Pending review')).toBeVisible();
  await expect(page.getByText('Check the official list and confirm your eligibility with the relevant local office.')).toBeVisible();

  lastVerifiedAt = '2026-11-25T00:00:00.000Z';
  verificationKind = null;
  await page.reload();
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-11-25');
  await expect(page.getByText('Last verified', { exact: false })).toContainText('Nov 25, 2026');
  await expect(page.getByText('Check the official list and confirm your eligibility with the relevant local office.')).toHaveCount(0);
});

test('recovers from an unavailable API and handles missing schemes', async ({ page }) => {
  let available = false;
  await page.route('**/api/schemes', (route) => available
    ? route.fulfill({ json: [scheme] })
    : route.abort('failed'));
  await page.route(`**/api/schemes/${scheme.slug}`, (route) => route.fulfill({ status: 404, json: {} }));
  await page.goto('/schemes');
  await expect(page.getByRole('alert')).toContainText('Could not load');
  available = true;
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('link', { name: scheme.title.en }).click();
  await expect(page.getByRole('alert').getByText('Scheme not found', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert').getByRole('link', { name: 'Browse schemes' })).toHaveAttribute('href', '/schemes');
  await expect(page.getByRole('link', { name: 'Back to schemes' })).toBeVisible();
});

test('keeps the selected language and clears expired sign-ins', async ({ page }) => {
  await page.route('**/api/auth/session', (route) => route.fulfill({ status: 401, json: {} }));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('test-session-loaded')) {
      localStorage.setItem('schemesathi.auth', JSON.stringify({ token: 'expired-test-token', user: { name: 'Test User' } }));
      sessionStorage.setItem('test-session-loaded', '1');
    }
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await page.getByText('Sign-in has changed. Please sign in again to continue.').waitFor();
  expect(await page.evaluate(() => localStorage.getItem('schemesathi.auth'))).toBeNull();
  await page.getByLabel('Language').selectOption('hi');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'सरकारी योजनाएँ खोजें' })).toBeVisible();
  await page.getByLabel('भाषा').selectOption('kn');
  await expect(page.getByRole('heading', { name: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('all added languages translate the site, catalog, and eligibility forms', async ({ page }) => {
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme] }));
  await page.route('**/api/eligibility/*', (route) =>
    route.fulfill({ json: legacyChecks[new URL(route.request().url()).pathname.split('/').at(-1)] }));
  await page.goto('/');
  const language = page.getByRole('banner').getByRole('combobox');
  for (const [code, copy] of Object.entries(additionalTranslations)) {
    await language.selectOption(code);
    await expect(page.getByRole('heading', { name: copy.homeTitle })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.locator('html')).toHaveAttribute('dir', code === 'ur' ? 'rtl' : 'ltr');
    for (const [slug, { questions }] of Object.entries(schemeQuestions)) {
      expect(translatedScheme(slug, code)).toBeTruthy();
      const entry = catalog.find((item) => item.slug === slug);
      expect(localizedScheme(entry, 'summary', code)).toBe(entry.summary.en);
      for (const key of Object.keys(questions)) {
        expect(copy[key], `${code} uses source English while ${slug} question ${key} awaits review`).toBe(dictionaries.en[key]);
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
  await expect(page.getByLabel(dictionaries.en.pensionAge)).toBeVisible();
  await expect(page.getByText(additionalTranslations.ur.translationUnderReview)).toBeVisible();
  await page.getByRole('button', { name: additionalTranslations.ur.nextQuestion }).click();
  await expect(page.getByRole('alert')).toHaveText(additionalTranslations.ur.answerRequired);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('registration opens the match questionnaire', async ({ page }) => {
  const user = { name: 'Demo Resident' };
  let registered = false;
  await page.route('**/api/auth/register', (route) => {
    registered = true;
    return route.fulfill({ status: 201, headers: { 'Set-Cookie': 'schemesathi_session=demo-token; Path=/api; HttpOnly; SameSite=Lax' }, json: { user } });
  });
  await page.route('**/api/auth/session', (route) => route.fulfill(registered ? { json: { user } } : { status: 401, json: {} }));
  const fields = {
    'pm-matru-vandana': ['maternityStage'],
    'atal-pension-yojana': ['citizen', 'savings'],
    'pm-surya-ghar': ['citizen', 'solarConnection'],
    'nps-vatsalya': ['minorAge'],
    'pm-awas-gramin': ['ruralHousingList'],
    pmjjby: ['age', 'savings', 'autoDebit'],
  };
  const plan = Object.entries(fields).map(([slug, keys]) => {
    const entry = questionnaire.find((item) => item.slug === slug);
    return { ...entry, criteria: Object.fromEntries(keys.map((key) => [key, entry.criteria[key]])) };
  });
  await page.route('**/api/eligibility/questionnaire', (route) => route.fulfill({ json: plan }));
  await page.route('**/api/eligibility/matches', async (route) => {
    expect(await route.request().headerValue('cookie')).toContain('schemesathi_session=demo-token');
    expect(route.request().headers().authorization).toBeUndefined();
    expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage, location.href, document.cookie]))).not.toContain('demo-token');
    expect(route.request().postDataJSON()).toEqual({
      answers: {},
      profile: {
        maternityStage: 'yes', age: 34, citizen: 'yes', savings: 'yes', autoDebit: 'yes',
        solarConnection: 'yes', minorAge: 12, ruralHousingList: 'unknown',
      },
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
        nextSteps: { visit: 'Ask your participating bank or post office for the enrolment form.' },
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
  for (const label of [
    /first living child/, 'Age in completed years', 'Are you an Indian citizen?',
    /personal savings account/, /willing to pay the insurance premium/,
    /residential grid connection/, 'Age of the child being checked, in completed years',
  ]) {
    const input = page.locator('form').getByLabel(label);
    if (await input.getAttribute('type') === 'number') await input.fill(label === 'Age in completed years' ? '34' : '12');
    else await input.selectOption('yes');
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await page.getByLabel(/confirmed that your household is on the approved PMAY-G/).selectOption('unknown');
  await page.getByRole('button', { name: 'Show my matches' }).click();
  await expect(page.getByRole('heading', { name: 'Possible matches, needs verification' })).toBeVisible();
  await expect(page.getByText('Ask your Gram Panchayat to check the beneficiary list.')).toBeVisible();
  await expect(page.getByText('Ask your participating bank or post office for the enrolment form.')).toBeVisible();
  const solar = page.getByRole('article').filter({ has: page.getByRole('heading', { name: /PM Surya Ghar/ }) });
  await expect(solar.getByRole('link', { name: 'Read the official criteria' })).toHaveAttribute('href', 'https://pmsuryaghar.gov.in/');
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
  await expect(page.locator('.chat-message-answer').getByText(unknownAnswer)).toBeVisible();
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
  await page.route('**/api/schemes/odisha-sample', (route) => route.fulfill({ json: stateScheme }));
  await page.goto('/schemes');
  await page.getByLabel('All states and union territories', { exact: true }).selectOption('Odisha');
  await expect(page.getByRole('link', { name: scheme.title.en })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Karnataka scheme' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Odisha scheme' }).click();
  await expect(page.getByRole('region', { name: 'Who may qualify' })).toContainText('Applicants must live in Odisha.');
  await expect(page.getByRole('link', { name: 'Check on the official portal' })).toHaveAttribute('href', scheme.sourceUrl);
});

test('every scheme has a catalog banner and detail pages reuse the same photo', async ({ page }) => {
  const scholarshipSlugs = [
    'national-means-merit-scholarship', 'pm-usp-college-scholarship', 'aicte-pragati',
    'aicte-saksham', 'aicte-swanath', 'wb-svmcm', 'wb-kanyashree', 'tn-pudhumai-penn',
  ];
  const schemes = catalog.map((entry) => ({ ...entry, _id: entry.slug }));
  await page.route('**/api/schemes', (route) => route.fulfill({ json: schemes }));
  await page.route('**/api/schemes/*', (route) => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1);
    return route.fulfill({ json: schemes.find((entry) => entry.slug === slug) });
  });
  await page.goto('/schemes');
  const photos = page.locator('.scheme-card .scheme-banner img');
  await expect(photos.first()).toBeVisible();
  const showMore = page.getByRole('button', { name: 'Show more schemes' });
  while (await showMore.isVisible()) await showMore.click();
  await expect(photos).toHaveCount(schemes.length);
  const sources = await photos.evaluateAll((images) => images.map((image) => image.src));
  const attributes = await photos.evaluateAll((images) => images.map((image) => ({
    loading: image.loading, alt: image.alt, width: image.getAttribute('width'), height: image.getAttribute('height'),
    lang: image.lang, source: image.src,
  })));
  for (const [index, { loading, alt, width, height, lang, source }] of attributes.entries()) {
    expect(loading).toBe(index === 0 ? 'eager' : 'lazy');
    expect(alt.trim().split(/\s+/).length).toBeGreaterThan(3);
    expect(lang).toBe('en');
    expect([width, height]).toEqual(['1280', '640']);
    expect(new URL(source).pathname).toMatch(/\.webp$/);
  }
  await expect(photos.first()).toHaveAttribute('fetchpriority', 'high');
  await expect(photos.first()).toHaveAttribute('srcset', /256w.*640w.*960w.*1280w/);
  const scholarshipSources = scholarshipSlugs.map((slug) => sources[schemes.findIndex((entry) => entry.slug === slug)]);
  expect(new Set(scholarshipSources).size).toBe(scholarshipSlugs.length);
  for (const slug of ['aicte-pragati', 'pm-kisan', 'pm-surya-ghar']) {
    const index = schemes.findIndex((entry) => entry.slug === slug);
    await page.goto(`/schemes/${slug}`);
    const detailPhoto = page.locator('.scheme-detail .scheme-banner img');
    await expect(detailPhoto).toBeVisible();
    await expect(detailPhoto).toHaveAttribute('loading', 'eager');
    await expect(detailPhoto).toHaveAttribute('fetchpriority', 'high');
    await expect(detailPhoto).toHaveAttribute('alt', attributes[index].alt);
    await expect.poll(() => detailPhoto.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    const imageWidth = await detailPhoto.evaluate(async (image) => {
      const bitmap = await createImageBitmap(await (await fetch(image.currentSrc)).blob());
      const width = bitmap.width;
      bitmap.close();
      return width;
    });
    expect([640, 960, 1280]).toContain(imageWidth);
    await expect(detailPhoto).toHaveAttribute('srcset', /256w.*640w.*960w.*1280w/);
    expect(await detailPhoto.evaluate((image) => image.src)).toBe(sources[index]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
});

test('cookie sign-in survives reload, failed logout offers retry, successful logout clears the session', async ({ page, context }) => {
  const user = { name: 'Cookie resident' };
  const token = 'browser-session-fixture';
  const urls = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.route('**/api/auth/session', async (route) => {
    const cookie = await route.request().headerValue('cookie');
    return route.fulfill({ json: { user: cookie?.includes(token) ? user : null } });
  });
  await page.route('**/api/auth/login', (route) => {
    expect(route.request().headers()['x-schemesathi-request']).toBe('1');
    return route.fulfill({ headers: { 'Set-Cookie': 'schemesathi_session=' + token + '; HttpOnly; Path=/api; SameSite=Lax' }, json: { user } });
  });
  let failLogout = true;
  await page.route('**/api/auth/logout', (route) => {
    expect(route.request().headers()['x-schemesathi-request']).toBe('1');
    return failLogout ? route.abort() : route.fulfill({ status: 204, headers: {
      'Set-Cookie': 'schemesathi_session=; Max-Age=0; Path=/api; HttpOnly; SameSite=Lax',
    } });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('resident@example.org');
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('main').getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText(user.name)).toBeVisible();
  await page.reload();
  await expect(page.getByText(user.name)).toBeVisible();
  expect((await context.cookies()).find((cookie) => cookie.value === token)?.httpOnly).toBe(true);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage, location.href]))).not.toContain(token);
  const logout = page.getByRole('button', { name: /log out/i });
  await logout.click();
  await expect(page.getByText(/sign-out could not be confirmed/i)).toBeVisible();
  failLogout = false;
  await logout.click();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Log in' })).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.value === token)).toBe(false);
  expect(urls.join(' ')).not.toContain(token);
});

for (const [path, selector] of [['/', '.home-intro'], ['/schemes', '.scheme-list'],
  ['/schemes/' + scheme.slug, '.scheme-detail'], ['/my-schemes', '.questionnaire-page']]) {
  test('slow session restoration keeps content in place on ' + path, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    let releaseSession;
    const waiting = new Promise((resolve) => { releaseSession = resolve; });
    await page.route('**/api/auth/session', async (route) => {
      await waiting;
      await route.fulfill({ json: { user: { name: 'Demo Resident' } } });
    });
    let questionnaires = 0;
    await page.route('**/api/eligibility/questionnaire', (route) => {
      questionnaires++;
      return route.fulfill({ json: questionnaire });
    });
    await page.route('**/api/schemes', (route) => route.fulfill({ json: [scheme] }));
    await page.route('**/api/schemes/' + scheme.slug, (route) => route.fulfill({ json: scheme }));
    await page.goto(path);
    const content = page.locator(selector);
    try {
      await expect(content).toBeVisible();
      if (path === '/my-schemes') {
        await expect(content.getByRole('status')).toBeVisible();
        expect(questionnaires).toBe(0);
      }
      const top = (await content.boundingBox()).y;
      releaseSession();
      await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
      if (path === '/my-schemes') await expect(page.locator('#question-heading')).toBeVisible();
      expect((await content.boundingBox()).y).toBe(top);
    } finally {
      releaseSession();
    }
  });
}

test('touching Find my schemes warms route code without sending answers or opening the form', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push({ path: new URL(request.url()).pathname, method: request.method() }));
  await page.route('**/api/auth/session', (route) => route.fulfill({ json: { user: null } }));
  await page.goto('/');
  const link = page.locator('.home-actions a[href="/my-schemes"]');
  await link.focus();
  await link.dispatchEvent('pointerenter', { pointerType: 'mouse' });
  expect(requests.some(({ path }) => path.endsWith('/pages/FindSchemes.jsx'))).toBe(false);
  const chunk = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith('/pages/FindSchemes.jsx'));
  await link.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await chunk;
  await expect(page).toHaveURL(/\/$/);
  expect(requests.every(({ path, method }) => method === 'GET' && !path.startsWith('/api/eligibility'))).toBe(true);
});
