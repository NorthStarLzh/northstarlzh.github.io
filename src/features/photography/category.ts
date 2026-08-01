import type { Locale, PhotoCategory } from '@/content/contracts';

export function parsePhotoCategory(value: unknown): PhotoCategory {
  return value === 'portrait' ? 'portrait' : 'landscape';
}

/**
 * Build the path-based URL for a photography category index (page 1).
 * Example: /zh/photography/landscape/
 */
export function buildPhotographyCategoryIndexUrl(
  locale: Locale,
  category: PhotoCategory,
): string {
  return `/${locale}/photography/${category}/`;
}

/**
 * Build the path-based URL for a specific photography page.
 * Page 1 returns the category index URL.
 * Example: /zh/photography/landscape/3/
 */
export function buildPhotographyPageUrl(
  locale: Locale,
  category: PhotoCategory,
  pageNum: number,
): string {
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return buildPhotographyCategoryIndexUrl(locale, category);
  }
  if (pageNum === 1) {
    return buildPhotographyCategoryIndexUrl(locale, category);
  }
  return `/${locale}/photography/${category}/${pageNum}/`;
}

/**
 * @deprecated Use {@link buildPhotographyCategoryIndexUrl} for static export.
 * Kept for backward compatibility with the CategoryFilter that uses
 * search-param-based navigation in non-GitHub-Pages mode.
 */
export function buildPhotographyCategoryUrl(
  pathname: string,
  search: string,
  category: PhotoCategory,
): string {
  const query = new URLSearchParams(search);
  query.set('category', category);
  return `${pathname}?${query.toString()}#gallery`;
}
