import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import {
  HomePageView,
  startHomeContentRequests,
  StreamingHomePage,
  type HomeContent,
  type HomeContentRequests,
} from '@/features/home';
import { IntroAnimation } from '@/features/intro-animation';

interface LocaleHomePageProps {
  params: Promise<{ locale: Locale }>;
}

const unavailable = { status: 'error' as const };

function unavailableHomeContent(): HomeContent {
  return {
    profile: unavailable,
    hero: unavailable,
    photos: unavailable,
    projects: unavailable,
    education: unavailable,
    awards: unavailable,
  };
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const fallbackCopy = {
    title: t('title'),
    description: t('preview'),
  };
  let requests: HomeContentRequests | undefined;

  try {
    requests = startHomeContentRequests(createSanityRepositories());
  } catch {
    requests = undefined;
  }

  const body = requests ? (
    <StreamingHomePage
      fallbackDescription={fallbackCopy.description}
      fallbackTitle={fallbackCopy.title}
      locale={locale}
      requests={requests}
    />
  ) : (
    <HomePageView
      content={unavailableHomeContent()}
      fallbackDescription={fallbackCopy.description}
      fallbackTitle={fallbackCopy.title}
      locale={locale}
    />
  );

  return (
    <>
      <IntroAnimation />
      {body}
    </>
  );
}
