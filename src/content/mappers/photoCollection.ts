import type {LocalizedText, PhotoCollection} from '../contracts';
import {isNonEmptyLocalizedText} from '../contracts';
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
import {mapPhoto} from './photo';

const DEFAULT_COVER_ALT: LocalizedText = {zh: '合集封面', en: 'Collection cover'};

/**
 * A collection cover is decorative and the alt is optional. A missing or
 * blank alt falls back to a neutral localized label.
 */
function coverAltOverride(rawCover: unknown): LocalizedText | undefined {
  if (typeof rawCover !== 'object' || rawCover === null) return DEFAULT_COVER_ALT;
  const alt = (rawCover as {alt?: unknown}).alt;
  return isNonEmptyLocalizedText(alt) ? undefined : DEFAULT_COVER_ALT;
}

export function mapPhotoCollection(value: unknown): PhotoCollection {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'photoCollection', documentId);
  const id = requiredId(raw._id, 'photoCollection', documentId);

  if (!Array.isArray(raw.photos) || raw.photos.length === 0) {
    throw new InvalidContentError(
      'photoCollection',
      'photos must contain at least one photo.',
      id,
      'photos.one_or_more_required',
    );
  }
  const photos = raw.photos.map(mapPhoto);

  const collection: PhotoCollection = {
    id,
    title: localizedText(raw.title, 'title', 'photoCollection', id),
    description: localizedText(raw.description, 'description', 'photoCollection', id),
    slug: requiredString(raw.slug, 'slug', 'photoCollection', id),
    photos,
  };

  if (raw.cover !== undefined && raw.cover !== null) {
    collection.cover = mapImageAsset(
      raw.cover,
      'photoCollection',
      id,
      coverAltOverride(raw.cover),
    );
  }
  if (raw.sortOrder !== undefined && raw.sortOrder !== null) {
    collection.sortOrder = nonNegativeInteger(raw.sortOrder, 'sortOrder', 'photoCollection', id);
  }
  return collection;
}
