import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  renderResumePage,
  ResumeErrorState,
} from '@/features/resume';
import {
  PORTFOLIO_DOWNLOAD_FILENAME,
} from '@/features/resume/resume-page-content';
import { RESUME_DOWNLOAD_FILENAME } from '@/features/resume/resume-download';

describe('localized résumé page', () => {
  it.each([
    ['zh', '个人简历', '个人作品集', '个人简历'],
    ['en', 'Résumé', 'Portfolio', 'Résumé'],
  ] as const)(
    'server-renders two static preview cards in %s',
    async (locale, pageTitle, portfolioTitle, resumeTitle) => {
      const page = await renderResumePage(locale);
      const html = renderToStaticMarkup(page);

      expect(html).toContain(pageTitle);
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
