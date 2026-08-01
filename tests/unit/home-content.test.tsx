// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  AwardEntry,
  EducationEntry,
  Photo,
  Profile,
  ResearchProject,
} from '@/content/contracts';
import {
  HomePageView,
  loadHomeContent,
  type HomeContent,
  type HomeRepositories,
} from '@/features/home';
import { messagesByLocale } from '@/i18n/messages';
import {
  awardFixtures,
  educationFixtures,
  photoDataset,
  profileFixture,
  researchProjectFixtures,
} from '@fixtures/domain';

afterEach(cleanup);

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
    hero: ready(photoDataset[0]),
    photos: ready(photoDataset.slice(0, 5)),
    projects: ready(researchProjectFixtures),
    education: ready(educationFixtures),
    awards: ready(awardFixtures),
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
  it('starts all six reads together and calls every repository operation once', async () => {
    const profile = deferred<Profile>();
    const hero = deferred<Photo>();
    const photos = deferred<Photo[]>();
    const projects = deferred<ResearchProject[]>();
    const education = deferred<EducationEntry[]>();
    const awards = deferred<AwardEntry[]>();
    const started: string[] = [];
    const repositories: HomeRepositories = {
      profile: {
        getProfile: vi.fn(() => {
          started.push('profile');
          return profile.promise;
        }),
        listEducation: vi.fn(() => {
          started.push('education');
          return education.promise;
        }),
        listAwards: vi.fn(() => {
          started.push('awards');
          return awards.promise;
        }),
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
      research: {
        listFeatured: vi.fn(() => {
          started.push('projects');
          return projects.promise;
        }),
        listAll: vi.fn(),
        getById: vi.fn(),
      },
    };

    const loading = loadHomeContent(repositories);

    expect(started).toEqual([
      'profile',
      'hero',
      'photos',
      'projects',
      'education',
      'awards',
    ]);
    for (const repositoryCall of [
      repositories.profile.getProfile,
      repositories.photos.getHeroPhoto,
      repositories.photos.listFeatured,
      repositories.research.listFeatured,
      repositories.profile.listEducation,
      repositories.profile.listAwards,
    ]) {
      expect(repositoryCall).toHaveBeenCalledTimes(1);
    }
    expect(repositories.photos.listFeatured).toHaveBeenCalledWith(5);
    expect(repositories.research.listFeatured).toHaveBeenCalledWith(3);

    profile.resolve(profileFixture);
    hero.resolve(photoDataset[0]);
    photos.resolve(photoDataset.slice(0, 5));
    projects.resolve(researchProjectFixtures);
    education.resolve(educationFixtures);
    awards.resolve(awardFixtures);

    await expect(loading).resolves.toMatchObject({
      profile: { status: 'ready' },
      hero: { status: 'ready' },
      photos: { status: 'ready' },
      projects: { status: 'ready' },
      education: { status: 'ready' },
      awards: { status: 'ready' },
    });
  });

  it('isolates one rejected read without exposing the upstream error', async () => {
    const repositories: HomeRepositories = {
      profile: {
        getProfile: async () => profileFixture,
        listEducation: async () => educationFixtures,
        listAwards: async () => awardFixtures,
      },
      photos: {
        getHeroPhoto: async () => photoDataset[0],
        listFeatured: async () => photoDataset.slice(0, 5),
        listPage: vi.fn(),
      },
      research: {
        listFeatured: async () => Promise.reject(new Error('private dataset detail')),
        listAll: vi.fn(),
        getById: vi.fn(),
      },
    };

    const content = await loadHomeContent(repositories);
    renderHome(content, 'en');

    expect(screen.getByRole('heading', { level: 1, name: profileFixture.nickname }))
      .toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Fixture image image-photo/ }))
      .toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Résumé summary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /portfolio-owner@example.com/ }))
      .toHaveAttribute('href', 'mailto:portfolio-owner@example.com');
    expect(screen.getByRole('alert')).toHaveTextContent('Research is unavailable');
    expect(screen.queryByText('private dataset detail')).not.toBeInTheDocument();
  });
});

describe('home sections', () => {
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

  it.each([
    ['zh', '精选摄影', '精选科研项目'],
    ['en', 'Featured photography', 'Featured research'],
  ] as const)('renders localized %s content with 5 photos and 3 research cards', (
    locale,
    photographyTitle,
    researchTitle,
  ) => {
    renderHome(completeContent({
      photos: ready([...photoDataset.slice(0, 7)]),
      projects: ready(researchProjectFixtures),
    }), locale);

    expect(screen.getByRole('heading', { name: photographyTitle })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: researchTitle })).toBeInTheDocument();
    expect(screen.getAllByRole('button', {
      name: locale === 'zh' ? /测试图片 image-photo/ : /Fixture image image-photo/,
    })).toHaveLength(5);
    expect(screen.getAllByRole('button', {
      name: locale === 'zh' ? /测试项目/ : /Fixture project/,
    })).toHaveLength(3);
  });

  it.each(['mobile', 'tablet', 'desktop'] as const)(
    'keeps every required section at the %s viewport seam',
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
      expect(screen.getByTestId('home-profile')).toBeInTheDocument();
      expect(screen.getByTestId('home-featured-photos')).toBeInTheDocument();
      expect(screen.getByTestId('home-featured-research')).toBeInTheDocument();
      expect(screen.getByTestId('home-resume')).toBeInTheDocument();
      expect(document.querySelector('#contact')).toBeInTheDocument();
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps the complete home composition in the %s theme',
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
      expect(screen.getByRole('heading', { name: 'Featured photography' }))
        .toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Featured research' }))
        .toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Résumé summary' }))
        .toBeInTheDocument();
    },
  );
});
