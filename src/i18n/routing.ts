import { defineRouting } from 'next-intl/routing';

import { LOCALES, type Locale } from '@/content/contracts';

export const DEFAULT_LOCALE: Locale = 'zh';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
});

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale);
}
