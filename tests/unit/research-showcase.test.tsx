// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { axe } from 'vitest-axe';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ResearchShowcase } from '@/features/research';
import { messagesByLocale } from '@/i18n/messages';
import { researchProjectFixtures } from '@fixtures/domain';

afterEach(cleanup);

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

function renderShowcase(projects = researchProjectFixtures) {
  return render(
    <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
      <ResearchShowcase locale="zh" projects={projects} />
    </NextIntlClientProvider>,
  );
}

describe('ResearchShowcase', () => {
  it('opens the selected project and closes with Escape while restoring card focus', async () => {
    const user = userEvent.setup();
    renderShowcase();

    const trigger = screen.getByRole('button', {
      name: /测试项目 research-002/,
    });
    await user.click(trigger);

    expect(
      screen.getByRole('dialog', { name: '测试项目 research-002' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '关闭弹窗' })).toHaveFocus(),
    );
    expect(document.body).toHaveAttribute('data-scroll-locked');
    await user.tab();
    expect(screen.getByRole('button', { name: '关闭弹窗' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveAttribute('data-scroll-locked');
    expect(trigger).toHaveFocus();
  });

  it('closes from the visible close button', async () => {
    const user = userEvent.setup();
    renderShowcase();
    const trigger = screen.getByRole('button', {
      name: /测试项目 research-001/,
    });
    await user.click(trigger);

    await user.click(screen.getByRole('button', { name: '关闭弹窗' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes automatically when the active id disappears after a list update', async () => {
    const user = userEvent.setup();
    const view = renderShowcase();
    await user.click(
      screen.getByRole('button', { name: /测试项目 research-004/ }),
    );
    expect(
      screen.getByRole('dialog', { name: '测试项目 research-004' }),
    ).toBeInTheDocument();

    view.rerender(
      <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
        <ResearchShowcase
          locale="zh"
          projects={researchProjectFixtures.filter(
            ({ id }) => id !== 'research-004',
          )}
        />
      </NextIntlClientProvider>,
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('has no automated accessibility violations while a project is open', async () => {
    const user = userEvent.setup();
    renderShowcase();
    await user.click(
      screen.getByRole('button', { name: /测试项目 research-003/ }),
    );

    const results = await axe(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
