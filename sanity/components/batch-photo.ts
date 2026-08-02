export const PHOTO_CATEGORY_OPTIONS = [
  {value: 'landscape', title: '风光'},
  {value: 'portrait', title: '人像'},
] as const;

export type BatchPhotoCategory = (typeof PHOTO_CATEGORY_OPTIONS)[number]['value'];

export interface BatchPhotoDefaults {
  /** Optional category applied to every uploaded image. */
  category?: BatchPhotoCategory;
  /** Optional shooting date (YYYY-MM) applied to every uploaded image. */
  shotAt?: string;
  /** Optional shooting city applied to both languages of every uploaded image. */
  city?: string;
}

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface BatchPhotoDocument {
  _type: 'photo';
  image: {
    _type: 'image';
    asset: {_type: 'reference'; _ref: string};
    hotspot: {_type: 'sanity.imageHotspot'; x: number; y: number; width: number; height: number};
  };
  categories?: BatchPhotoCategory[];
  shotAt?: string;
  city?: {_type: 'localizedShortText'; zh: string; en: string};
}

/**
 * Normalises an optional YYYY-MM value. Returns undefined when the value is
 * blank or malformed so a batch upload never stores invalid photo metadata.
 */
export function sanitizeShotAt(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed.length === 0 || !YEAR_MONTH_PATTERN.test(trimmed) ? undefined : trimmed;
}

/**
 * Builds the minimal photo document stub for a freshly uploaded asset. Every
 * field beyond `image` is optional and only present when a default was given,
 * matching the optional metadata contract of the `photo` schema.
 */
export function buildBatchPhotoDocument(
  assetRef: string,
  defaults: BatchPhotoDefaults = {},
): BatchPhotoDocument {
  const document: BatchPhotoDocument = {
    _type: 'photo',
    image: {
      _type: 'image',
      asset: {_type: 'reference', _ref: assetRef},
      hotspot: {_type: 'sanity.imageHotspot', x: 0.5, y: 0.5, width: 1, height: 1},
    },
  };

  if (defaults.category) document.categories = [defaults.category];

  const shotAt = sanitizeShotAt(defaults.shotAt);
  if (shotAt) document.shotAt = shotAt;

  const city = defaults.city?.trim();
  if (city) document.city = {_type: 'localizedShortText', zh: city, en: city};

  return document;
}

/** Whether a picked file is eligible for photography upload. */
export function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/** Maximum number of photos that can be featured on the homepage. */
export const MAX_FEATURED_PHOTOS = 5;

/**
 * Picks the next non-negative featured order that does not collide with the
 * existing featured orders, keeping the homepage featured order unique and
 * deterministic (newest featured photo lands last).
 */
export function computeNextFeaturedOrder(existingOrders: number[]): number {
  let max = -1;
  for (const order of existingOrders) {
    if (Number.isInteger(order) && order >= 0 && order > max) max = order;
  }
  return max + 1;
}

/** Whether the homepage already features the maximum number of photos. */
export function hasReachedFeaturedLimit(featuredCount: number): boolean {
  return featuredCount >= MAX_FEATURED_PHOTOS;
}
