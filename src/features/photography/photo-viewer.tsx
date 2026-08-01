'use client';

import {
  type ComponentType,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {Button} from '@/components/ui';

import {derivePhotoIndex} from './photo-id';
import type {
  LightboxAdapterProps,
  PhotoViewerProps,
} from './photo-viewer-contract';
import {loadPhotoViewerAdapter} from './photo-viewer-loader';

export function PhotoViewer({
  photos,
  activeId,
  locale,
  labels,
  onClose,
  onNearEnd,
}: PhotoViewerProps) {
  const [Adapter, setAdapter] = useState<ComponentType<LightboxAdapterProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [viewedPhoto, setViewedPhoto] = useState<{
    startingId: string;
    currentId: string;
  } | null>(null);
  const previousActiveId = useRef<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    const returnFocus = returnFocusRef.current;
    returnFocusRef.current = null;
    if (!returnFocus?.isConnected) return;
    queueMicrotask(() => returnFocus.focus());
  }, []);

  const close = useCallback(() => {
    setAdapter(null);
    setViewedPhoto(null);
    setLoadFailed(false);
    onClose();
    restoreFocus();
  }, [onClose, restoreFocus]);

  const currentId = activeId && viewedPhoto?.startingId === activeId
    ? viewedPhoto.currentId
    : activeId;

  useEffect(() => {
    if (activeId && previousActiveId.current === null) {
      const activeElement = document.activeElement;
      returnFocusRef.current = activeElement instanceof HTMLElement
        ? activeElement
        : null;
    }

    previousActiveId.current = activeId;
    if (!activeId) {
      return;
    }

    if (derivePhotoIndex(photos, currentId) < 0) {
      onClose();
      restoreFocus();
    }
  }, [activeId, currentId, onClose, photos, restoreFocus]);

  useEffect(() => {
    if (!activeId || Adapter || loadFailed) return;
    let cancelled = false;
    void loadPhotoViewerAdapter().then(
      ({default: LoadedAdapter}) => {
        if (!cancelled) setAdapter(() => LoadedAdapter);
      },
      () => {
        if (!cancelled) setLoadFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [Adapter, activeId, loadFailed]);

  if (!activeId || !currentId || derivePhotoIndex(photos, currentId) < 0) {
    return null;
  }

  if (loadFailed) {
    function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
      if (event.target === event.currentTarget) close();
    }

    return (
      <div
        aria-label={labels.viewerTitle}
        className="photo-viewer-fallback"
        data-testid="photo-viewer-error-backdrop"
        onClick={closeFromBackdrop}
        role="alert"
      >
        <div className="photo-viewer-fallback__panel">
          <p>{labels.unavailable}</p>
          <Button autoFocus onClick={close} variant="secondary">
            {labels.close}
          </Button>
        </div>
      </div>
    );
  }

  if (!Adapter) {
    return (
      <div aria-live="polite" className="photo-viewer-loading" role="status">
        {labels.loading}
      </div>
    );
  }

  return (
    <Adapter
      activeId={currentId}
      labels={labels}
      locale={locale}
      onClose={close}
      onNearEnd={onNearEnd}
      onView={(photoId) => setViewedPhoto({startingId: activeId, currentId: photoId})}
      photos={photos}
    />
  );
}
