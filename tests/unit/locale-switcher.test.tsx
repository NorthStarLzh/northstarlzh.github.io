// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LocaleSwitcher } from '@/features/locale';
import { messagesByLocale } from '@/i18n/messages';

const routerReplace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useRouter: () => ({ replace: routerReplace }),
}));

afterEach(() => {
  cleanup();
  routerReplace.mockReset();
  window.history.replaceState({}, '', '/');
});

function renderSwitcher(locale: 'zh' | 'en') {
  render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <LocaleSwitcher locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('LocaleSwitcher', () => {
  it('announces the current and target languages accessibly in Chinese', () => {
    renderSwitcher('zh');

    expect(
      screen.getByRole('button', {
        name: '当前语言：中文；切换到英文',
      }).textContent,
    ).toBe('切换到英文');
  });

  it('announces the current and target languages accessibly in English', () => {
    renderSwitcher('en');

    expect(
      screen.getByRole('button', {
        name: 'Current language: English; switch to Chinese',
      }).textContent,
    ).toBe('Switch to Chinese');
  });

  it('keeps the photography category and hash when switching languages', async () => {
    window.history.replaceState(
      {},
      '',
      '/zh/photography?category=portrait#gallery',
    );
    renderSwitcher('zh');

    await userEvent.click(screen.getByRole('button'));

    expect(routerReplace).toHaveBeenCalledWith(
      '/en/photography?category=portrait#gallery',
    );
  });

  it('keeps the contact page when switching from English', async () => {
    window.history.replaceState({}, '', '/en/contact');
    renderSwitcher('en');

    await userEvent.click(screen.getByRole('button'));

    expect(routerReplace).toHaveBeenCalledWith('/zh/contact');
  });
});
