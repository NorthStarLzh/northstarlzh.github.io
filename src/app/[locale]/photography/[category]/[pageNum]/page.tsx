import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale, PageResult, Photo, PhotoCategory } from '@/content/contracts';
import { PHOTO_CATEGORIES } from '@/content/contracts';
import { createSanityRepositories, MAX_PHOTO_PAGE_SIZE } from '@/content/repositories';
import {
  CategoryFilter,
  PhotographyList,
  photoViewerLabels,
  parsePhotoCategory,
} from '@/features/photography';
import { routing } from '@/i18n/routing';

/** Safety cap for static page generation. Pages beyond available data return 404. */
const MAX_PAGES = 20;

export function generateStaticParams() {
  const params: { locale: string; category: string; pageNum: string }[] = [];
  for (const locale of routing.locales) {
    for (const category of PHOTO_CATEGORIES) {
      for (let p = 2; p <= MAX_PAGES; p++) {
        params.push({ locale, category, pageNum: String(p) });
      }
    }
  }
  return params;
}

async function loadPage(
  category: PhotoCategory,
  targetPage: number,
): Promise<PageResult<Photo> | null> {
  const repos = createSanityRepositories();
  let cursor: string | undefined;

  for (let current = 1; current <= targetPage; current++) {
    const page = await repos.photos.listPage({
      category,
      cursor,
      limit: MAX_PHOTO_PAGE_SIZE,
    });

    if (current === targetPage) return page;
    if (!page.hasMore || !page.nextCursor) return null;
    cursor = page.nextCursor;
  }

  return null;
}

interface PageNumProps {
  params: Promise<{ locale: Locale; category: string; pageNum: string }>;
}

export default async function PageNumPage({ params }: PageNumProps) {
  const { locale, category: cat, pageNum: raw } = await params;
  const category = parsePhotoCategory(cat);
  const pageNum = Number(raw);

  if (!PHOTO_CATEGORIES.includes(category) || !Number.isInteger(pageNum) || pageNum < 2) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'photography' });

  let page: PageResult<Photo> | null = null;
  try {
    page = await loadPage(category, pageNum);
  } catch {
    // notFound below
  }

  if (!page) notFound();

  const prevPageNum = pageNum - 1;
  const nextPageNum = pageNum + 1;

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
            }}
            locale={locale}
          />
          <div id="gallery">
            <PhotographyList
              category={category}
              currentPage={pageNum}
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
              nextPageUrl={
                page.hasMore
                  ? `/${locale}/photography/${category}/${nextPageNum}/#gallery`
                  : null
              }
              prevPageUrl={
                prevPageNum === 1
                  ? `/${locale}/photography/${category}/#gallery`
                  : `/${locale}/photography/${category}/${prevPageNum}/#gallery`
              }
              viewerLabels={photoViewerLabels(locale)}
            />
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
