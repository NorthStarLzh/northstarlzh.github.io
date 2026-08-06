'use client';

import type {Locale, Photo} from '@/content/contracts';
import {AppImage} from '@/components/ui';
import {localize} from '@/i18n';

import {buildThumbnailSources} from './thumbnail-sources';

export interface FeaturedGalleryProps {
  photos: Photo[];
  locale: Locale;
  onOpen: (photoId: string) => void;
}

export const FEATURED_THUMBNAIL_SIZES =
  '(min-width: 75rem) 25vw, (min-width: 48rem) 33vw, 100vw';

/**
 * Tidy 16:9 "spotlight" grid for the five home-featured photographs:
 * the first photo becomes a lead tile (full-width on tablet, 2×2 on
 * desktop) and the remaining four fill the neighbouring cells. All tiles
 * share the same 16:9 ratio, so the section reads as one clean rectangle.
 */
export function FeaturedGallery({photos, locale, onOpen}: FeaturedGalleryProps) {
  if (photos.length === 0) return null;

  return (
    <div className="featured-gallery" data-testid="featured-gallery">
      {photos.map((photo, index) => {
        const alt = localize(photo.image.alt, locale);
        const sources = buildThumbnailSources(photo.image.id);
        const isLead = index === 0;
        return (
          <article
            className={`photography-card featured-gallery__item${
              isLead ? ' featured-gallery__item--lead' : ''
            }`}
            key={photo.id}
          >
            <button
              aria-label={alt}
              className="photography-card__button"
              data-photo-id={photo.id}
              onClick={() => onOpen(photo.id)}
              type="button"
            >
              <picture>
                <source
                  sizes={FEATURED_THUMBNAIL_SIZES}
                  srcSet={sources.srcSet}
                />
                <AppImage
                  alt={alt}
                  className="photography-card__image"
                  height={photo.image.height}
                  loading={isLead ? 'eager' : 'lazy'}
                  placeholder={photo.image.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={photo.image.blurDataUrl}
                  sizes={FEATURED_THUMBNAIL_SIZES}
                  src={sources.src}
                  unoptimized
                  width={photo.image.width}
                />
              </picture>
            </button>
          </article>
        );
      })}
    </div>
  );
}
