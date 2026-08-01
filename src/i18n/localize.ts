import type { Locale, LocalizedText } from '@/content/contracts';

export const MISSING_LOCALIZED_CONTENT: Record<Locale, string> = {
  zh: '内容暂不可用',
  en: 'Content is temporarily unavailable',
};

export interface MissingLocalizedContent {
  locale: Locale;
  path?: string;
}

export interface LocalizeOptions {
  path?: string;
  onMissing?: (missing: MissingLocalizedContent) => void;
}

export type LocalizedContentResult =
  | { status: 'available'; locale: Locale; text: string }
  | { status: 'missing'; locale: Locale; text: string; path?: string };

export function resolveLocalizedText(
  value: LocalizedText,
  locale: Locale,
  options: LocalizeOptions = {},
): LocalizedContentResult {
  const selected = value[locale];

  if (typeof selected === 'string' && selected.trim().length > 0) {
    return { status: 'available', locale, text: selected };
  }

  const missing = { locale, path: options.path };
  if (options.onMissing) {
    options.onMissing(missing);
  } else if (process.env.NODE_ENV !== 'production') {
    const path = options.path ? ` at ${options.path}` : '';
    console.warn(`Missing ${locale} localized content${path}.`);
  }

  return {
    status: 'missing',
    locale,
    text: MISSING_LOCALIZED_CONTENT[locale],
    path: options.path,
  };
}

export function localize(
  value: LocalizedText,
  locale: Locale,
  options?: LocalizeOptions,
): string {
  return resolveLocalizedText(value, locale, options).text;
}
