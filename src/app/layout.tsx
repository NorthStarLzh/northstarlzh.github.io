import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import {
  THEME_STORAGE_BOOTSTRAP_SCRIPT,
} from '@/features/theme';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/i18n/routing';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: '风花诗酒茶',
  description: 'Personal portfolio development preview',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  let locale = DEFAULT_LOCALE;
  if (process.env.GITHUB_PAGES !== 'true') {
    const requestedLocale = (await headers()).get('x-next-intl-locale');
    locale = isSupportedLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  }

  return (
    <html
      suppressHydrationWarning
      lang={locale}
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          // This must run before next-themes reads localStorage in the body.
          dangerouslySetInnerHTML={{ __html: THEME_STORAGE_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
