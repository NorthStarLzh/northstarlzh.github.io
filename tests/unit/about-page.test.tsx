import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { landscapePhotoFixture, profileFixture } from '@fixtures/domain';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getHeroPhoto: vi.fn(),
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
    photos: { getHeroPhoto: mocks.getHeroPhoto },
  }),
}));

import AboutPage from '@/app/[locale]/about/page';

const messages: Record<string, string> = {
  eyebrow: 'About',
  title: 'About / CV',
  description: 'Profile, research interests, and education background, with a downloadable portfolio and CV.',
  errorTitle: 'About is unavailable',
  errorDescription: 'The content service is temporarily unavailable.',
};

beforeEach(() => {
  mocks.getTranslations.mockReset().mockResolvedValue(
    (key: string) => messages[key] ?? key,
  );
  mocks.setRequestLocale.mockClear();
  mocks.getHeroPhoto.mockReset();
});

describe('localized about page', () => {
  it('server-renders the profile summary with an editorial heading', async () => {
    mocks.getProfile.mockResolvedValue(profileFixture);
    mocks.getHeroPhoto.mockResolvedValue({
      light: landscapePhotoFixture,
      dark: null,
    });

    const page = await AboutPage({
      params: Promise.resolve({ locale: 'en' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('id="about-title">About / CV</h1>');
    expect(html).toContain(`>${profileFixture.nickname}</h2>`);
    expect(html).toContain(profileFixture.institution);
    expect(html).toContain('id="cv"');
    expect(html).toContain('>CV</h2>');
    expect(html).toContain('>Portfolio</h3>');
    expect(html).toContain('>Résumé</h3>');
    expect(html).toContain('href="/portfolio.pdf"');
    expect(html).toContain('href="/resume.pdf"');
    expect(html).toContain('<picture');
    expect(html).not.toContain('<main');
    expect(html).not.toContain('role="alert"');
    expect(mocks.setRequestLocale).toHaveBeenCalledWith('en');
  });

  it('renders a localized module error when the profile is unavailable', async () => {
    mocks.getProfile.mockRejectedValue(new Error('secret upstream detail'));

    const page = await AboutPage({
      params: Promise.resolve({ locale: 'zh' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('role="alert"');
    expect(html).toContain('About is unavailable');
    expect(html).not.toContain('secret upstream detail');
  });
});
