'use client';

import {type CSSProperties, useLayoutEffect, useRef, useState} from 'react';

import type {Locale, Photo} from '@/content/contracts';

import {PhotoThumbnailCard} from './photo-thumbnail-card';

export interface JustifiedGalleryProps {
  photos: Photo[];
  locale: Locale;
  onOpen: (photoId: string) => void;
}

export interface JustifiedRow {
  height: number;
  justified: boolean;
  photos: readonly Photo[];
}

export const JUSTIFIED_THUMBNAIL_SIZES =
  '(min-width: 75rem) 25vw, (min-width: 48rem) 33vw, (min-width: 36rem) 50vw, 100vw';

const FALLBACK_GAP = 16;
const MIN_ROW_HEIGHT_RATIO = 0.58;
const MAX_ROW_HEIGHT_RATIO = 1.45;

function targetRowHeightForWidth(width: number): number {
  if (width >= 1_200) return 280;
  if (width >= 768) return 230;
  return 180;
}

function rowHeight(
  photos: readonly Photo[],
  containerWidth: number,
  gap: number,
): number {
  const aspectRatio = photos.reduce(
    (sum, photo) => sum + photo.image.aspectRatio,
    0,
  );
  const availableWidth = containerWidth - gap * (photos.length - 1);
  return availableWidth / aspectRatio;
}

function rowCost(
  height: number,
  targetHeight: number,
  photoCount: number,
): number {
  const difference = Math.abs(height - targetHeight) / targetHeight;
  const tooSmall = Math.max(0, MIN_ROW_HEIGHT_RATIO - height / targetHeight);
  const tooTall = Math.max(0, height / targetHeight - MAX_ROW_HEIGHT_RATIO);
  const singletonPenalty = photoCount === 1 ? 0.7 : 0;

  return difference ** 2 + (tooSmall + tooTall) ** 2 * 16 + singletonPenalty;
}

/**
 * Finds a full-width row partition with heights as close as possible to the
 * preferred editorial rhythm. Unlike a column masonry layout, every completed
 * row shares one baseline, including the last row when there is enough content.
 */
export function createJustifiedRows(
  photos: readonly Photo[],
  containerWidth: number,
  gap: number,
  targetHeight = targetRowHeightForWidth(containerWidth),
): JustifiedRow[] {
  if (photos.length === 0 || containerWidth <= 0 || targetHeight <= 0) {
    return [];
  }

  const costs = new Array<number>(photos.length + 1).fill(Number.POSITIVE_INFINITY);
  const previous = new Array<number>(photos.length + 1).fill(-1);
  costs[0] = 0;

  for (let end = 1; end <= photos.length; end += 1) {
    for (let start = 0; start < end; start += 1) {
      const row = photos.slice(start, end);
      const height = rowHeight(row, containerWidth, gap);
      if (!Number.isFinite(height) || height <= 0) continue;

      const nextCost = costs[start] + rowCost(height, targetHeight, row.length);
      if (nextCost < costs[end]) {
        costs[end] = nextCost;
        previous[end] = start;
      }
    }
  }

  const rows: JustifiedRow[] = [];
  for (let end = photos.length; end > 0;) {
    const start = previous[end];
    if (start < 0) {
      return [{ height: targetHeight, justified: false, photos }];
    }

    const row = photos.slice(start, end);
    const height = rowHeight(row, containerWidth, gap);
    const constrained = height > targetHeight * MAX_ROW_HEIGHT_RATIO;
    rows.unshift({
      height: constrained ? targetHeight : height,
      justified: !constrained,
      photos: row,
    });
    end = start;
  }

  return rows;
}

function readGap(element: HTMLElement): number {
  const gap = Number.parseFloat(window.getComputedStyle(element).rowGap);
  return Number.isFinite(gap) && gap >= 0 ? gap : FALLBACK_GAP;
}

function useGalleryMetrics() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ gap: FALLBACK_GAP, width: 0 });

  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return undefined;

    const update = () => {
      const width = Math.round(gallery.getBoundingClientRect().width);
      const gap = readGap(gallery);
      setMetrics((current) => (
        current.width === width && current.gap === gap ? current : { gap, width }
      ));
    };

    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(gallery);
    return () => observer.disconnect();
  }, []);

  return { galleryRef, metrics };
}

function getPhotoCardStyle(
  photo: Photo,
  justified: boolean,
  height: number,
): CSSProperties {
  return justified
    ? {'--photography-aspect-ratio': photo.image.aspectRatio} as CSSProperties
    : {flexBasis: `${Math.round(height * photo.image.aspectRatio)}px`};
}

/**
 * A justified gallery preserves each photograph's aspect ratio while filling
 * every row edge-to-edge. It replaces the uneven lower edge of column masonry.
 */
export function JustifiedGallery({ photos, locale, onOpen }: JustifiedGalleryProps) {
  const { galleryRef, metrics } = useGalleryMetrics();
  const rows = createJustifiedRows(photos, metrics.width, metrics.gap);
  const pendingLayout = metrics.width <= 0;

  return (
    <div
      className="photography-justified"
      data-layout={pendingLayout ? 'pending' : 'ready'}
      data-testid="photography-justified"
      ref={galleryRef}
    >
      {pendingLayout ? (
        <div className="photography-justified__fallback">
          {photos.map((photo) => (
            <PhotoThumbnailCard
              key={photo.id}
              locale={locale}
              onOpen={onOpen}
              photo={photo}
              sizes={JUSTIFIED_THUMBNAIL_SIZES}
              style={getPhotoCardStyle(
                photo,
                false,
                targetRowHeightForWidth(768),
              )}
            />
          ))}
        </div>
      ) : rows.map((row) => (
        <div
          className="photography-justified__row"
          data-justified={row.justified}
          key={row.photos.map(({ id }) => id).join(':')}
          style={{'--photography-row-height': `${row.height}px`} as CSSProperties}
        >
          {row.photos.map((photo) => (
            <PhotoThumbnailCard
              key={photo.id}
              locale={locale}
              onOpen={onOpen}
              photo={photo}
              sizes={JUSTIFIED_THUMBNAIL_SIZES}
              style={getPhotoCardStyle(photo, row.justified, row.height)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
