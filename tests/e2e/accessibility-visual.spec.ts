import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { disableAutomaticPagination, waitForStablePage } from './support';

const corePages = ['/zh', '/zh/photography/landscape/', '/zh/research', '/zh/resume'] as const;

test('core pages have no serious or critical axe violations', async ({ page }) => {
  await disableAutomaticPagination(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of corePages) {
    await page.goto(path);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await waitForStablePage(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(({ impact }) =>
      impact === 'critical' || impact === 'serious',
    );
    expect(blocking, `${path}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  }
});

test('key pages match their light-theme visual baselines', async ({ page }) => {
  await disableAutomaticPagination(page);
  await page.addInitScript(() => localStorage.setItem('wfpwt-theme', 'light'));

  for (const path of corePages) {
    await page.goto(path);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await waitForStablePage(page);
    const snapshotName = path.includes('photography')
      ? 'photography.png'
      : path.includes('research')
        ? 'research.png'
        : path.includes('resume')
          ? 'resume.png'
          : 'home.png';
    await expect(page).toHaveScreenshot(snapshotName, { fullPage: true });
  }
});
