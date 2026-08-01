import type {ImageAsset} from '@/content/contracts';

export interface ImageCdnConfiguration {
  projectId?: string;
  dataset?: string;
}

export interface ResponsiveImageSource {
  src: string;
  width: number;
  height: number;
}

export interface ResponsiveImageSources {
  src: string;
  srcSet: ResponsiveImageSource[];
}

export interface ResponsiveImageRequest {
  image: ImageAsset;
  widths: readonly number[];
  fallbackPath: string;
  configuration?: ImageCdnConfiguration;
}

function validSegment(value: string | undefined): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
}

function imageBaseUrl(
  assetId: string,
  fallbackPath: string,
  configuration: ImageCdnConfiguration,
): {base: string; remote: boolean} {
  const match = /^image-([a-zA-Z0-9]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/.exec(assetId);
  if (
    match &&
    validSegment(configuration.projectId) &&
    validSegment(configuration.dataset)
  ) {
    return {
      base: `https://cdn.sanity.io/images/${configuration.projectId}/${configuration.dataset}/${match[1]}-${match[2]}.${match[3]}`,
      remote: true,
    };
  }

  return {base: fallbackPath, remote: false};
}

export function buildResponsiveImageSources({
  image,
  widths,
  fallbackPath,
  configuration = {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
}: ResponsiveImageRequest): ResponsiveImageSources {
  const {base, remote} = imageBaseUrl(image.id, fallbackPath, configuration);
  const requestedWidths = [...new Set(
    widths
      .filter((width) => Number.isInteger(width) && width > 0)
      .map((width) => Math.min(width, image.width)),
  )].sort((left, right) => left - right);
  const effectiveWidths = requestedWidths.length > 0 ? requestedWidths : [image.width];
  const separator = base.includes('?') ? '&' : '?';
  const variant = (width: number) => [
    base,
    separator,
    remote ? 'auto=format&fit=max&' : 'fit=max&',
    `w=${width}`,
  ].join('');
  const srcSet = effectiveWidths.map((width) => ({
    src: variant(width),
    width,
    height: Math.round(width / image.aspectRatio),
  }));

  return {
    src: srcSet[srcSet.length - 1].src,
    srcSet,
  };
}
