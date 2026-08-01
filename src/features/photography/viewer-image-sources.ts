import type {ImageAsset} from '@/content/contracts';
import {
  buildResponsiveImageSources,
  type ImageCdnConfiguration,
  type ResponsiveImageSources,
} from '@/lib/image-url';

const VIEWER_WIDTHS = [1280, 1920, 2560] as const;

export function buildViewerImageSources(
  image: ImageAsset,
  configuration?: ImageCdnConfiguration,
): ResponsiveImageSources {
  return buildResponsiveImageSources({
    image,
    widths: VIEWER_WIDTHS,
    fallbackPath: '/photography-viewer-placeholder.svg',
    configuration,
  });
}
