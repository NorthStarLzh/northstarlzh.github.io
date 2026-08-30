import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { profileFixture } from '@fixtures/domain';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getTranslations: vi.fn(),
  setRequestLocale: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mocks.getTranslations,
  setRequestLocale: mocks.setRequestLocale,
}));

vi.mock('@/content/repositories', () => ({
  createSanityRepositories: () => ({
    profile: { getProfile: mocks.getProfile },
  }),
}));

import ContactPage from '@/app/[locale]/contact/page';

const messages: Record<string, string> = {
  title: 'Contact',
  description: 'You are welcome to get in touch by email.',
  errorTitle: 'Contact is unavailable',
  errorDescription: 'The content service is temporarily unavailable.',
};

beforeEach(() => {
  mocks.getTranslations.mockReset().mockResolvedValue(
    (key: string) => messages[key] ?? key,
  );
  mocks.setRequestLocale.mockClear();
});

describe('localized contact page', () => {
  it('server-renders the contact section as an h1 heading', async () => {
    mocks.getProfile.mockResolvedValue(profileFixture);

    const page = await ContactPage({
      params: Promise.resolve({ locale: 'zh' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('data-testid="contact-section"');
    expect(html).toContain('<h1');
    expect(html).toContain('data-heading-level="h1"');
    expect(html).toContain('>联系方式</h1>');
    expect(html).toContain('href="mailto:portfolio-owner@example.com"');
    expect(html).not.toContain('<main');
    expect(html).not.toContain('role="alert"');
    expect(mocks.setRequestLocale).toHaveBeenCalledWith('zh');
  });

  it('renders a localized module error when the profile is unavailable', async () => {
    mocks.getProfile.mockRejectedValue(new Error('secret upstream detail'));

    const page = await ContactPage({
      params: Promise.resolve({ locale: 'en' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('role="alert"');
    expect(html).toContain('Contact is unavailable');
    expect(html).not.toContain('secret upstream detail');
  });
});
