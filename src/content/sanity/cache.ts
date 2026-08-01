export const CONTENT_REVALIDATE_SECONDS = 60;

export const CONTENT_CACHE_TAGS = {
  profile: 'profile',
  education: 'education',
  awards: 'awards',
  photos: 'photos',
  research: 'research',
  resume: 'resume',
  home: 'home',
} as const;

export type ContentCacheTag =
  (typeof CONTENT_CACHE_TAGS)[keyof typeof CONTENT_CACHE_TAGS];

export interface SanityFetchOptions {
  cache: 'force-cache';
  next: {
    revalidate: typeof CONTENT_REVALIDATE_SECONDS;
    tags: ContentCacheTag[];
  };
}

export function contentFetchOptions(
  ...tags: ContentCacheTag[]
): SanityFetchOptions {
  return {
    cache: 'force-cache',
    next: {
      revalidate: CONTENT_REVALIDATE_SECONDS,
      tags: [...new Set(tags)],
    },
  };
}
