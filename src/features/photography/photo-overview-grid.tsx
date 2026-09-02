'use client';

import type {Locale, Photo} from '@/content/contracts';

import {PhotoThumbnailCard} from './photo-thumbnail-card';

export interface PhotoOverviewGridProps {
  locale: Locale;
  onOpen: (photoId: string) => void;
  photos: Photo[];
}

export const PHOTO_OVERVIEW_THUMBNAIL_SIZES =
  '(min-width: 75rem) 16vw, (min-width: 48rem) 25vw, 34vw';

/**
 * Dense category-page contact sheet. Its fixed thumbnail frame makes it quick
 * to scan a broad range of work; selecting an item still opens the uncropped
 * original in the shared viewer.
 */
export function PhotoOverviewGrid({
  locale,
  onOpen,
  photos,
}: PhotoOverviewGridProps) {
  return (
    <div className="photography-overview" data-testid="photography-overview">
      {photos.map((photo) => (
        <PhotoThumbnailCard
          key={photo.id}
          locale={locale}
          onOpen={onOpen}
          photo={photo}
          sizes={PHOTO_OVERVIEW_THUMBNAIL_SIZES}
        />
      ))}
    </div>
  );
}
