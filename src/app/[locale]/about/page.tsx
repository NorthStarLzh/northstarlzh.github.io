import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ModuleState } from '@/components/feedback';
import { Container, Section, Stack } from '@/components/layout';
import type { HeroPhoto, Locale, Profile } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import {
  buildHomeAvatarSources,
  HeroPhoto as HeroPhotoView,
  toSrcSet,
} from '@/features/home';
import { ProfileSummary } from '@/features/resume';
import { routing } from '@/i18n/routing';

import styles from './about.module.css';

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title'), description: t('description') };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  const repositories = createSanityRepositories();
  let profile: Profile | null = null;
  let hero: HeroPhoto | null = null;
  try {
    profile = await repositories.profile.getProfile();
  } catch {
    profile = null;
  }
  try {
    hero = await repositories.photos.getHeroPhoto();
  } catch {
    hero = null;
  }

  if (!profile) {
    return (
      <Container>
        <Section>
          <ModuleState
            description={t('errorDescription')}
            kind="error"
            locale={locale}
            title={t('errorTitle')}
          />
        </Section>
      </Container>
    );
  }

  const avatar = buildHomeAvatarSources(profile.avatar);

  return (
    <div className={styles.page}>
      {hero ? (
        <div aria-hidden="true" className={styles.background}>
          <div className={styles.photo}>
            <HeroPhotoView
              altDark=""
              altLight=""
              dark={hero.dark?.image ?? null}
              light={hero.light.image}
            />
          </div>
          <div className={styles.fade} />
        </div>
      ) : null}
      <Container>
        <Section aria-labelledby="about-title">
          <Stack gap="xl">
            <header className="eds-section-head">
              <p className="eds-eyebrow">{t('eyebrow')}</p>
              <h1 className="eds-section-title" id="about-title">
                {t('title')}
              </h1>
              <p className="eds-section-description">{t('description')}</p>
            </header>
            <ProfileSummary
              avatarSrc={avatar.src}
              avatarSrcSet={toSrcSet(avatar)}
              density="full"
              headingLevel="h2"
              locale={locale}
              profile={profile}
            />
          </Stack>
        </Section>
      </Container>
    </div>
  );
}
