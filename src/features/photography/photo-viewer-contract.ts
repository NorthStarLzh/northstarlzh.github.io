import type {Locale, Photo} from '@/content/contracts';

export interface PhotoViewerLabels {
  viewerTitle: string;
  loading: string;
  close: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  unavailable: string;
}

export interface PhotoViewerProps {
  photos: Photo[];
  activeId: string | null;
  locale: Locale;
  labels: PhotoViewerLabels;
  onClose: () => void;
  onNearEnd?: () => void;
}

export interface LightboxAdapterProps extends PhotoViewerProps {
  activeId: string;
  onView: (photoId: string) => void;
}
