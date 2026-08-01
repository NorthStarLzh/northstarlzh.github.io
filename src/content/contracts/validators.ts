import {
  PHOTO_CATEGORIES,
  type ImageAsset,
  type LocalizedText,
  type PhotoCategory,
} from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const PHOTO_CATEGORY_SET: ReadonlySet<string> = new Set(PHOTO_CATEGORIES);

export function isNonEmptyLocalizedText(value: unknown): value is LocalizedText {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<Record<keyof LocalizedText, unknown>>;
  return (
    typeof candidate.zh === 'string' &&
    candidate.zh.trim().length > 0 &&
    typeof candidate.en === 'string' &&
    candidate.en.trim().length > 0
  );
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_PATTERN.test(value) && value.length <= 254;
}

export function isValidYearMonth(value: unknown): value is string {
  return typeof value === 'string' && YEAR_MONTH_PATTERN.test(value);
}

export function hasValidImageDimensions(
  value: unknown,
): value is Pick<ImageAsset, 'width' | 'height' | 'aspectRatio'> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ImageAsset>;
  return (
    typeof candidate.width === 'number' &&
    Number.isFinite(candidate.width) &&
    candidate.width > 0 &&
    typeof candidate.height === 'number' &&
    Number.isFinite(candidate.height) &&
    candidate.height > 0 &&
    typeof candidate.aspectRatio === 'number' &&
    Number.isFinite(candidate.aspectRatio) &&
    candidate.aspectRatio > 0
  );
}

export function hasValidPhotoCategories(
  value: unknown,
): value is PhotoCategory[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (category, index) =>
        typeof category === 'string' &&
        PHOTO_CATEGORY_SET.has(category) &&
        value.indexOf(category) === index,
    )
  );
}

export function hasValidResearchImageCount(value: unknown): value is ImageAsset[] {
  return Array.isArray(value) && value.length >= 1 && value.length <= 3;
}
