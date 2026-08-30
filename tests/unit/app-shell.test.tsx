// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { axe } from 'vitest-axe';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppShell, createNavigation } from '@/features/app-shell';
import { messagesByLocale } from '@/i18n/messages';

const navigationMock = vi.hoisted(() => ({
  pathname: '/zh/research',
  replace: vi.fn(),
}));
const themeHook = vi.hoisted(() => ({
  resolvedTheme: 'light' as string | undefined,
  setTheme: vi.fn(),
  theme: 'system' as string | undefined,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => themeHook,
}));

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: () => undefined,
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: () => undefined,
  });
});

afterEach(() => {
  cleanup();
  navigationMock.pathname = '/zh/research';
  navigationMock.replace.mockReset();
  themeHook.resolvedTheme = 'light';
  themeHook.setTheme.mockReset();
  themeHook.theme = 'system';
  window.history.replaceState({}, '', '/zh/research');
});

function renderShell(locale: 'zh' | 'en' = 'zh') {
  const messages = messagesByLocale[locale];
  const navigationLabels = messages.navigation;
  const navigation = createNavigation(locale, (key) => navigationLabels[key]);

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppShell locale={locale} navigation={navigation}>
        <h1>{locale === 'zh' ? '页面标题' : 'Page title'}</h1>
      </AppShell>
    </NextIntlClientProvider>,
  );
}

describe('AppShell navigation', () => {
  it('renders all desktop entries, controls, current-page state and one main landmark', () => {
    renderShell();

    const navigation = screen.getByRole('navigation', { name: '主导航' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    expect(
      within(navigation).getByRole('link', { name: '科研成果' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('link', { name: '联系方式' })).toHaveAttribute(
      'href',
      '/zh/contact',
    );
    expect(screen.getByRole('button', { name: /当前语言/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /当前主题/ })).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });

  it('marks contact current and home inactive on the contact page', async () => {
    navigationMock.pathname = '/zh/contact';
    window.history.replaceState({}, '', '/zh/contact');
    renderShell();

    const navigation = screen.getByRole('navigation', { name: '主导航' });
    await waitFor(() =>
      expect(
        within(navigation).getByRole('link', { name: '联系方式' }),
      ).toHaveAttribute('aria-current', 'page'),
    );
    expect(within(navigation).getByRole('link', { name: '首页' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('opens by keyboard, traps Tab, closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = screen.getByRole('button', { name: '打开菜单' });

    trigger.focus();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: '网站导航' });
    const close = within(dialog).getByRole('button', { name: '关闭菜单' });
    await waitFor(() => expect(close).toHaveFocus());

    await user.tab();
    expect(within(dialog).getByRole('link', { name: '首页' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('keeps all entries and both switches in the mobile menu', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: '打开菜单' }));

    const dialog = screen.getByRole('dialog', { name: '网站导航' });
    const navigation = within(dialog).getByRole('navigation', {
      name: '移动端主导航',
    });
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    expect(within(navigation).getByRole('link', { name: '联系方式' })).toHaveAttribute(
      'href',
      '/zh/contact',
    );
    expect(within(dialog).getByRole('button', { name: /当前语言/ })).toBeEnabled();
    expect(within(dialog).getByRole('button', { name: /当前主题/ })).toBeEnabled();
  });

  it('automatically closes an open menu when the route changes', async () => {
    const user = userEvent.setup();
    const view = renderShell();
    await user.click(screen.getByRole('button', { name: '打开菜单' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    navigationMock.pathname = '/zh/resume';
    view.rerender(
      <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
        <AppShell
          locale="zh"
          navigation={createNavigation('zh', (key) =>
            messagesByLocale.zh.navigation[key],
          )}
        >
          <h1>个人简历</h1>
        </AppShell>
      </NextIntlClientProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports a complete keyboard journey through language and theme switches', async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = screen.getByRole('button', { name: '打开菜单' });
    trigger.focus();
    await user.keyboard('{Enter}');

    const dialog = screen.getByRole('dialog', { name: '网站导航' });
    const localeSwitch = within(dialog).getByRole('button', { name: /当前语言/ });
    const themeSwitch = within(dialog).getByRole('button', { name: /当前主题/ });
    localeSwitch.focus();
    await user.keyboard('{Enter}');
    expect(navigationMock.replace).toHaveBeenCalledWith('/en/research');

    themeSwitch.focus();
    await user.keyboard(' ');
    expect(themeHook.setTheme).toHaveBeenCalledWith('light');
  });

  it('has no detectable accessibility violations when closed or open', async () => {
    const user = userEvent.setup();
    renderShell();
    expect(
      (await axe(document.body, { rules: { 'color-contrast': { enabled: false } } }))
        .violations,
    ).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '打开菜单' }));
    expect(
      (await axe(document.body, { rules: { 'color-contrast': { enabled: false } } }))
        .violations,
    ).toHaveLength(0);
  });
});
