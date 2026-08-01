import type { Locale } from '@/content/contracts';

import { isSupportedLocale } from './routing';

const LOCALE_SEGMENT = /^\/([^/?#]+)(?=\/|[?#]|$)/;

function withPrefix(value: string, prefix: '?' | '#'): string {
  if (!value) return '';
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

export function replaceLocaleInUrl(url: string, targetLocale: Locale): string {
  const match = LOCALE_SEGMENT.exec(url);
  const currentLocale = match?.[1];

  if (!match || !isSupportedLocale(currentLocale)) {
    throw new TypeError(`Expected a URL beginning with a supported locale: ${url}`);
  }

  return `/${targetLocale}${url.slice(match[0].length)}`;
}

export function buildLocaleUrl(
  pathname: string,
  targetLocale: Locale,
  search = '',
  hash = '',
): string {
  return replaceLocaleInUrl(
    `${pathname}${withPrefix(search, '?')}${withPrefix(hash, '#')}`,
    targetLocale,
  );
}
