import {
  THEME_MODES,
  type ThemeMode,
} from '@/content/contracts';

export const THEME_STORAGE_KEY = 'wfpwt-theme';

const serializedThemeModes = JSON.stringify(THEME_MODES);

/**
 * Runs before next-themes' own bootstrap script so a corrupted persisted value
 * cannot become an unsupported data-theme attribute during first paint.
 */
export const THEME_STORAGE_BOOTSTRAP_SCRIPT = `(()=>{try{const key=${JSON.stringify(THEME_STORAGE_KEY)};const value=localStorage.getItem(key);if(value!==null&&!${serializedThemeModes}.includes(value)){localStorage.removeItem(key)}}catch{}})();`;

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === 'string' &&
    (THEME_MODES as readonly string[]).includes(value)
  );
}

export function resolveThemeMode(value: unknown): ThemeMode {
  return isThemeMode(value) ? value : 'system';
}

export function getNextThemeMode(theme: ThemeMode): ThemeMode {
  const themeOrder: readonly ThemeMode[] = ['system', 'light', 'dark'];
  const currentIndex = themeOrder.indexOf(theme);

  return themeOrder[(currentIndex + 1) % themeOrder.length];
}
