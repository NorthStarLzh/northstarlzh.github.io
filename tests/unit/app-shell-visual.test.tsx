// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShell, createNavigation } from '@/features/app-shell';
import { messagesByLocale } from '@/i18n/messages';

vi.mock('next/navigation', () => ({
  usePathname: () => '/zh/photography',
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
    theme: 'system',
  }),
}));

afterEach(cleanup);

describe('application shell visual stories', () => {
  it.each(['mobile', 'tablet', 'desktop'] as const)(
    'matches the %s navigation viewport',
    (viewport) => {
      const { container } = render(
        <div data-preview-viewport={viewport}>
          <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
            <AppShell
              locale="zh"
              navigation={createNavigation('zh', (key) =>
                messagesByLocale.zh.navigation[key],
              )}
            >
              <h1>摄影作品</h1>
            </AppShell>
          </NextIntlClientProvider>
        </div>,
      );

      expect(container.firstElementChild).toMatchSnapshot();
    },
  );
});
