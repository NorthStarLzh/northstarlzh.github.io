'use client';

import type { Locale, PhotoCategory } from '@/content/contracts';
import { PHOTO_CATEGORIES } from '@/content/contracts';

import {
  buildPhotographyCategoryIndexUrl,
  buildPhotographyCollectionsUrl,
} from './category';

export interface CategoryFilterProps {
  activeCategory: PhotoCategory | 'collections';
  ariaLabel?: string;
  labels: Record<PhotoCategory, string> & { collections: string };
  locale: Locale;
}

export function CategoryFilter({
  activeCategory,
  ariaLabel = 'Photography categories',
  labels,
  locale,
}: CategoryFilterProps) {
  const collectionsHref = buildPhotographyCollectionsUrl(locale);

  return (
    <nav aria-label={ariaLabel} className="photography-filter">
      {PHOTO_CATEGORIES.map((category) => {
        const href = buildPhotographyCategoryIndexUrl(locale, category);
        return (
          <a
            aria-current={activeCategory === category ? 'true' : undefined}
            className="photography-filter__link"
            href={href}
            key={category}
          >
            {labels[category]}
          </a>
        );
      })}
      <a
        aria-current={activeCategory === 'collections' ? 'true' : undefined}
        className="photography-filter__link"
        href={collectionsHref}
      >
        {labels.collections}
      </a>
    </nav>
  );
}
