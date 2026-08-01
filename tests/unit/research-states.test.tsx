// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';

import { ResearchPanel } from '@/features/research';
import { messagesByLocale } from '@/i18n/messages';

afterEach(cleanup);

function renderPanel(
  locale: 'zh' | 'en',
  status: 'loading' | 'empty' | 'error',
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <ResearchPanel locale={locale} projects={[]} status={status} />
    </NextIntlClientProvider>,
  );
}

describe('ResearchPanel states', () => {
  it('renders a distinct Chinese empty state', () => {
    renderPanel('zh', 'empty');

    expect(screen.getByRole('status')).toHaveTextContent('暂无科研项目');
    expect(screen.getByRole('status')).toHaveTextContent(
      '科研项目发布后将在这里展示。',
    );
  });

  it('renders a distinct English loading state', () => {
    renderPanel('en', 'loading');

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading research projects…');
  });

  it('renders a safe English module error without internal details', () => {
    renderPanel('en', 'error');

    expect(screen.getByRole('alert')).toHaveTextContent('Research is unavailable');
    expect(screen.getByRole('alert')).not.toHaveTextContent(/Sanity|dataset|token/i);
  });
});
