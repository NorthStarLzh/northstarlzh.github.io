import { Suspense } from 'react';

import { Container, Section, Stack } from '@/components/layout';
import { Skeleton, SkeletonText } from '@/components/ui';
import type { Locale, Photo } from '@/content/contracts';
import { localize } from '@/i18n/localize';
import { messagesByLocale } from '@/i18n/messages';

import type { HomeContent, HomeContentRequests } from './home-content';
import { HeroPhoto } from './hero-photo';
import styles from './home.module.css';

export interface HomePageViewProps {
  content: HomeContent;
  fallbackTitle?: string;
  locale: Locale;
}

type HomeSectionName = 'hero';

function HomeSectionSkeleton({
  locale,
  section,
}: {
  locale: Locale;
  section: HomeSectionName;
}) {
  return (
    <Section
      aria-label={messagesByLocale[locale].loading.general}
      data-home-section-skeleton={section}
    >
      <Container>
        <Stack gap="md">
          <Skeleton height="2.5rem" width="14rem" />
          <SkeletonText lines={section === 'hero' ? 2 : 3} />
        </Stack>
      </Container>
    </Section>
  );
}

function selectHeroPhoto(
  hero: HomeContent['hero'],
  featured: HomeContent['photos'],
): {
  light?: Photo;
  dark?: Photo | null;
  source: 'hero' | 'featured' | 'solid';
} {
  if (hero.status === 'ready') {
    return {light: hero.value.light, dark: hero.value.dark, source: 'hero'};
  }
  if (featured.status === 'ready' && featured.value[0]) {
    return {light: featured.value[0], dark: null, source: 'featured'};
  }
  return {source: 'solid'};
}

function HeroSection({
  fallbackTitle,
  featured,
  hero,
  locale,
  profile: profileResult,
}: Omit<HomePageViewProps, 'content'> & {
  featured: HomeContent['photos'];
  hero: HomeContent['hero'];
  profile: HomeContent['profile'];
}) {
  const messages = messagesByLocale[locale];
  const profile = profileResult.status === 'ready' ? profileResult.value : null;
  const selected = selectHeroPhoto(hero, featured);

  const altLight = selected.light
    ? localize(selected.light.image.alt, locale, {
        path: `photo.${selected.light.id}.image.alt`,
      })
    : '';
  const altDark = selected.dark
    ? localize(selected.dark.image.alt, locale, {
        path: `photo.${selected.dark.id}.image.alt`,
      })
    : altLight;

  return (
    <section
      className={styles.hero}
      data-image-source={selected.source}
      data-testid="home-hero"
    >
      {selected.light ? (
        <HeroPhoto
          altDark={altDark}
          altLight={altLight}
          dark={selected.dark?.image ?? null}
          light={selected.light.image}
        />
      ) : null}
      <div aria-hidden="true" className={styles.heroShade} />
      <Container className={styles.heroCopy} data-testid="home-hero-copy">
        <h1>{profile?.nickname ?? fallbackTitle ?? messages.home.title}</h1>
        <p>{messages.home.identity}</p>
      </Container>
    </section>
  );
}

export function HomePageView(props: HomePageViewProps) {
  const { content, locale } = props;
  return (
    <div className={styles.page}>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="hero" />}>
        <HeroSection
          fallbackTitle={props.fallbackTitle}
          featured={content.photos}
          hero={content.hero}
          locale={locale}
          profile={content.profile}
        />
      </Suspense>
    </div>
  );
}

export interface StreamingHomePageProps
  extends Omit<HomePageViewProps, 'content'> {
  requests: HomeContentRequests;
}

async function StreamingHero({
  fallbackTitle,
  locale,
  requests,
}: StreamingHomePageProps) {
  const [profile, hero] = await Promise.all([
    requests.profile,
    requests.hero,
  ]);
  const featured = hero.status === 'ready'
    ? ({ status: 'error' } as const)
    : await requests.photos;
  return (
    <HeroSection
      fallbackTitle={fallbackTitle}
      featured={featured}
      hero={hero}
      locale={locale}
      profile={profile}
    />
  );
}

export function StreamingHomePage(props: StreamingHomePageProps) {
  const { locale } = props;
  return (
    <div className={styles.page}>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="hero" />}>
        <StreamingHero {...props} />
      </Suspense>
    </div>
  );
}
