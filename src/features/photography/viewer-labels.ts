import type {Locale} from '@/content/contracts';
import {messagesByLocale} from '@/i18n/messages';

import type {PhotoViewerLabels} from './photo-viewer-contract';

export function photoViewerLabels(locale: Locale): PhotoViewerLabels {
  const messages = messagesByLocale[locale];
  return {
    viewerTitle: messages.dialogs.photoViewerTitle,
    loading: messages.loading.photography,
    close: messages.buttons.close,
    previous: messages.buttons.previous,
    next: messages.buttons.next,
    zoomIn: messages.buttons.zoomIn,
    zoomOut: messages.buttons.zoomOut,
    unavailable: messages.errors.viewerUnavailable,
  };
}
