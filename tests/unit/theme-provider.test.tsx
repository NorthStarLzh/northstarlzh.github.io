// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, THEME_STORAGE_KEY } from '@/features/theme';

interface MediaController {
  setDark: (dark: boolean) => void;
}

function installColorScheme(dark: boolean): MediaController {
  let matches = dark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    addListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    dispatchEvent: () => true,
  } as MediaQueryList;

  vi.stubGlobal('matchMedia', () => mediaQuery);

  return {
    setDark(nextDark) {
      matches = nextDark;
      const event = { matches: nextDark, media: mediaQuery.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function ThemeHarness() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  return (
    <>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button onClick={() => setTheme('dark')} type="button">
        Dark
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <ThemeHarness />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ThemeProvider', () => {
  it('follows the operating system when no preference is persisted', async () => {
    installColorScheme(true);
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('reacts to system changes only while the selected mode is system', async () => {
    const system = installColorScheme(false);
    renderProvider();

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-theme', 'light'),
    );
    system.setDark(true);
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    await waitFor(() => {
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    system.setDark(false);
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });
  });

  it('restores a manual choice when the provider mounts again', async () => {
    installColorScheme(false);
    const firstRender = renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    await waitFor(() =>
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark'),
    );
    firstRender.unmount();

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });
});
