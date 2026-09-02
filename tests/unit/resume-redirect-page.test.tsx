import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  setRequestLocale: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mocks.getTranslations,
  setRequestLocale: mocks.setRequestLocale,
}));

import ResumePage from '@/app/[locale]/resume/page';

const messages: Record<string, string> = {
  legacyResumeAction: 'Go to About / CV',
  legacyResumeDescription: 'Taking you to the new documents section.',
  legacyResumeTitle: 'The résumé is now part of About / CV',
};

describe('legacy résumé page', () => {
  beforeEach(() => {
    mocks.getTranslations.mockReset().mockResolvedValue(
      (key: string) => messages[key] ?? key,
    );
    mocks.setRequestLocale.mockReset();
  });

  it('renders a static redirect and accessible fallback link', async () => {
    const page = await ResumePage({
      params: Promise.resolve({ locale: 'en' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('content="0; url=/en/about#cv"');
    expect(html).toContain('href="/en/about#cv"');
    expect(html).toContain(messages.legacyResumeTitle);
    expect(html).toContain(messages.legacyResumeAction);
    expect(mocks.setRequestLocale).toHaveBeenCalledWith('en');
  });
});
