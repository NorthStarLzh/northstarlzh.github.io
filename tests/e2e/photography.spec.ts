import { expect, test } from '@playwright/test';

import { swipeViewerLeft } from './support';

test('numbered pagination navigates between statically exported pages', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Hydration failed')) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto('/zh/photography/landscape/');
  const cards = page.locator('.photography-card__button');
  await expect(page.locator('.photography-overview')).toBeVisible();
  await expect(cards).toHaveCount(20);

  // First page: previous is disabled, current pill is marked, next is a link.
  await expect(page.getByRole('link', { name: /上一页/ })).toHaveCount(0);
  await expect(page.getByText('第 1 页，共 … 页')).toBeAttached();
  await expect(page.locator('.photography-feed__page-number[aria-current="page"]')).toHaveText('1');
  await expect(page.getByRole('link', { name: '2', exact: true })).toBeVisible();

  // Navigate to page two.
  await page.getByRole('link', { name: /下一页/ }).click();
  await expect(page).toHaveURL(/\/photography\/landscape\/2/);
  await expect(cards).toHaveCount(20);
  await expect(page.locator('.photography-feed__page-number[aria-current="page"]')).toHaveText('2');
  await expect(page.getByRole('link', { name: /上一页/ })).toBeVisible();

  expect(hydrationErrors).toEqual([]);
});

test('collections tab lists curated collections and opens their detail pages', async ({ page }) => {
  await page.goto('/zh/photography/landscape/');
  const collectionsLink = page.getByRole('link', { name: '合集' });
  await expect(collectionsLink).toHaveAttribute('href', '/zh/photography/collections/');

  await collectionsLink.click();
  await expect(page).toHaveURL(/\/photography\/collections/);
  const cards = page.locator('.collection-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('4 张照片');

  await cards.first().locator('.collection-card__link').click();
  await expect(page).toHaveURL(/\/photography\/collections\/zhejiang-university/);
  await expect(page.locator('.photography-justified')).toBeVisible();
  await expect(page.locator('.photography-card__button')).toHaveCount(4);
  await expect(page.locator('.photography-filter__link[aria-current="true"]')).toHaveText('合集');
});

test('viewer zooms, navigates with keys and touch, and restores focus', async ({ page }, testInfo) => {
  await page.goto('/zh/photography/landscape/');
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
  await expect(page.locator('.yarl__counter')).toHaveText('1 / 20');
  await page.getByRole('button', { name: '放大' }).click();
  await page.getByRole('button', { name: '缩小' }).click();
  await page.waitForTimeout(250);

  if (testInfo.project.name === 'mobile') {
    await swipeViewerLeft(page);
  } else {
    await page.keyboard.press('ArrowRight');
  }
  await expect.poll(activeCaption).not.toContain('摄影作品 1。');
  await expect(page.locator('.yarl__counter')).toHaveText('2 / 20');
  await page.keyboard.press('Escape');
  await expect(page.locator('.photo-viewer-lightbox')).toHaveCount(0);
  await expect(first).toBeFocused();
});
