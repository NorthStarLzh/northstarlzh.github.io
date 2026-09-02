import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  ResumeDocumentPreviews,
  ResumeErrorState,
} from '@/features/resume';
import {
  PORTFOLIO_DOWNLOAD_FILENAME,
} from '@/features/resume/resume-page-content';
import { RESUME_DOWNLOAD_FILENAME } from '@/features/resume/resume-download';

describe('localized CV document previews', () => {
  it.each([
    ['zh', 'CV', '个人作品集', '个人简历'],
    ['en', 'CV', 'Portfolio', 'Résumé'],
  ] as const)(
    'server-renders two static preview cards in %s',
    (locale, pageTitle, portfolioTitle, resumeTitle) => {
      const html = renderToStaticMarkup(
        <ResumeDocumentPreviews headingLevel="h1" locale={locale} />,
      );

      expect(html).toContain(`id="cv-title">${pageTitle}</h1>`);
      expect(html).toContain(`>${portfolioTitle}</h2>`);
      expect(html).toContain(`>${resumeTitle}</h2>`);
      expect(html).toContain('href="/portfolio.pdf"');
      expect(html).toContain('href="/resume.pdf"');
      expect(html).toContain(`download="${PORTFOLIO_DOWNLOAD_FILENAME}"`);
      expect(html).toContain(`download="${RESUME_DOWNLOAD_FILENAME}"`);
      expect(html).toContain('src="/portfolio-preview.webp"');
      expect(html).toContain('src="/resume-preview.webp"');
      expect(html).toContain('alt=');
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('<embed');
      expect(html).not.toContain('<object');
    },
  );

  it('renders a localized module error state', async () => {
    const html = renderToStaticMarkup(<ResumeErrorState locale="en" />);

    expect(html).toContain('role="alert"');
    expect(html).toContain('The résumé is unavailable');
  });
});
