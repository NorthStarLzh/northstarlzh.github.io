import {defineConfig} from '@playwright/test';

const rawBaseUrl = process.env.PREVIEW_BASE_URL?.trim();

if (!rawBaseUrl) {
  throw new Error('PREVIEW_BASE_URL is required for deployed Preview smoke tests.');
}

const parsedBaseUrl = new URL(rawBaseUrl);
if (parsedBaseUrl.protocol !== 'https:' || parsedBaseUrl.origin !== rawBaseUrl) {
  throw new Error('PREVIEW_BASE_URL must be an exact HTTPS origin without a path.');
}

export default defineConfig({
  testDir: './tests/preview-e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 1,
  timeout: 30_000,
  expect: {timeout: 7_500},
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: parsedBaseUrl.origin,
    browserName: 'chromium',
    locale: 'zh-CN',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
