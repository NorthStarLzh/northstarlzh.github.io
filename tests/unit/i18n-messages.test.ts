import { describe, expect, it } from 'vitest';

import { formatYearMonth } from '@/i18n/format';
import { messagesByLocale } from '@/i18n/messages';

function leafKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafEntries(value: unknown, prefix = ''): Array<[string, unknown]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [[prefix, value]];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafEntries(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('internationalized interface messages', () => {
  it('keeps the Chinese and English message key sets identical', () => {
    expect(leafKeys(messagesByLocale.zh).sort()).toEqual(
      leafKeys(messagesByLocale.en).sort(),
    );
  });

  it.each(['zh', 'en'] as const)(
    'keeps every %s interface message as a non-empty string',
    (locale) => {
      for (const [key, value] of leafEntries(messagesByLocale[locale])) {
        expect(key).not.toBe('');
        expect(value, `${locale}.${key}`).toEqual(expect.any(String));
        expect((value as string).trim(), `${locale}.${key}`).not.toBe('');
      }
    },
  );

  it('covers every required interface message group', () => {
    expect(Object.keys(messagesByLocale.zh)).toEqual(
      expect.arrayContaining([
        'navigation',
        'buttons',
        'loading',
        'empty',
        'errors',
        'download',
        'dialogs',
      ]),
    );
  });

  it('does not mix representative interface text or dates across locales', () => {
    expect(messagesByLocale.zh.navigation.photography).toBe('摄影作品');
    expect(messagesByLocale.en.navigation.photography).toBe('Photography');
    expect(messagesByLocale.zh.metadata.description).toBe(
      '刘子恒的个人网站，记录人工智能与设计研究、交互项目以及摄影创作。',
    );
    expect(messagesByLocale.en.metadata.description).toBe(
      "Liu Ziheng's personal website, documenting AI and design research, interactive projects, and photography.",
    );
    expect(formatYearMonth('2026-07', 'zh')).toBe('2026年7月');
    expect(formatYearMonth('2026-07', 'en')).toBe('July 2026');
  });

  it('rejects malformed year-month values instead of formatting ambiguously', () => {
    expect(() => formatYearMonth('2026-13', 'zh')).toThrow(RangeError);
    expect(() => formatYearMonth('07/2026', 'en')).toThrow(RangeError);
  });
});
