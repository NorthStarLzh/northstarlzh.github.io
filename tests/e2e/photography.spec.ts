import { expect, test } from '@playwright/test';

import {
  disableAutomaticPagination,
  swipeViewerLeft,
} from './support';

test('scrolling progressively loads another photography page', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Hydration failed')) {
      hydrationErrors.push(message.text());
    }
  });
  await page.goto('/zh/photography?category=landscape');
  const cards = page.locator('.photography-card__button');
  await expect(cards).toHaveCount(20);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => cards.count()).toBeGreaterThan(20);
  await expect(page).toHaveURL(/category=landscape/);
  expect(hydrationErrors).toEqual([]);
});

test('pagination failure retains photos, retry succeeds, and category change cannot mix stale photos', async ({ page }) => {
  await disableAutomaticPagination(page);
  await page.goto('/zh/photography?category=landscape');
  const cards = page.locator('.photography-card__button');
  await expect(cards).toHaveCount(20);

  await page.route('**/api/photos?**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'CONTENT_UNAVAILABLE', message: 'Injected E2E failure' },
      }),
    });
  }, { times: 1 });
  await page.getByRole('button', { name: '加载更多' }).click();
  await expect(page.locator('.photography-feed__status[role="alert"]')).toContainText('加载失败');
  await expect(cards).toHaveCount(20);

  await page.getByRole('button', { name: '重试' }).click();
  await expect(cards).toHaveCount(40);

  await page.route('**/api/photos?category=landscape**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  }, { times: 1 });
  await page.getByRole('button', { name: '加载更多' }).click();
  await page.getByRole('link', { name: '人像' }).click();
  await expect(page).toHaveURL(/category=portrait/);
  await expect(cards).toHaveCount(20);
  await expect(page.locator('[data-photo-id="fixture-photo-002"]')).toBeVisible();
  await expect(page.locator('[data-photo-id="fixture-photo-003"]')).toHaveCount(0);
});

test('viewer zooms, navigates, prefetches near the end, and restores focus', async ({ page }, testInfo) => {
  await disableAutomaticPagination(page);
  await page.goto('/zh/photography?category=landscape');
  const cards = page.locator('.photography-card__button');
  const first = cards.first();
  await first.click();
  await expect(page.locator('.photo-viewer-lightbox')).toBeVisible();
  const activeCaption = () => page.locator('.yarl__slide').evaluateAll((slides) => {
    const viewportCenter = window.innerWidth / 2;
    const activeSlide = [...slides].sort((left, right) => {
      const leftRect = left.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      const leftDistance = Math.abs(leftRect.left + leftRect.width / 2 - viewportCenter);
      const rightDistance = Math.abs(rightRect.left + rightRect.width / 2 - viewportCenter);
      return leftDistance - rightDistance;
    })[0];
    return activeSlide?.textContent ?? '';
  });
  await expect.poll(activeCaption).toContain('摄影作品 1');
  await page.getByRole('button', { name: '放大' }).click();
  await page.getByRole('button', { name: '缩小' }).click();
  await page.waitForTimeout(250);

  if (testInfo.project.name === 'mobile') {
    await swipeViewerLeft(page);
  } else {
    await page.keyboard.press('ArrowRight');
  }
  await expect.poll(activeCaption).not.toContain('摄影作品 1。');
  await page.keyboard.press('Escape');
  await expect(page.locator('.photo-viewer-lightbox')).toHaveCount(0);
  await expect(first).toBeFocused();

  const nearEnd = cards.nth(18);
  await nearEnd.click();
  await expect(page.locator('.photo-viewer-lightbox')).toBeVisible();
  await expect.poll(() => cards.count()).toBeGreaterThan(20);
  await page.keyboard.press('Escape');
  await expect(nearEnd).toBeFocused();
});
