'use client';

import type {Locale, Photo} from '@/content/contracts';
import {AppImage} from '@/components/ui';
import {localize} from '@/i18n';

import {buildThumbnailSources} from './thumbnail-sources';

export interface MasonryGalleryProps {
  photos: Photo[];
  locale: Locale;
  onOpen: (photoId: string) => void;
}

export const PHOTO_THUMBNAIL_SIZES =
  '(min-width: 75rem) 25vw, (min-width: 48rem) 33vw, (min-width: 36rem) 50vw, 100vw';

export function MasonryGallery({photos, locale, onOpen}: MasonryGalleryProps) {
  return (
    <div className="photography-masonry" data-testid="photography-masonry">
      {photos.map((photo) => {
        const alt = localize(photo.image.alt, locale);
        const sources = buildThumbnailSources(photo.image.id);
        return (
          <article className="photography-card" key={photo.id}>
            <button
              aria-label={alt}
              className="photography-card__button"
              data-photo-id={photo.id}
              onClick={() => onOpen(photo.id)}
              type="button"
            >
              <picture>
                <source sizes={PHOTO_THUMBNAIL_SIZES} srcSet={sources.srcSet} />
                <AppImage
                  alt={alt}
                  className="photography-card__image"
                  height={photo.image.height}
                  loading="lazy"
                  placeholder={photo.image.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={photo.image.blurDataUrl}
                  sizes={PHOTO_THUMBNAIL_SIZES}
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
