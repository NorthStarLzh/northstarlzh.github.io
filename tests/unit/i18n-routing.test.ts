import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, isSupportedLocale, routing } from '@/i18n/routing';
import { buildLocaleUrl, replaceLocaleInUrl } from '@/i18n/url';

describe('locale routing', () => {
  it('uses Chinese as the unconditional default locale', () => {
    expect(DEFAULT_LOCALE).toBe('zh');
    expect(routing.defaultLocale).toBe('zh');
    expect(routing.localeDetection).toBe(false);
  });

  it('recognizes only /zh and /en locale segments', () => {
    expect(isSupportedLocale('zh')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });

});

describe('locale URL replacement', () => {
  it.each([
    ['/zh', 'en', '/en'],
    ['/en', 'zh', '/zh'],
    ['/zh/', 'en', '/en/'],
    ['/zh/research', 'en', '/en/research'],
    ['/en#contact', 'zh', '/zh#contact'],
  ] as const)('switches %s to %s', (source, target, expected) => {
    expect(replaceLocaleInUrl(source, target)).toBe(expected);
  });

  it('preserves the photography route, category, extra query and hash', () => {
    expect(
      replaceLocaleInUrl(
        '/zh/photography?category=portrait&view=compact#gallery',
        'en',
      ),
    ).toBe('/en/photography?category=portrait&view=compact#gallery');
  });

  it('combines browser path, query and #contact without losing context', () => {
    expect(
      buildLocaleUrl(
        '/zh/photography',
        'en',
        'category=landscape',
        'contact',
      ),
    ).toBe('/en/photography?category=landscape#contact');
  });

  it('rejects URLs without a supported locale segment', () => {
    expect(() => replaceLocaleInUrl('/fr/research', 'en')).toThrow(TypeError);
    expect(() => replaceLocaleInUrl('/photography', 'zh')).toThrow(TypeError);
    expect(() => replaceLocaleInUrl('zh/photography', 'en')).toThrow(TypeError);
    expect(() => replaceLocaleInUrl('/', 'en')).toThrow(TypeError);
  });
});
