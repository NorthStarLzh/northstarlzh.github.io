import type { Locale } from '@/content/contracts';

const INTL_LOCALES: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-US',
};

const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function formatYearMonth(value: string, locale: Locale): string {
  const match = YEAR_MONTH_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`Expected a YYYY-MM value, received: ${value}`);
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}
