import type { ImageAsset } from '@/content/contracts';
import {
  buildResponsiveImageSources,
  type ResponsiveImageSources,
} from '@/lib/image-url';

const HOME_HERO_WIDTHS = [640, 1024, 1600, 2400] as const;
const HOME_AVATAR_WIDTHS = [160, 320, 640] as const;
const HOME_IMAGE_FALLBACK = '/content-image-placeholder.svg';

export function buildHomeHeroSources(image: ImageAsset): ResponsiveImageSources {
  return buildResponsiveImageSources({
    image,
    widths: HOME_HERO_WIDTHS,
    fallbackPath: HOME_IMAGE_FALLBACK,
  });
}

export function buildHomeAvatarSources(image: ImageAsset): ResponsiveImageSources {
  return buildResponsiveImageSources({
    image,
    widths: HOME_AVATAR_WIDTHS,
    fallbackPath: HOME_IMAGE_FALLBACK,
  });
}

export function toSrcSet(sources: ResponsiveImageSources): string {
  return sources.srcSet
    .map((source) => `${source.src} ${source.width}w`)
    .join(', ');
}
