import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  LOCALES,
  PHOTO_CATEGORIES,
  THEME_MODES,
  type Locale,
  type PhotoCategory,
  type ThemeMode,
} from '@/content/contracts';

describe('domain enum contracts', () => {
  it('exposes only supported locales', () => {
    expect(LOCALES).toEqual(['zh', 'en']);
    expect(new Set(LOCALES).size).toBe(LOCALES.length);
    expectTypeOf<Locale>().toEqualTypeOf<'zh' | 'en'>();
  });

  it('exposes only supported theme modes', () => {
    expect(THEME_MODES).toEqual(['light', 'dark', 'system']);
    expect(new Set(THEME_MODES).size).toBe(THEME_MODES.length);
    expectTypeOf<ThemeMode>().toEqualTypeOf<'light' | 'dark' | 'system'>();
  });

  it('exposes only supported photo categories', () => {
    expect(PHOTO_CATEGORIES).toEqual(['landscape', 'portrait']);
    expect(new Set(PHOTO_CATEGORIES).size).toBe(PHOTO_CATEGORIES.length);
    expectTypeOf<PhotoCategory>().toEqualTypeOf<'landscape' | 'portrait'>();
  });
});
