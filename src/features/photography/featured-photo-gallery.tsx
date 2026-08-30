'use client';

import {useState} from 'react';

import type {Locale, Photo} from '@/content/contracts';

import {FeaturedGallery} from './featured-gallery';
import {PhotoViewer} from './photo-viewer';
import type {PhotoViewerLabels} from './photo-viewer-contract';

export interface FeaturedPhotoGalleryProps {
  eyebrow?: string;
  labels: PhotoViewerLabels;
  locale: Locale;
  photos: Photo[];
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function FeaturedPhotoGallery({
  eyebrow,
  labels,
  locale,
  photos,
  title,
  viewAllHref,
  viewAllLabel,
}: FeaturedPhotoGalleryProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="featured-photography-title" className="featured-photography">
      <div className="eds-section-head eds-section-head--split">
        <div>
          {eyebrow ? <p className="eds-eyebrow">{eyebrow}</p> : null}
          <h2 className="eds-section-title" id="featured-photography-title">{title}</h2>
        </div>
        {viewAllHref && viewAllLabel ? (
          <a className="featured-photography__view-all" href={viewAllHref}>
            {viewAllLabel}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
      <FeaturedGallery locale={locale} onOpen={setActiveId} photos={photos.slice(0, 5)} />
      <PhotoViewer
        activeId={activeId}
        labels={labels}
        locale={locale}
        onClose={() => setActiveId(null)}
        photos={photos.slice(0, 5)}
      />
    </section>
  );
}
