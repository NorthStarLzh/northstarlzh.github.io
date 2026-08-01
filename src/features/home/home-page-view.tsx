import { Suspense } from 'react';

import { ModuleState } from '@/components/feedback';
import { Container, Section, Stack } from '@/components/layout';
import { AppImage, Skeleton, SkeletonText } from '@/components/ui';
import type { Locale, Photo, Profile } from '@/content/contracts';
import { ContactSection } from '@/features/contact';
import {
  FeaturedPhotoGallery,
  photoViewerLabels,
} from '@/features/photography';
import { FeaturedResearchSection } from '@/features/research';
import { ProfileSummary, ResumeSummary } from '@/features/resume';
import { localize } from '@/i18n/localize';
import { messagesByLocale } from '@/i18n/messages';

import type {
  HomeContent,
  HomeContentRequests,
  HomeContentResult,
} from './home-content';
import {
  buildHomeAvatarSources,
  buildHomeHeroSources,
  toSrcSet,
} from './home-image-sources';
import styles from './home.module.css';

export interface HomePageViewProps {
  content: HomeContent;
  fallbackDescription?: string;
  fallbackTitle?: string;
  locale: Locale;
}

type HomeSectionName =
  | 'hero'
  | 'profile'
  | 'photos'
  | 'research'
  | 'resume'
  | 'contact';

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

function SectionError({
  description,
  locale,
  testId,
  title,
}: {
  description: string;
  locale: Locale;
  testId: string;
  title: string;
}) {
  return (
    <Section className={styles.reveal} data-testid={testId}>
      <Container size="narrow">
        <ModuleState
          description={description}
          kind="error"
          locale={locale}
          title={title}
        />
      </Container>
    </Section>
  );
}

function selectHeroPhoto(
  hero: HomeContent['hero'],
  featured: HomeContent['photos'],
): { photo?: Photo; source: 'hero' | 'featured' | 'solid' } {
  if (hero.status === 'ready') return { photo: hero.value, source: 'hero' };
  if (featured.status === 'ready' && featured.value[0]) {
    return { photo: featured.value[0], source: 'featured' };
  }
  return { source: 'solid' };
}

function HeroSection({
  fallbackDescription,
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
  const sources = selected.photo
    ? buildHomeHeroSources(selected.photo.image)
    : null;

  return (
    <section
      className={styles.hero}
      data-image-source={selected.source}
      data-testid="home-hero"
    >
      {selected.photo && sources ? (
        <picture className={styles.heroMedia}>
          <source
            sizes="100vw"
            srcSet={toSrcSet(sources)}
          />
          <AppImage
            alt={localize(selected.photo.image.alt, locale, {
              path: `photo.${selected.photo.id}.image.alt`,
            })}
            className={styles.heroImage}
            fetchPriority="high"
            height={selected.photo.image.height}
            loading="eager"
            placeholder={selected.photo.image.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={selected.photo.image.blurDataUrl}
            sizes="100vw"
            src={sources.src}
            unoptimized
            width={selected.photo.image.width}
          />
        </picture>
      ) : null}
      <div aria-hidden="true" className={styles.heroShade} />
      <Container className={styles.heroCopy}>
        <p className={styles.eyebrow}>
          {fallbackDescription ?? messages.home.preview}
        </p>
        <h1>{profile?.nickname ?? fallbackTitle ?? messages.home.title}</h1>
        {profile ? (
          <p className={styles.heroPosition}>
            {profile.institution}
            <span aria-hidden="true"> · </span>
            {localize(profile.role, locale, { path: 'profile.role' })}
          </p>
        ) : (
          <p className={styles.heroPosition}>{messages.errors.contentUnavailable}</p>
        )}
      </Container>
    </section>
  );
}

function avatarProps(profile: Profile) {
  const sources = buildHomeAvatarSources(profile.avatar);
  return {
    avatarSrc: sources.src,
    avatarSrcSet: toSrcSet(sources),
  };
}

function ProfileSection({
  locale,
  profile,
}: {
  locale: Locale;
  profile: HomeContent['profile'];
}) {
  const messages = messagesByLocale[locale];
  if (profile.status === 'error') {
    return (
      <SectionError
        description={messages.errors.contentUnavailable}
        locale={locale}
        testId="home-profile"
        title={messages.home.profileTitle}
      />
    );
  }

  return (
    <Section
      aria-labelledby="home-profile-title"
      className={styles.reveal}
      data-testid="home-profile"
    >
      <Container>
        <Stack gap="xl">
          <h2 className={styles.sectionTitle} id="home-profile-title">
            {messages.home.profileTitle}
          </h2>
          <ProfileSummary
            {...avatarProps(profile.value)}
            density="full"
            headingLevel="h3"
            locale={locale}
            profile={profile.value}
          />
        </Stack>
      </Container>
    </Section>
  );
}

function FeaturedPhotosSection({
  locale,
  photos,
}: {
  locale: Locale;
  photos: HomeContent['photos'];
}) {
  const messages = messagesByLocale[locale];
  if (photos.status === 'error') {
    return (
      <SectionError
        description={messages.home.photographyErrorDescription}
        locale={locale}
        testId="home-featured-photos"
        title={messages.home.photographyErrorTitle}
      />
    );
  }
  if (photos.value.length === 0) {
    return (
      <Section className={styles.reveal} data-testid="home-featured-photos">
        <Container size="narrow">
          <ModuleState
            description={messages.home.photographyEmptyDescription}
            kind="empty"
            locale={locale}
            title={messages.empty.photography}
          />
        </Container>
      </Section>
    );
  }

  return (
    <div
      className={`${styles.reveal} ${styles.featuredPhotos}`}
      data-testid="home-featured-photos"
    >
      <FeaturedPhotoGallery
        labels={photoViewerLabels(locale)}
        locale={locale}
        photos={photos.value.slice(0, 5)}
        title={messages.home.featuredPhotography}
      />
    </div>
  );
}

function FeaturedResearch({
  locale,
  projects,
}: {
  locale: Locale;
  projects: HomeContent['projects'];
}) {
  const messages = messagesByLocale[locale];
  if (projects.status === 'error') {
    return (
      <SectionError
        description={messages.research.errorDescription}
        locale={locale}
        testId="home-featured-research"
        title={messages.research.errorTitle}
      />
    );
  }

  return (
    <div className={styles.reveal} data-testid="home-featured-research">
      <FeaturedResearchSection
        locale={locale}
        projects={projects.value.slice(0, 3)}
      />
    </div>
  );
}

function resultIsReady<T>(
  result: HomeContentResult<T>,
): result is Extract<HomeContentResult<T>, { status: 'ready' }> {
  return result.status === 'ready';
}

function ResumeSection({ content, locale }: Pick<HomePageViewProps, 'content' | 'locale'>) {
  const messages = messagesByLocale[locale];
  if (
    !resultIsReady(content.profile) ||
    !resultIsReady(content.education) ||
    !resultIsReady(content.awards)
  ) {
    return (
      <SectionError
        description={messages.resume.errorDescription}
        locale={locale}
        testId="home-resume"
        title={messages.resume.errorTitle}
      />
    );
  }

  return (
    <div className={styles.reveal} data-testid="home-resume">
      <ResumeSummary
        {...avatarProps(content.profile.value)}
        content={{
          profile: content.profile.value,
          education: content.education.value,
          awards: content.awards.value,
        }}
        locale={locale}
      />
    </div>
  );
}

function Contact({
  locale,
  profile,
}: {
  locale: Locale;
  profile: HomeContent['profile'];
}) {
  const messages = messagesByLocale[locale];
  if (profile.status === 'error') {
    return (
      <div className={styles.reveal} id="contact">
        <SectionError
          description={messages.errors.contentUnavailable}
          locale={locale}
          testId="home-contact"
          title={messages.contact.title}
        />
      </div>
    );
  }
  return (
    <div className={styles.reveal} data-testid="home-contact">
      <ContactSection email={profile.value.email} locale={locale} />
    </div>
  );
}

export function HomePageView(props: HomePageViewProps) {
  const { content, locale } = props;
  return (
    <div className={styles.page}>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="hero" />}>
        <HeroSection
          fallbackDescription={props.fallbackDescription}
          fallbackTitle={props.fallbackTitle}
          featured={content.photos}
          hero={content.hero}
          locale={locale}
          profile={content.profile}
        />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="profile" />}>
        <ProfileSection locale={locale} profile={content.profile} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="photos" />}>
        <FeaturedPhotosSection locale={locale} photos={content.photos} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="research" />}>
        <FeaturedResearch locale={locale} projects={content.projects} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="resume" />}>
        <ResumeSection content={content} locale={locale} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="contact" />}>
        <Contact locale={locale} profile={content.profile} />
      </Suspense>
    </div>
  );
}

export interface StreamingHomePageProps
  extends Omit<HomePageViewProps, 'content'> {
  requests: HomeContentRequests;
}

async function StreamingHero({
  fallbackDescription,
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
      fallbackDescription={fallbackDescription}
      fallbackTitle={fallbackTitle}
      featured={featured}
      hero={hero}
      locale={locale}
      profile={profile}
    />
  );
}

async function StreamingProfile({ locale, requests }: StreamingHomePageProps) {
  return <ProfileSection locale={locale} profile={await requests.profile} />;
}

async function StreamingPhotos({ locale, requests }: StreamingHomePageProps) {
  return <FeaturedPhotosSection locale={locale} photos={await requests.photos} />;
}

async function StreamingResearch({ locale, requests }: StreamingHomePageProps) {
  return <FeaturedResearch locale={locale} projects={await requests.projects} />;
}

async function StreamingResume({ locale, requests }: StreamingHomePageProps) {
  const [profile, education, awards] = await Promise.all([
    requests.profile,
    requests.education,
    requests.awards,
  ]);
  return (
    <ResumeSection
      content={{
        profile,
        education,
        awards,
        hero: { status: 'error' },
        photos: { status: 'error' },
        projects: { status: 'error' },
      }}
      locale={locale}
    />
  );
}

async function StreamingContact({ locale, requests }: StreamingHomePageProps) {
  return <Contact locale={locale} profile={await requests.profile} />;
}

export function StreamingHomePage(props: StreamingHomePageProps) {
  const { locale } = props;
  return (
    <div className={styles.page}>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="hero" />}>
        <StreamingHero {...props} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="profile" />}>
        <StreamingProfile {...props} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="photos" />}>
        <StreamingPhotos {...props} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="research" />}>
        <StreamingResearch {...props} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="resume" />}>
        <StreamingResume {...props} />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton locale={locale} section="contact" />}>
        <StreamingContact {...props} />
      </Suspense>
    </div>
  );
}
