import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale, PageResult, Photo } from '@/content/contracts';
import { PHOTO_CATEGORIES } from '@/content/contracts';
import { createSanityRepositories, MAX_PHOTO_PAGE_SIZE } from '@/content/repositories';
import {
  CategoryFilter,
  PhotographyList,
  photoViewerLabels,
  parsePhotoCategory,
} from '@/features/photography';
import { routing } from '@/i18n/routing';

interface CategoryPageProps {
  params: Promise<{ locale: Locale; category: string }>;
}

export function generateStaticParams() {
  const params: { locale: string; category: string }[] = [];
  for (const locale of routing.locales) {
    for (const category of PHOTO_CATEGORIES) {
      params.push({ locale, category });
    }
  }
  return params;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, category: categoryParam } = await params;
  const category = parsePhotoCategory(categoryParam);

  // If the URL contains an unrecognised category, return 404.
  if (!PHOTO_CATEGORIES.includes(category)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'photography' });

  let page: PageResult<Photo> | null = null;
  try {
    const repos = createSanityRepositories();
    page = await repos.photos.listPage({ category, limit: MAX_PHOTO_PAGE_SIZE });
  } catch {
    // Error state rendered below.
  }

  // For cursor-based pagination we cannot know the exact total page count;
  // `hasMore` already signals "at least one more page exists".

  return (
    <Section as="section" className="photography-page">
      <Container size="wide">
        <Stack gap="xl">
          <header className="photography-page__header">
            <p className="photography-page__eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p>{t('intro')}</p>
          </header>
          <CategoryFilter
            activeCategory={category}
            ariaLabel={t('categoryLabel')}
            labels={{
              landscape: t('categories.landscape'),
              portrait: t('categories.portrait'),
              collections: t('collections'),
            }}
            locale={locale}
          />
          <div id="gallery">
            {page ? (
              <PhotographyList
                category={category}
                currentPage={1}
                hasMore={page.hasMore}
                initialPage={page}
                labels={{
                  loadMore: t('loadMore'),
                  loading: t('loading'),
                  retry: t('retry'),
                  complete: t('complete'),
                  error: t('error'),
                  empty: t('empty'),
                  prevPage: t('pagination.prev'),
                  nextPage: t('pagination.next'),
                  pageInfo: t('pagination.pageInfo'),
                }}
                locale={locale}
                nextPageUrl={page.hasMore ? `/${locale}/photography/${category}/2/#gallery` : null}
                prevPageUrl={null}
                viewerLabels={photoViewerLabels(locale)}
              />
            ) : (
              <p className="photography-feed__status" role="alert">{t('error')}</p>
            )}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
