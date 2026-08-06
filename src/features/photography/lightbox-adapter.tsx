'use client';

import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import {useCallback, useRef} from 'react';

import {localize} from '@/i18n';

import type {LightboxAdapterProps} from './photo-viewer-contract';
import {derivePhotoIndex} from './photo-id';
import {buildViewerImageSources} from './viewer-image-sources';

export function LightboxAdapter({
  photos,
  activeId,
  locale,
  labels,
  onClose,
  onNearEnd,
  onView,
}: LightboxAdapterProps) {
  const prefetchedLength = useRef<number | null>(null);
  const index = derivePhotoIndex(photos, activeId);
  const slides = photos.map((photo) => {
    const sources = buildViewerImageSources(photo.image);
    const title = photo.shotAt || photo.city ? (
      <span className="photo-viewer-caption__title">
        {photo.shotAt ? <time dateTime={photo.shotAt}>{photo.shotAt}</time> : null}
        {photo.shotAt && photo.city ? <span aria-hidden="true"> · </span> : null}
        {photo.city ? localize(photo.city, locale) : null}
      </span>
    ) : undefined;
    const description = photo.description ? (
      <span className="photo-viewer-caption__description">
        {localize(photo.description, locale)}
      </span>
    ) : undefined;
    return {
      src: sources.src,
      srcSet: sources.srcSet,
      width: photo.image.width,
      height: photo.image.height,
      alt: localize(photo.image.alt, locale),
      ...(title ? {title} : {}),
      ...(description ? {description} : {}),
    };
  });

  const handleView = useCallback(({index: nextIndex}: {index: number}) => {
    const nextPhoto = photos[nextIndex];
    if (!nextPhoto) return;
    onView(nextPhoto.id);

    const isNearEnd = nextIndex >= Math.max(photos.length - 2, 0);
    if (
      isNearEnd &&
      onNearEnd &&
      prefetchedLength.current !== photos.length
    ) {
      prefetchedLength.current = photos.length;
      onNearEnd();
    }
  }, [onNearEnd, onView, photos]);

  if (index < 0) return null;

  return (
    <Lightbox
      animation={{fade: 180, navigation: 220, swipe: 220, zoom: 180}}
      carousel={{finite: true, imageFit: 'contain', preload: 1}}
      className="photo-viewer-lightbox"
      close={onClose}
      controller={{closeOnBackdropClick: true}}
      counter={{separator: ' / '}}
      index={index}
      labels={{
        Close: labels.close,
        Previous: labels.previous,
        Next: labels.next,
        'Zoom in': labels.zoomIn,
        'Zoom out': labels.zoomOut,
        Lightbox: labels.viewerTitle,
        'Photo gallery': labels.viewerTitle,
      }}
      on={{view: handleView}}
      open
      plugins={[Captions, Zoom, Counter]}
      slides={slides}
      toolbar={{buttons: ['zoom', 'close']}}
      zoom={{maxZoomPixelRatio: 2, scrollToZoom: true}}
    />
  );
}
