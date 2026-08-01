'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { THEME_MODES } from '@/content/contracts';

import { THEME_STORAGE_KEY } from './theme-state';

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      disableTransitionOnChange
      enableColorScheme
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      themes={THEME_MODES.filter((theme) => theme !== 'system')}
    >
      {children}
    </NextThemesProvider>
  );
}
