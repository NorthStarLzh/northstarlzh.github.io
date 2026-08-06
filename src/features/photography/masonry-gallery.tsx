'use client';

import {
  type CSSProperties,
  useEffect,
  useState,
} from 'react';

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

interface ColumnBreakpoint {
  maxWidth: number;
  columns: number;
}

// Mirrors the responsive widths used for PHOTO_THUMBNAIL_SIZES:
// <36rem = 1, <48rem = 2, <75rem = 3, >=75rem = 4.
const COLUMN_BREAKPOINTS: ColumnBreakpoint[] = [
  {maxWidth: 576, columns: 1},
  {maxWidth: 768, columns: 2},
  {maxWidth: 1200, columns: 3},
  {maxWidth: Number.POSITIVE_INFINITY, columns: 4},
];

function columnCountForWidth(width: number): number {
  const match = COLUMN_BREAKPOINTS.find(({maxWidth}) => width < maxWidth);
  return match?.columns ?? 4;
}

function useColumnCount(): number {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const update = () => setColumnCount(columnCountForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return columnCount;
}

/**
 * Balance photographs across the columns by their known aspect ratios
 * (each photo's rendered height is columnWidth / aspectRatio, so the
 * inverse ratio is a proportional height estimate). Each photo goes to the
 * currently shortest column, producing an even waterfall without cropping.
 */
function distributePhotos(photos: Photo[], columnCount: number): Photo[][] {
  if (columnCount <= 1 || photos.length === 0) {
    return [photos];
  }

  const columns: Photo[][] = Array.from({length: columnCount}, () => []);
  const heights = new Array<number>(columnCount).fill(0);

  for (const photo of photos) {
    let shortest = 0;
    for (let column = 1; column < columnCount; column++) {
      if (heights[column] < heights[shortest]) {
        shortest = column;
      }
    }
    columns[shortest].push(photo);
    heights[shortest] += 1 / photo.image.aspectRatio;
  }

  return columns;
}

function renderPhoto(photo: Photo, locale: Locale, onOpen: (photoId: string) => void) {
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
}

export function MasonryGallery({photos, locale, onOpen}: MasonryGalleryProps) {
  const columnCount = useColumnCount();
  const columns = distributePhotos(photos, columnCount);

  return (
    <div
      className="photography-masonry"
      data-testid="photography-masonry"
      style={{'--photography-columns': columnCount} as CSSProperties}
    >
      {columns.map((column, columnIndex) => (
        <div className="photography-masonry__column" key={columnIndex}>
          {column.map((photo) => renderPhoto(photo, locale, onOpen))}
        </div>
      ))}
    </div>
  );
}
