import type {Photo} from '../contracts';
import {hasValidPhotoCategories, isValidYearMonth} from '../contracts';
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

export function mapPhoto(value: unknown): Photo {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'photo', documentId);
  const id = requiredId(raw._id, 'photo', documentId);
  if (!hasValidPhotoCategories(raw.categories)) {
    throw new InvalidContentError(
      'photo',
      'categories must contain supported unique values.',
      id,
      'categories.supported_unique_required',
    );
  }
  const shotAt = requiredString(raw.shotAt, 'shotAt', 'photo', id);
  if (!isValidYearMonth(shotAt)) {
    throw new InvalidContentError(
      'photo',
      'shotAt must use YYYY-MM.',
      id,
      'shotAt.year_month_required',
    );
  }
  const featured = raw.featured === true;
  const featuredOrder = featured
    ? nonNegativeInteger(raw.featuredOrder, 'featuredOrder', 'photo', id)
    : undefined;
  return {
    id,
    image: mapImageAsset(raw.image, 'photo', id),
    categories: [...raw.categories],
    shotAt,
    city: localizedText(raw.city, 'city', 'photo', id),
    description: localizedText(raw.description, 'description', 'photo', id),
    featured,
    ...(featuredOrder === undefined ? {} : {featuredOrder}),
  };
}
