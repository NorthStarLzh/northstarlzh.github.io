import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
