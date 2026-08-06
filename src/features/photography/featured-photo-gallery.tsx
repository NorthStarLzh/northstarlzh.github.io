'use client';

import {useState} from 'react';

import type {Locale, Photo} from '@/content/contracts';

import {FeaturedGallery} from './featured-gallery';
import {PhotoViewer} from './photo-viewer';
import type {PhotoViewerLabels} from './photo-viewer-contract';

export interface FeaturedPhotoGalleryProps {
  photos: Photo[];
  locale: Locale;
  labels: PhotoViewerLabels;
  title: string;
}

export function FeaturedPhotoGallery({
  photos,
  locale,
  labels,
  title,
}: FeaturedPhotoGalleryProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="featured-photography-title" className="featured-photography">
      <h2 id="featured-photography-title">{title}</h2>
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
