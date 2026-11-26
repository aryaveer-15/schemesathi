import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solar = require('../../server/catalog').find(({ slug }) => slug === 'pm-surya-ghar');
const scheme = { ...solar, _id: solar.slug };

test('a disabled banner keeps its dimensions in the catalogue and detail page', async ({ page }) => {
  let bannerDisabled = false;
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [{ ...scheme, bannerDisabled }] }));
  await page.route('**/api/schemes/pm-surya-ghar', (route) => route.fulfill({ json: { ...scheme, bannerDisabled } }));
  for (const path of ['/schemes', '/schemes/pm-surya-ghar']) {
    bannerDisabled = false;
    await page.goto(path);
    const banner = page.locator('.scheme-banner');
    await expect(banner.locator('img')).toBeVisible();
    const photo = await banner.boundingBox();
    bannerDisabled = true;
    await page.reload();
    await expect(banner).toHaveClass(/scheme-banner-fallback/);
    await expect(banner).toHaveAttribute('aria-hidden', 'true');
    await expect(banner.locator('img')).toHaveCount(0);
    await expect(banner).toBeVisible();
    const fallback = await banner.boundingBox();
    expect(fallback.width).toBeCloseTo(photo.width, 1);
    expect(fallback.height).toBeCloseTo(photo.height, 1);
  }
});
