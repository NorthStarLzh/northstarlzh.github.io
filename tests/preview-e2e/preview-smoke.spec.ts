import {expect, test} from '@playwright/test';

test('deployed Preview serves the bilingual public routes', async ({page}) => {
  for (const path of ['/zh', '/en', '/zh/photography', '/zh/research', '/zh/resume']) {
    const response = await page.goto(path, {waitUntil: 'domcontentloaded'});
    expect(response, `${path} did not return a document response`).not.toBeNull();
    expect(response?.status(), `${path} returned an error response`).toBeLessThan(400);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('自动化测试');
    await expect(page.locator('body')).not.toContainText('Automated test');
  }
});

test('deployed Preview exposes the read-only photo contract and Studio boundary', async ({request}) => {
  const photos = await request.get('/api/photos?category=landscape&locale=zh');
  expect(photos.status()).toBe(200);
  const result = await photos.json();
  expect(Array.isArray(result.items)).toBe(true);
  expect(typeof result.hasMore).toBe('boolean');

  const studio = await request.get('/studio');
  expect(studio.status()).toBeLessThan(400);
  expect(await studio.text()).not.toContain('studio-placeholder');
});
