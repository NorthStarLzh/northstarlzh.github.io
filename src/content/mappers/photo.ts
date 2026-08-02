import type {LocalizedText, Photo, PhotoCategory} from '../contracts';
import {hasValidPhotoCategories, isNonEmptyLocalizedText, isValidYearMonth} from '../contracts';
import {InvalidContentError} from './errors';
import {
  asRecord,
  localizedText,
  mapImageAsset,
  nonNegativeInteger,
  optionalDocumentId,
  requiredId,
  requiredString,
} from './helpers';

const DEFAULT_PHOTO_ALT: LocalizedText = {zh: '摄影作品', en: 'Photograph'};

/**
 * Photography metadata beyond the image itself is optional. A missing or blank
 * alt falls back to a neutral localized label so batch-uploaded photos still
 * render with a meaningful accessible description.
 */
function photoAltOverride(rawImage: unknown): LocalizedText | undefined {
  if (typeof rawImage !== 'object' || rawImage === null) return DEFAULT_PHOTO_ALT;
  const alt = (rawImage as {alt?: unknown}).alt;
  return isNonEmptyLocalizedText(alt) ? undefined : DEFAULT_PHOTO_ALT;
}

function parseCategories(value: unknown, id: string): PhotoCategory[] {
  if (value === undefined || value === null) return [];
  if (!hasValidPhotoCategories(value)) {
    throw new InvalidContentError(
      'photo',
      'categories must contain supported unique values.',
      id,
      'categories.supported_unique_required',
    );
  }
  return [...value];
}

function parseOptionalString(
  value: unknown,
  field: string,
  id: string,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return requiredString(value, field, 'photo', id);
}

function parseOptionalYearMonth(value: unknown, id: string): string | undefined {
  const text = parseOptionalString(value, 'shotAt', id);
  if (text === undefined) return undefined;
  if (!isValidYearMonth(text)) {
    throw new InvalidContentError(
      'photo',
      'shotAt must use YYYY-MM.',
      id,
      'shotAt.year_month_required',
    );
  }
  return text;
}

function parseOptionalLocalized(
  value: unknown,
  field: string,
  id: string,
): LocalizedText | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') {
    const record = value as {zh?: unknown; en?: unknown};
    const emptyZh = record.zh === undefined || record.zh === null || String(record.zh).trim() === '';
    const emptyEn = record.en === undefined || record.en === null || String(record.en).trim() === '';
    if (emptyZh && emptyEn) return undefined;
  }
  return localizedText(value, field, 'photo', id);
}

export function mapPhoto(value: unknown): Photo {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'photo', documentId);
  const id = requiredId(raw._id, 'photo', documentId);
  const featured = raw.featured === true;
  const featuredOrder = featured
    ? nonNegativeInteger(raw.featuredOrder, 'featuredOrder', 'photo', id)
    : undefined;
  const shotAt = parseOptionalYearMonth(raw.shotAt, id);
  const city = parseOptionalLocalized(raw.city, 'city', id);
  const description = parseOptionalLocalized(raw.description, 'description', id);
  const photo: Photo = {
    id,
    image: mapImageAsset(raw.image, 'photo', id, photoAltOverride(raw.image)),
    categories: parseCategories(raw.categories, id),
    featured,
    ...(featuredOrder === undefined ? {} : {featuredOrder}),
  };
  if (shotAt !== undefined) photo.shotAt = shotAt;
  if (city !== undefined) photo.city = city;
  if (description !== undefined) photo.description = description;
  return photo;
}
