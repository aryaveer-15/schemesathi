import { test, expect } from '@playwright/test';

test('a failed lazy route keeps navigation available and reloads successfully', async ({ page }) => {
  const loaded = [];
  const chunk = '**/src/pages/Schemes.jsx*';
  page.on('request', (request) => loaded.push(new URL(request.url()).pathname));
  await page.route('**/api/schemes', (route) => route.fulfill({ json: [] }));
  await page.route(chunk, (route) => route.abort('failed'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find government schemes' })).toBeVisible();
  expect(loaded.some((url) => /\/pages\/(?:Schemes|SchemeChat)\.jsx$/.test(url))).toBe(false);

  await page.getByRole('navigation').getByRole('link', { name: 'Schemes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Information unavailable' })).toBeFocused();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.unroute(chunk);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page).toHaveURL(/\/schemes$/);
  await expect(page.getByRole('heading', { name: 'Schemes' })).toBeVisible();
});
