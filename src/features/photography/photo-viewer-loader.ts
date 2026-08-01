import type {ComponentType} from 'react';

import type {LightboxAdapterProps} from './photo-viewer-contract';

export interface PhotoViewerAdapterModule {
  default: ComponentType<LightboxAdapterProps>;
}

export async function loadPhotoViewerAdapter(): Promise<PhotoViewerAdapterModule> {
  const {LightboxAdapter} = await import('./lightbox-adapter');
  return {default: LightboxAdapter};
}
