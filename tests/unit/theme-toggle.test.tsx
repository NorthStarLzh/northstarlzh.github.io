// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '@/features/theme';
import { messagesByLocale } from '@/i18n/messages';

const themeHook = vi.hoisted(() => ({
  resolvedTheme: 'dark' as string | undefined,
  setTheme: vi.fn(),
  theme: 'system' as string | undefined,
}));

vi.mock('next-themes', () => ({
  useTheme: () => themeHook,
}));

afterEach(() => {
  cleanup();
  themeHook.resolvedTheme = 'dark';
  themeHook.setTheme.mockReset();
  themeHook.theme = 'system';
});

describe('ThemeToggle', () => {
  function toggle(locale: 'zh' | 'en') {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={messagesByLocale[locale]}
      >
        <ThemeToggle />
      </NextIntlClientProvider>
    );
  }

  it('renders a stable disabled placeholder on the server', () => {
    const markup = renderToString(toggle('zh'));

    expect(markup).toContain('data-hydrated="false"');
    expect(markup).toContain('aria-label="主题正在加载"');
    expect(markup).toContain('disabled=""');
  });

  it('clearly announces the selected and resolved system theme', () => {
    render(toggle('zh'));

    const button = screen.getByRole('button', {
      name: '当前主题: 跟随系统 (当前为深色); 切换到 浅色',
    });
    expect(button).toHaveAttribute('data-theme-mode', 'system');
    expect(button).toHaveAttribute('data-resolved-theme', 'dark');
    expect(button).toHaveAttribute('title', '主题: 跟随系统 (当前为深色)');
  });

  it('uses native keyboard button behavior to advance the mode', async () => {
    const user = userEvent.setup();
    render(toggle('en'));
    const button = screen.getByRole('button', {
      name: 'Current theme: System (currently dark); switch to Light',
    });

    button.focus();
    await user.keyboard('{Enter}');

    expect(themeHook.setTheme).toHaveBeenCalledOnce();
    expect(themeHook.setTheme).toHaveBeenCalledWith('light');
  });

  it('cycles a manual dark selection back to system', async () => {
    themeHook.resolvedTheme = 'dark';
    themeHook.theme = 'dark';
    const user = userEvent.setup();
    render(toggle('en'));

    await user.click(
      screen.getByRole('button', {
        name: 'Current theme: Dark; switch to System',
      }),
    );

    expect(themeHook.setTheme).toHaveBeenCalledWith('system');
  });

  it('falls back to the system mode when the provider exposes an invalid value', () => {
    themeHook.resolvedTheme = undefined;
    themeHook.theme = 'sepia';

    render(toggle('en'));

    expect(
      screen.getByRole('button', {
        name: 'Current theme: System (currently light); switch to Light',
      }),
    ).toHaveAttribute('data-theme-mode', 'system');
  });
});
