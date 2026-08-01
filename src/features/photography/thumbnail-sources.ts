export interface ThumbnailCdnConfiguration {
  projectId?: string;
  dataset?: string;
}

export interface ThumbnailSources {
  src: string;
  srcSet: string;
}

const THUMBNAIL_WIDTHS = [480, 800, 1200] as const;

function validSegment(value: string | undefined): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
}

export function buildThumbnailSources(
  assetId: string,
  configuration: ThumbnailCdnConfiguration = {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
): ThumbnailSources {
  const match = /^image-([a-zA-Z0-9]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/.exec(assetId);
  const base = match && validSegment(configuration.projectId) && validSegment(configuration.dataset)
    ? `https://cdn.sanity.io/images/${configuration.projectId}/${configuration.dataset}/${match[1]}-${match[2]}.${match[3]}`
    : '/photography-thumbnail-placeholder.svg';
  const separator = base.includes('?') ? '&' : '?';
  const variant = (width: number) => `${base}${separator}auto=format&fit=max&w=${width}`;

  return {
    src: variant(800),
    srcSet: THUMBNAIL_WIDTHS.map((width) => `${variant(width)} ${width}w`).join(', '),
  };
}
