import { expect, type Page } from '@playwright/test';

export async function disableAutomaticPagination(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: undefined,
    });
  });
}

export async function openResponsiveControls(
  page: Page,
  locale: 'zh' | 'en',
) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width >= 1_200) {
    await page.locator('[data-theme-mode]:visible').waitFor({ state: 'visible' });
    return;
  }

  const menuLabel = locale === 'zh' ? '打开菜单' : 'Open menu';
  await page.getByRole('button', { name: menuLabel }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

export async function waitForStablePage(page: Page) {
  await expect(page.getByTestId('intro-animation')).toHaveCount(0, {
    timeout: 2_000,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Native lazy-loading keeps below-fold images incomplete indefinitely, which
    // would stall this wait and leave blank tiles in full-page screenshots.
    // Promote any unfinished image to eager so the baseline captures every tile.
    for (const image of Array.from(document.images)) {
      if (!image.complete) {
        image.loading = 'eager';
        image.src = image.src;
      }
    }
    await Promise.all(
      Array.from(document.images, (image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }),
    );
  });
}

export async function swipeViewerLeft(page: Page) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 350, y: 400 }],
  });
  for (const x of [300, 240, 180, 120, 60, 20]) {
    await page.waitForTimeout(30);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: 400 }],
    });
  }
  await page.waitForTimeout(30);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
}
