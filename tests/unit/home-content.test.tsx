// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HeroPhoto, Photo, Profile } from '@/content/contracts';
import {
  HomePageView,
  loadHomeContent,
  type HomeContent,
  type HomeRepositories,
} from '@/features/home';
import { messagesByLocale } from '@/i18n/messages';
import { photoDataset, profileFixture } from '@fixtures/domain';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, reject, resolve };
}

function ready<T>(value: T) {
  return { status: 'ready' as const, value };
}

const unavailable = { status: 'error' as const };

function completeContent(overrides: Partial<HomeContent> = {}): HomeContent {
  return {
    profile: ready(profileFixture),
    hero: ready({ light: photoDataset[0], dark: null }),
    photos: ready(photoDataset.slice(0, 5)),
    ...overrides,
  };
}

function renderHome(content: HomeContent, locale: 'zh' | 'en' = 'zh') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <HomePageView content={content} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('home repository composition', () => {
  it('starts all three reads together and calls every repository operation once', async () => {
    const profile = deferred<Profile>();
    const hero = deferred<HeroPhoto>();
    const photos = deferred<Photo[]>();
    const started: string[] = [];
    const repositories: HomeRepositories = {
      profile: {
        getProfile: vi.fn(() => {
          started.push('profile');
          return profile.promise;
        }),
        listEducation: vi.fn(),
        listAwards: vi.fn(),
      },
      photos: {
        getHeroPhoto: vi.fn(() => {
          started.push('hero');
          return hero.promise;
        }),
        listFeatured: vi.fn(() => {
          started.push('photos');
          return photos.promise;
        }),
        listPage: vi.fn(),
      },
    };

    const loading = loadHomeContent(repositories);

    expect(started).toEqual(['profile', 'hero', 'photos']);
    for (const repositoryCall of [
      repositories.profile.getProfile,
      repositories.photos.getHeroPhoto,
      repositories.photos.listFeatured,
    ]) {
      expect(repositoryCall).toHaveBeenCalledTimes(1);
    }
    expect(repositories.photos.listFeatured).toHaveBeenCalledWith(1);

    profile.resolve(profileFixture);
    hero.resolve({ light: photoDataset[0], dark: null });
    photos.resolve(photoDataset.slice(0, 1));

    await expect(loading).resolves.toMatchObject({
      profile: { status: 'ready' },
      hero: { status: 'ready' },
      photos: { status: 'ready' },
    });
  });

  it('isolates one rejected read without exposing the upstream error', async () => {
    const repositories: HomeRepositories = {
      profile: {
        getProfile: async () => profileFixture,
        listEducation: vi.fn(),
        listAwards: vi.fn(),
      },
      photos: {
        getHeroPhoto: async () =>
          Promise.reject(new Error('private dataset detail')),
        listFeatured: async () => photoDataset.slice(0, 1),
        listPage: vi.fn(),
      },
    };

    const content = await loadHomeContent(repositories);
    renderHome(content, 'en');

    expect(screen.getByRole('heading', { level: 1, name: profileFixture.nickname }))
      .toBeInTheDocument();
    expect(screen.getByTestId('home-hero')).toHaveAttribute(
      'data-image-source',
      'featured',
    );
    expect(within(screen.getByTestId('home-hero')).getByRole('img', {
      name: /Fixture image image-photo/,
    })).toBeInTheDocument();
    expect(screen.queryByText('private dataset detail')).not.toBeInTheDocument();
  });
});

describe('home hero', () => {
  it('uses the first featured photo when the configured hero is unavailable', () => {
    renderHome(completeContent({ hero: unavailable }));

    expect(screen.getByTestId('home-hero')).toHaveAttribute(
      'data-image-source',
      'featured',
    );
    expect(within(screen.getByTestId('home-hero')).getByRole('img', {
      name: /测试图片 image-photo-001/,
    })).toHaveAttribute('src', '/content-image-placeholder.svg?fit=max&w=1200');
  });

  it('uses a solid semantic background when neither hero source exists', () => {
    renderHome(completeContent({ hero: unavailable, photos: ready([]) }));

    expect(screen.getByTestId('home-hero')).toHaveAttribute(
      'data-image-source',
      'solid',
    );
    expect(screen.getByTestId('home-hero').querySelector('img')).toBeNull();
  });

  it('renders the dark hero image when the dark cover is set and dark theme is active', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    renderHome(completeContent({
      hero: ready({ light: photoDataset[0], dark: photoDataset[1] }),
    }));

    const heroImage = within(screen.getByTestId('home-hero')).getByRole('img', {
      name: /测试图片 image-photo-002/,
    });
    expect(heroImage).toHaveAttribute(
      'src',
      '/content-image-placeholder.svg?fit=max&w=1360',
    );
  });

  it('falls back to the light hero image in dark theme when no dark cover is set', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    renderHome(completeContent({
      hero: ready({ light: photoDataset[0], dark: null }),
    }));

    const heroImage = within(screen.getByTestId('home-hero')).getByRole('img', {
      name: /测试图片 image-photo-001/,
    });
    expect(heroImage).toHaveAttribute(
      'src',
      '/content-image-placeholder.svg?fit=max&w=1200',
    );
  });

  it('renders the localized nickname as the page heading', () => {
    renderHome(completeContent(), 'en');

    expect(screen.getByRole('heading', { level: 1, name: profileFixture.nickname }))
      .toBeInTheDocument();
    expect(screen.getByTestId('home-hero-copy')).toHaveTextContent(
      profileFixture.nickname,
    );
  });

  it.each(['mobile', 'tablet', 'desktop'] as const)(
    'keeps the hero at the %s viewport seam',
    (viewport) => {
      const { container } = render(
        <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
          <div data-preview-viewport={viewport} data-theme="dark">
            <HomePageView content={completeContent()} locale="zh" />
          </div>
        </NextIntlClientProvider>,
      );

      expect(container.querySelector('[data-preview-viewport]')).toHaveAttribute(
        'data-preview-viewport',
        viewport,
      );
      expect(screen.getByTestId('home-hero')).toBeInTheDocument();
      expect(screen.getByTestId('home-hero-copy')).toBeInTheDocument();
      expect(container.querySelectorAll('section')).toHaveLength(1);
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps the hero composition in the %s theme',
    (theme) => {
      const { container } = render(
        <NextIntlClientProvider locale="en" messages={messagesByLocale.en}>
          <div data-theme={theme}>
            <HomePageView content={completeContent()} locale="en" />
          </div>
        </NextIntlClientProvider>,
      );

      expect(container.firstElementChild).toHaveAttribute('data-theme', theme);
      expect(screen.getByRole('heading', { level: 1, name: profileFixture.nickname }))
        .toBeInTheDocument();
      expect(screen.getByTestId('home-hero-copy')).toBeInTheDocument();
    },
  );
});
