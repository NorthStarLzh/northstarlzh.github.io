import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale, PhotoCollection } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import {
  CategoryFilter,
  CollectionGallery,
  photoViewerLabels,
} from '@/features/photography';
import { localize } from '@/i18n';
import { routing } from '@/i18n/routing';

interface CollectionDetailPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateStaticParams() {
  let slugs: string[] = [];
  try {
    const repos = createSanityRepositories();
    const collections = await repos.photoCollections.listCollections();
    slugs = collections.map(({ slug }) => slug);
  } catch {
    // Fall through to the placeholder so the build can still proceed.
  }

  // Static export refuses a dynamic route with zero generated pages, so with
  // no collections yet we emit a placeholder that the page turns into a 404.
  if (slugs.length === 0) {
    slugs = ['_empty'];
  }

  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'photography' });

  let collection: PhotoCollection | null = null;
  try {
    const repos = createSanityRepositories();
    collection = await repos.photoCollections.getCollectionBySlug(slug);
  } catch {
    // notFound below
  }

  if (!collection) notFound();

  return (
    <Section as="section" className="photography-page">
      <Container size="wide">
        <Stack gap="xl">
          <header className="photography-page__header">
            <p className="photography-page__eyebrow">{t('collections')}</p>
            <h1>{localize(collection.title, locale)}</h1>
            <p>{localize(collection.description, locale)}</p>
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
            <CollectionGallery
              collection={collection}
              locale={locale}
              viewerLabels={photoViewerLabels(locale)}
            />
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
