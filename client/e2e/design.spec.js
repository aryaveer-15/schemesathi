import { test, expect } from '@playwright/test';
import { dictionaries } from '../src/locales/index.js';

const sampleScheme = {
  _id: 'housing', slug: 'pm-awas-gramin', title: { en: 'Pradhan Mantri Awas Yojana – Gramin' },
  summary: { en: 'Housing assistance for eligible rural households to build a pucca home.' },
  state: 'All India', category: 'housing', eligibilityMode: 'profile',
};

function relativeLuminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((channel) => {
    const level = Number.parseInt(channel, 16) / 255;
    return level <= 0.04045 ? level / 12.92 : ((level + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(a, b) {
  const values = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('text, control edges and focus tokens meet AA against their light and dark surfaces', async ({ page }) => {
  const surfaces = ['background', 'surface', 'violet-tint', 'error-bg'];
  const textPairs = [
    ...['ink', 'muted', 'violet', 'violet-hover', 'violet-active'].flatMap((text) => surfaces.map((surface) => [text, surface])),
    ['violet', 'violet-pressed'], ['ink', 'violet-pressed'],
    ['on-violet', 'violet'], ['on-violet', 'violet-hover'], ['on-violet', 'violet-active'],
    ['hero-ink', 'hero'], ['hero-muted', 'hero'], ['on-saffron', 'saffron'], ['on-saffron', 'saffron-hover'],
    ['on-saffron', 'saffron-active'], ['success', 'success-bg'], ['review', 'review-bg'],
    ['error', 'error-bg'], ['disabled', 'disabled-bg'],
  ];
  const controlPairs = [
    ...surfaces.map((surface) => ['focus', surface]), ['focus-on-violet', 'hero'],
    ...surfaces.map((surface) => ['control-border', surface]), ['hero-rule', 'hero'],
    ['error', 'background'], ['error', 'surface'], ['violet', 'background'], ['violet', 'surface'],
  ];
  const names = [...new Set([...textPairs, ...controlPairs].flat())];
  await page.goto('/');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    const colors = await page.evaluate((keys) => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(keys.map((name) => [name, style.getPropertyValue(`--${name}`).trim()]));
    }, names);
    for (const [pairs, threshold] of [[textPairs, 4.5], [controlPairs, 3]]) {
      for (const [foreground, background] of pairs) {
        expect(contrast(colors[foreground], colors[background]), `${colorScheme} ${foreground} on ${background}`)
          .toBeGreaterThanOrEqual(threshold);
      }
    }
    const toRgb = (hex) => `rgb(${hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16)).join(', ')})`;
    const hero = page.getByRole('region', { name: 'Find government schemes' });
    await expect(hero).toHaveCSS('background-image', 'none');
    await expect(page.locator('body')).toHaveCSS('background-image', 'none');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCSS('outline-color', toRgb(colors.focus));
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const mainAction = hero.getByRole('link', { name: 'Find my schemes' });
    await expect(mainAction).toBeFocused();
    await expect(mainAction).toHaveCSS('outline-color', toRgb(colors['focus-on-violet']));
    await expect(mainAction).toHaveCSS('transition-property', 'none');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
  }
});

test('a slow catalogue shows a static skeleton and an empty search has a recovery action', async ({ page }) => {
  let allowResponse;
  const response = new Promise((resolve) => { allowResponse = resolve; });
  await page.route('**/api/schemes', async (route) => {
    await response;
    return route.fulfill({ json: [sampleScheme] });
  });
  await page.goto('/schemes');
  const skeleton = page.locator('.skeleton-items');
  await expect(skeleton).toBeVisible();
  await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  await expect(skeleton).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('status')).toContainText('Loading');
  allowResponse();
  await expect(page.locator('.scheme-list > li')).toHaveCount(1);
  await expect(skeleton).toHaveCount(0);
  const search = page.getByRole('searchbox');
  await search.fill('no-eligible-results-here');
  await expect(page.getByRole('status')).toHaveText('No schemes found');
  await page.getByRole('button', { name: 'Browse schemes' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('link', { name: sampleScheme.title.en })).toBeVisible();
});

for (const code of ['hi', 'ta', 'ur']) {
  test(`${code} catalogue typography and row layout fit 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.addInitScript((lang) => localStorage.setItem('schemesathi.language', lang), code);
    await page.route('**/api/schemes', (route) => route.fulfill({ json: [sampleScheme] }));
    await page.goto('/schemes');
    const heading = page.getByRole('heading', { name: dictionaries[code].schemes });
    await expect(heading).toBeVisible();
    const summary = page.getByText(sampleScheme.summary.en);
    await expect(summary).toHaveCSS('font-size', '16px');
    await expect(summary).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('dir', code === 'ur' ? 'rtl' : 'ltr');
    const row = page.locator('.scheme-list > li');
    await expect(row).toHaveCSS('display', 'grid');
    const [label, photo] = await Promise.all([row.locator('.scheme-card-copy').boundingBox(), row.locator('img').boundingBox()]);
    expect(code === 'ur' ? label.x < photo.x : label.x > photo.x).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  });
}
