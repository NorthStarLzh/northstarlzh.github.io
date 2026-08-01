// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ResearchDialog } from '@/features/research';
import { messagesByLocale } from '@/i18n/messages';
import {
  createResearchProject,
  localized,
  researchProjectOneImageFixture,
  researchProjectThreeImagesFixture,
  researchProjectTwoImagesFixture,
} from '@fixtures/domain';

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

function renderDialog(
  project = researchProjectOneImageFixture,
  locale: 'zh' | 'en' = 'zh',
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <ResearchDialog
        locale={locale}
        onClose={vi.fn()}
        project={project}
      />
    </NextIntlClientProvider>,
  );
}

describe('ResearchDialog', () => {
  it('shows the localized project fields in order without links or downloads', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', {
      name: '测试项目 research-001',
    });
    const title = screen.getByRole('heading', {
      name: '测试项目 research-001',
    });
    const period = screen.getByText('2024–2025');
    const summary = screen.getByText('仅用于自动化测试的项目摘要。');
    const image = screen.getByRole('img', {
      name: '测试图片 research-001-image-1',
    });
    const paper = screen.getByText('测试论文 research-001-paper-1');

    expect(title.compareDocumentPosition(period) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(period.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summary.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(image.compareDocumentPosition(paper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dialog.querySelectorAll('a')).toHaveLength(0);
    expect(screen.queryByText(/PDF/i)).not.toBeInTheDocument();
  });

  it.each([
    ['one', researchProjectOneImageFixture, 1],
    ['two', researchProjectTwoImagesFixture, 2],
    ['three', researchProjectThreeImagesFixture, 3],
  ])('renders a stable %s-image layout', (_label, project, imageCount) => {
    renderDialog(project);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(imageCount);
    expect(images[0].parentElement).toHaveAttribute(
      'data-image-count',
      String(imageCount),
    );
  });

  it('selects only English content and keeps a long summary inside the scroll body', () => {
    const longEnglishSummary = 'Long research narrative. '.repeat(80);
    const project = createResearchProject('research-long', 3, {
      title: localized('中文长项目', 'Long research project'),
      summary: localized('中文长摘要', longEnglishSummary),
      papers: [
        {
          id: 'paper-long',
          title: localized('中文论文', 'English paper result'),
        },
      ],
    });

    renderDialog(project, 'en');

    expect(
      screen.getByRole('dialog', { name: 'Long research project' }),
    ).toHaveClass('research-dialog');
    const summary = screen.getByText((content, element) =>
      element?.classList.contains('research-dialog__summary') === true &&
      content.startsWith('Long research narrative.'),
    );
    expect(summary).toHaveTextContent('Long research narrative.');
    expect(screen.getByText('English paper result')).toBeInTheDocument();
    expect(screen.queryByText('中文长项目')).not.toBeInTheDocument();
    expect(summary.closest('.ds-dialog-body')).toBeTruthy();
  });
});
