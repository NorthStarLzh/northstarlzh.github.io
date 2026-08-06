'use client';

import {useState} from 'react';

import type {Locale, PhotoCollection} from '@/content/contracts';

import {MasonryGallery} from './masonry-gallery';
import {PhotoViewer} from './photo-viewer';
import type {PhotoViewerLabels} from './photo-viewer-contract';

export interface CollectionGalleryProps {
  collection: PhotoCollection;
  locale: Locale;
  viewerLabels: PhotoViewerLabels;
}

/**
 * Collection detail feed: a balanced waterfall of the collection's photos
 * plus the shared PPT-style viewer opened from any thumbnail.
 */
export function CollectionGallery({
  collection,
  locale,
  viewerLabels,
}: CollectionGalleryProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <>
      <MasonryGallery
        locale={locale}
        onOpen={setActiveId}
        photos={collection.photos}
      />
      <PhotoViewer
        activeId={activeId}
        labels={viewerLabels}
        locale={locale}
        onClose={() => setActiveId(null)}
        photos={collection.photos}
      />
    </>
  );
}
