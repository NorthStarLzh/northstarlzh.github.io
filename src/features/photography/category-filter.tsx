'use client';

import type { Locale, PhotoCategory } from '@/content/contracts';
import { PHOTO_CATEGORIES } from '@/content/contracts';

import { buildPhotographyCategoryIndexUrl } from './category';

export interface CategoryFilterProps {
  activeCategory: PhotoCategory;
  ariaLabel?: string;
  labels: Record<PhotoCategory, string>;
  locale: Locale;
}

export function CategoryFilter({
  activeCategory,
  ariaLabel = 'Photography categories',
  labels,
  locale,
}: CategoryFilterProps) {
  return (
    <nav aria-label={ariaLabel} className="photography-filter">
      {PHOTO_CATEGORIES.map((category) => {
        const href = `${buildPhotographyCategoryIndexUrl(locale, category)}#gallery`;
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
    </nav>
  );
}
