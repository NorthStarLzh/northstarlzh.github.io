import { AppImage } from '@/components/ui';
import type { ImageAsset, Locale } from '@/content/contracts';
import { localize } from '@/i18n/localize';
import { buildResponsiveImageSources } from '@/lib/image-url';

interface ResearchImageProps {
  className: string;
  image: ImageAsset;
  locale: Locale;
  loading: 'eager' | 'lazy';
  path: string;
  sizes: string;
}

const RESEARCH_IMAGE_WIDTHS = [480, 800, 1200] as const;

export function ResearchImage({
  className,
  image,
  locale,
  loading,
  path,
  sizes,
}: ResearchImageProps) {
  const sources = buildResponsiveImageSources({
    image,
    widths: RESEARCH_IMAGE_WIDTHS,
    fallbackPath: '/content-image-placeholder.svg',
  });

  return (
    <AppImage
      alt={localize(image.alt, locale, { path })}
      className={className}
      data-asset-id={image.id}
      height={image.height}
      loading={loading}
      sizes={sizes}
      src={sources.src}
      unoptimized
      width={image.width}
    />
  );
}
