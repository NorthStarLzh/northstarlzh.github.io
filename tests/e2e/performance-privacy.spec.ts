import { expect, test } from '@playwright/test';

import { disableAutomaticPagination, openResponsiveControls } from './support';

interface WebVitals {
  cls: number;
  lcp: number;
}

declare global {
  interface Window {
    __e2eVitals: WebVitals;
  }
}

async function collectPhotoIds(page: import('@playwright/test').Page, category: 'landscape' | 'portrait') {
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const search = new URLSearchParams({ category, locale: 'zh' });
    if (cursor) search.set('cursor', cursor);
    const response = await page.request.get(`/api/photos?${search.toString()}`);
    expect(response.ok()).toBe(true);
    const body = await response.json() as {
      items: Array<{ id: string }>;
      nextCursor: string | null;
    };
    ids.push(...body.items.map(({ id }) => id));
    cursor = body.nextCursor;
  } while (cursor);
  return ids;
}

test('100-photo fixture remains paginated and initial page does not load everything', async ({ page }) => {
  await disableAutomaticPagination(page);
  await page.goto('/zh/photography?category=landscape');
  await expect(page.locator('.photography-card__button')).toHaveCount(20);

  const [landscapeIds, portraitIds] = await Promise.all([
    collectPhotoIds(page, 'landscape'),
    collectPhotoIds(page, 'portrait'),
  ]);
  const allIds = new Set([...landscapeIds, ...portraitIds]);
  expect(allIds.size).toBe(100);
  expect(await page.locator('.photography-card__button').count()).toBeLessThan(allIds.size);
});

test('local laboratory budgets cover LCP, CLS, interaction response, and intro duration', async ({ page }, testInfo) => {
  await page.goto('/zh');
  await page.goto('about:blank');
  await page.addInitScript(() => {
    const vitals = { cls: 0, lcp: 0 };
    Object.defineProperty(window, '__e2eVitals', { value: vitals });
    new PerformanceObserver((entries) => {
      const last = entries.getEntries().at(-1);
      if (last) vitals.lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput) vitals.cls += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const navigationStart = Date.now();
  await page.goto('/zh', { waitUntil: 'domcontentloaded' });
  const intro = page.getByTestId('intro-animation');
  await intro.waitFor({ state: 'attached', timeout: 1_500 });
  const introStart = Date.now();
  await intro.waitFor({ state: 'detached', timeout: 1_100 });
  const introDuration = Date.now() - introStart;
  expect(introDuration).toBeLessThanOrEqual(1_000);
  expect(Date.now() - navigationStart).toBeLessThan(4_000);

  await page.waitForTimeout(500);
  const vitals = await page.evaluate(() => window.__e2eVitals);
  expect(vitals.lcp).toBeGreaterThan(0);
  expect(vitals.lcp).toBeLessThanOrEqual(2_500);
  expect(vitals.cls).toBeLessThanOrEqual(0.1);

  await openResponsiveControls(page, 'zh');
  const responseTime = await page.evaluate(() => new Promise<number>((resolve) => {
    const button = document.querySelector<HTMLButtonElement>('[data-theme-mode]');
    if (!button) throw new Error('Theme button is unavailable.');
    const before = button.dataset.themeMode;
    const startedAt = performance.now();
    const observer = new MutationObserver(() => {
      if (button.dataset.themeMode !== before) {
        observer.disconnect();
        resolve(performance.now() - startedAt);
      }
    });
    observer.observe(button, { attributes: true, attributeFilter: ['data-theme-mode'] });
    button.click();
  }));
  expect(responseTime).toBeLessThanOrEqual(200);
  const metrics = {
    project: testInfo.project.name,
    viewport: page.viewportSize(),
    lcpMs: Math.round(vitals.lcp),
    cls: Number(vitals.cls.toFixed(4)),
    interactionResponseMs: Number(responseTime.toFixed(2)),
    introDurationMs: introDuration,
  };
  const serializedMetrics = JSON.stringify(metrics, null, 2);
  testInfo.annotations.push({ type: 'laboratory-metrics', description: serializedMetrics });
  await testInfo.attach('laboratory-metrics', {
    body: Buffer.from(serializedMetrics),
    contentType: 'application/json',
  });
});

test('pages create no tracking requests, cookies, or unexpected storage', async ({ page }) => {
  const requests = new Set<string>();
  page.on('request', (request) => requests.add(request.url()));

  for (const path of ['/zh', '/en/photography?category=portrait', '/zh/research', '/en/resume']) {
    await page.goto(path);
  }

  const external = [...requests].filter((url) => {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http') && parsed.origin !== 'http://127.0.0.1:3100';
  });
  expect(external).toEqual([]);
  expect([...requests].filter((url) => /analytics|telemetry|tracking|doubleclick|segment/i.test(url))).toEqual([]);
  const cookies = await page.context().cookies();
  expect(cookies.map(({ name }) => name)).toEqual(['NEXT_LOCALE']);
  expect(cookies[0]).toMatchObject({
    httpOnly: false,
    sameSite: 'Lax',
    secure: false,
  });
  const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
  expect(sessionKeys.filter((key) => !key.startsWith('__next_debug_channel:'))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
