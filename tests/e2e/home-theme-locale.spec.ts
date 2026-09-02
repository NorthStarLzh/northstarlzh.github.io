import { expect, test } from '@playwright/test';

import {
  disableAutomaticPagination,
  openResponsiveControls,
} from './support';

test('Chinese home completes its intro and exposes the hero cover', async ({ page }) => {
  const startedAt = Date.now();
  await page.goto('/zh', { waitUntil: 'domcontentloaded' });

  const intro = page.getByTestId('intro-animation');
  await intro.waitFor({ state: 'attached', timeout: 1_500 });
  await intro.waitFor({ state: 'detached', timeout: 1_100 });
  expect(Date.now() - startedAt).toBeLessThan(4_000);

  const hero = page.getByTestId('home-hero');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveAttribute('data-image-source', 'hero');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('自动化测试');
  await expect(page.getByTestId('home-hero-copy')).toContainText('自动化测试');

  const title = page.getByTestId('home-hero-copy').getByRole('heading');
  await expect.poll(() => title.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return element.scrollWidth <= element.clientWidth && range.getClientRects().length === 1;
  })).toBe(true);

  const identity = page.getByTestId('home-hero-copy').locator('p');
  await expect.poll(() => identity.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return element.scrollWidth <= element.clientWidth && range.getClientRects().length === 1;
  })).toBe(true);
});

test('theme follows the system, cycles manually, and persists after refresh', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/zh');
  await openResponsiveControls(page, 'zh');

  let toggle = page.getByRole('button', { name: /当前主题:/ });
  await expect(toggle).toHaveAttribute('data-theme-mode', 'system');
  await expect(toggle).toHaveAttribute('data-resolved-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('wfpwt-theme'))).toBe('light');

  await page.reload();
  await openResponsiveControls(page, 'zh');
  toggle = page.getByRole('button', { name: /当前主题:/ });
  await expect(toggle).toHaveAttribute('data-theme-mode', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('locale switch preserves page, portrait category, hash, and localized content', async ({ page }) => {
  await disableAutomaticPagination(page);
  await page.goto('/zh/photography/portrait/#gallery');
  await expect(page.getByRole('link', { name: '人像' })).toHaveAttribute('aria-current', 'true');
  await openResponsiveControls(page, 'zh');
  await page.getByRole('button', { name: /切换到英文/ }).click();

  await expect(page).toHaveURL(/\/en\/photography\/portrait\/?#gallery/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Making memories traceable' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Portrait' })).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.photography-card__button').first()).toHaveAccessibleName(/Automated test image/);

  await openResponsiveControls(page, 'en');
  await page.getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/en\/contact\/?$/);
  await expect(
    page.getByTestId('contact-section').getByRole('link', { name: /portfolio-owner@example\.com/ }),
  ).toBeVisible();
});
