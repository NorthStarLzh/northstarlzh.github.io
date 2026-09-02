export const PHOTO_CATEGORY_OPTIONS = [
  {value: 'landscape', title: '风光'},
  {value: 'portrait', title: '人像'},
] as const;

export type BatchPhotoCategory = (typeof PHOTO_CATEGORY_OPTIONS)[number]['value'];

export interface BatchPhotoDefaults {
  /** Optional categories applied to every uploaded image. */
  categories?: BatchPhotoCategory[];
  /** Optional category-page ordering number applied to every uploaded image. */
  displayOrder?: number | string;
  /** Optional shooting date (YYYY-MM) applied to every uploaded image. */
  shotAt?: string;
  /** Optional shooting city applied to both languages of every uploaded image. */
  city?: string;
}

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface PhotoImageValue {
  _type: 'image';
  asset: {_type: 'reference'; _ref: string};
  hotspot: {_type: 'sanity.imageHotspot'; x: number; y: number; width: number; height: number};
}

export interface BatchPhotoDocument {
  _type: 'photo';
  image: PhotoImageValue;
  categories?: BatchPhotoCategory[];
  displayOrder?: number;
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

/** Normalises an optional non-negative integer category-page order. */
export function sanitizeDisplayOrder(value: number | string | undefined): number | undefined {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  }

  const trimmed = value?.trim() ?? '';
  if (!/^\d+$/.test(trimmed)) return undefined;
  const order = Number(trimmed);
  return Number.isSafeInteger(order) ? order : undefined;
}

/**
 * Builds a fresh image value for a replacement file. Resetting the hotspot is
 * intentional: coordinates from the previous image are not meaningful for a
 * file with different dimensions.
 */
export function buildPhotoImageValue(assetRef: string): PhotoImageValue {
  const normalizedAssetRef = assetRef.trim();
  if (normalizedAssetRef.length === 0) {
    throw new TypeError('Photo image asset reference is required.');
  }

  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: normalizedAssetRef},
    hotspot: {_type: 'sanity.imageHotspot', x: 0.5, y: 0.5, width: 1, height: 1},
  };
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
    image: buildPhotoImageValue(assetRef),
  };

  if (defaults.categories && defaults.categories.length > 0) {
    document.categories = [...new Set(defaults.categories)];
  }

  const displayOrder = sanitizeDisplayOrder(defaults.displayOrder);
  if (displayOrder !== undefined) document.displayOrder = displayOrder;

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
