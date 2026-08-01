'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui';
import type { ThemeMode } from '@/content/contracts';

import { getNextThemeMode, resolveThemeMode } from './theme-state';

const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ThemeGlyph({ mode }: { mode: ThemeMode }) {
  if (mode === 'light') return <>☀</>;
  if (mode === 'dark') return <>☾</>;
  return <>◐</>;
}

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { resolvedTheme, setTheme, theme } = useTheme();
  const t = useTranslations('theme');

  if (!hydrated) {
    return (
      <Button
        aria-label={t('loading')}
        className={className}
        data-hydrated="false"
        disabled
        size="sm"
        variant="ghost"
      >
        ◐ {t('label')}
      </Button>
    );
  }

  const currentMode = resolveThemeMode(theme);
  const nextMode = getNextThemeMode(currentMode);
  const resolved = resolvedTheme === 'dark' ? 'dark' : 'light';
  const resolvedStatus =
    currentMode === 'system' ? ` (${t(`resolved.${resolved}`)})` : '';
  const currentModeLabel = t(`modes.${currentMode}`);
  const nextModeLabel = t(`modes.${nextMode}`);
  const accessibleLabel = t('ariaLabel', {
    current: `${currentModeLabel}${resolvedStatus}`,
    target: nextModeLabel,
  });

  return (
    <Button
      aria-label={accessibleLabel}
      className={className}
      data-hydrated="true"
      data-resolved-theme={resolved}
      data-theme-mode={currentMode}
      onClick={() => setTheme(nextMode)}
      size="sm"
      title={t('title', {
        current: `${currentModeLabel}${resolvedStatus}`,
      })}
      variant="ghost"
    >
      <ThemeGlyph mode={currentMode} /> {t('label')}: {currentModeLabel}
    </Button>
  );
}
