import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

import {
  getNextThemeMode,
  isThemeMode,
  resolveThemeMode,
  THEME_STORAGE_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
} from '@/features/theme';

describe('theme state', () => {
  it('recognizes only the supported internal modes', () => {
    expect(['system', 'light', 'dark'].map(isThemeMode)).toEqual([
      true,
      true,
      true,
    ]);
    expect(isThemeMode('sepia')).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });

  it('falls back to system for missing or invalid persisted values', () => {
    expect(resolveThemeMode(undefined)).toBe('system');
    expect(resolveThemeMode('sepia')).toBe('system');
    expect(THEME_STORAGE_KEY).toBe('wfpwt-theme');
  });

  it('cycles through system, light, and dark predictably', () => {
    expect(getNextThemeMode('system')).toBe('light');
    expect(getNextThemeMode('light')).toBe('dark');
    expect(getNextThemeMode('dark')).toBe('system');
  });

  it('removes a corrupted persisted value before next-themes reads it', () => {
    const values = new Map([[THEME_STORAGE_KEY, 'sepia']]);
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    };

    runInNewContext(THEME_STORAGE_BOOTSTRAP_SCRIPT, { localStorage });

    expect(values.has(THEME_STORAGE_KEY)).toBe(false);
  });

  it.each(['system', 'light', 'dark']) (
    'preserves the valid persisted value %s during bootstrap',
    (mode) => {
      const values = new Map([[THEME_STORAGE_KEY, mode]]);
      const localStorage = {
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
      };

      runInNewContext(THEME_STORAGE_BOOTSTRAP_SCRIPT, { localStorage });

      expect(values.get(THEME_STORAGE_KEY)).toBe(mode);
    },
  );

  it('fails safely when browser storage is unavailable', () => {
    const localStorage = {
      getItem: () => {
        throw new Error('storage denied');
      },
    };

    expect(() =>
      runInNewContext(THEME_STORAGE_BOOTSTRAP_SCRIPT, { localStorage }),
    ).not.toThrow();
  });
});
