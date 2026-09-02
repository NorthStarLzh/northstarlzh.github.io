'use client';

import {useState} from 'react';

import type {Locale, PhotoCollection} from '@/content/contracts';

import {JustifiedGallery} from './justified-gallery';
import {PhotoViewer} from './photo-viewer';
import type {PhotoViewerLabels} from './photo-viewer-contract';

export interface CollectionGalleryProps {
  collection: PhotoCollection;
  locale: Locale;
  viewerLabels: PhotoViewerLabels;
}

/**
 * Collection detail feed: a ratio-preserving justified gallery plus the shared
 * PPT-style viewer opened from any thumbnail.
 */
export function CollectionGallery({
  collection,
  locale,
  viewerLabels,
}: CollectionGalleryProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <>
      <JustifiedGallery
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
