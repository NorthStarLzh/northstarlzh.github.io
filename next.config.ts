import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';
const isE2EFixtureMode = process.env.E2E_FIXTURE_MODE === '1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Playwright's fixture server independent from a developer's .next/dev
  // lock, so local browser tests never need to stop an active dev session.
  ...(isE2EFixtureMode ? {distDir: 'node_modules/.cache/wfpwt-next-e2e'} : {}),
  ...(isGitHubPagesBuild
    ? {
      output: 'export',
      trailingSlash: true,
      images: {unoptimized: true},
    }
    : {}),
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
