import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __sawReducedIntro: boolean;
  }
}

test('research dialogs cover one to three images, long scrolling, Escape, and focus return', async ({ page }) => {
  await page.goto('/zh/research');
  const cards = page.locator('.research-card__button');
  await expect(cards).toHaveCount(4);

  for (const imageCount of [1, 2, 3]) {
    const trigger = cards.nth(imageCount - 1);
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.research-dialog__images')).toHaveAttribute(
      'data-image-count',
      String(imageCount),
    );
    await expect(dialog.locator('a')).toHaveCount(0);

    if (imageCount === 3) {
      const body = dialog.locator('.ds-dialog-body');
      await expect.poll(() => body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
      await body.evaluate((element) => element.scrollTo(0, element.scrollHeight));
      await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await page.keyboard.press('Tab');
      await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test('resume page serves the portfolio and résumé PDF downloads', async ({ page }) => {
  await page.goto('/zh/resume');

  const portfolio = page.getByRole('link', { name: '下载个人作品集' });
  await expect(portfolio).toHaveAttribute('download', 'wind-flower-poetry-wine-tea-portfolio.pdf');
  await expect(portfolio).toHaveAttribute('href', '/portfolio.pdf');

  const resume = page.getByRole('link', { name: '下载个人简历' });
  await expect(resume).toHaveAttribute('download', 'wind-flower-poetry-wine-tea-resume.pdf');
  await expect(resume).toHaveAttribute('href', '/resume.pdf');

  const downloadPromise = page.waitForEvent('download');
  await resume.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('wind-flower-poetry-wine-tea-resume.pdf');

  await page.goto('/zh/contact');
  const contact = page.getByTestId('contact-section');
  await expect(contact.locator('a')).toHaveCount(1);
  await expect(contact.locator('a')).toHaveAttribute('href', 'mailto:portfolio-owner@example.com');
  await expect(contact.locator('form')).toHaveCount(0);
});

test('reduced motion uses a fade-only intro and disables scroll reveal movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.__sawReducedIntro = false;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const addedNode of record.addedNodes) {
          if (
            addedNode instanceof HTMLElement &&
            (addedNode.dataset.introMotion === 'reduced' ||
              addedNode.querySelector('[data-intro-motion="reduced"]'))
          ) {
            window.__sawReducedIntro = true;
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/zh', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__sawReducedIntro)).toBe(true);
  await expect(page.locator('[data-intro-motion="full"]')).toHaveCount(0);
  await expect(page.getByTestId('intro-animation')).toHaveCount(0, { timeout: 1_100 });

  const heroCopy = page.getByTestId('home-hero-copy');
  await expect(heroCopy).toHaveCSS('animation-name', 'none');
  await expect(heroCopy).toHaveCSS('transform', 'none');
});
