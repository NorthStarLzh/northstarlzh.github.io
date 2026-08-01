'use client';

import type { Locale, PageResult, Photo, PhotoCategory } from '@/content/contracts';

import { PhotoFeed, type PhotoFeedLabels } from './photo-feed';
import type { PhotoViewerLabels } from './photo-viewer-contract';

export interface PhotographyListProps {
  category: PhotoCategory;
  currentPage: number;
  hasMore: boolean;
  initialPage: PageResult<Photo>;
  labels: PhotoFeedLabels;
  locale: Locale;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
  viewerLabels: PhotoViewerLabels;
}

export function PhotographyList(props: PhotographyListProps) {
  function announceOpen(photoId: string) {
    window.dispatchEvent(
      new CustomEvent('photography:open', {
        detail: { photoId },
      }),
    );
  }

  return <PhotoFeed {...props} onOpen={announceOpen} />;
}
