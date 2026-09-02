'use client';

import type {CSSProperties} from 'react';

import {AppImage} from '@/components/ui';
import type {Locale, Photo} from '@/content/contracts';
import {localize} from '@/i18n';

import {buildThumbnailSources} from './thumbnail-sources';

export interface PhotoThumbnailCardProps {
  locale: Locale;
  onOpen: (photoId: string) => void;
  photo: Photo;
  sizes: string;
  style?: CSSProperties;
}

/**
 * Shared interactive thumbnail for photography browsing layouts. The layout
 * decides its frame; opening it always delegates to the original-image viewer.
 */
export function PhotoThumbnailCard({
  locale,
  onOpen,
  photo,
  sizes,
  style,
}: PhotoThumbnailCardProps) {
  const alt = localize(photo.image.alt, locale);
  const sources = buildThumbnailSources(photo.image.id);

  return (
    <article className="photography-card" style={style}>
      <button
        aria-label={alt}
        className="photography-card__button"
        data-photo-id={photo.id}
        onClick={() => onOpen(photo.id)}
        type="button"
      >
        <picture>
          <source sizes={sizes} srcSet={sources.srcSet} />
          <AppImage
            alt={alt}
            blurDataURL={photo.image.blurDataUrl}
            className="photography-card__image"
            height={photo.image.height}
            loading="lazy"
            placeholder={photo.image.blurDataUrl ? 'blur' : 'empty'}
            sizes={sizes}
            src={sources.src}
            unoptimized
            width={photo.image.width}
          />
        </picture>
      </button>
    </article>
  );
}
