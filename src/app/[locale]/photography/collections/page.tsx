import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale, PhotoCollection } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import {
  CategoryFilter,
  CollectionsGallery,
} from '@/features/photography';
import { routing } from '@/i18n/routing';

interface CollectionsPageProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'photography' });

  let collections: PhotoCollection[] | null = null;
  try {
    const repos = createSanityRepositories();
    collections = await repos.photoCollections.listCollections();
  } catch {
    // Error state rendered below.
  }

  return (
    <Section as="section" className="photography-page">
      <Container size="wide">
        <Stack gap="xl">
          <header className="photography-page__header">
            <p className="photography-page__eyebrow">{t('collections')}</p>
            <h1>{t('collectionsTitle')}</h1>
            <p>{t('collectionsIntro')}</p>
          </header>
          <CategoryFilter
            activeCategory="collections"
            ariaLabel={t('categoryLabel')}
            labels={{
              landscape: t('categories.landscape'),
              portrait: t('categories.portrait'),
              collections: t('collections'),
            }}
            locale={locale}
          />
          <div id="gallery">
            {collections ? (
              <CollectionsGallery
                collections={collections}
                labels={{
                  empty: t('collectionsEmpty'),
                  photoCount: t('collectionsPhotoCount'),
                }}
                locale={locale}
              />
            ) : (
              <p className="photography-feed__status" role="alert">
                {t('collectionsError')}
              </p>
            )}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
