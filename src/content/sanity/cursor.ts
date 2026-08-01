import type {PhotoCategory} from '../contracts';

const CURSOR_PREFIX = 'photo-v1.';
const MAX_FEATURED_ORDER = 2_147_483_647;

export interface PhotoCursorValue {
  category: PhotoCategory;
  featured: boolean;
  featuredOrder: number;
  shotAt: string;
  id: string;
}

interface RawPhotoSortValue {
  _id?: unknown;
  featured?: unknown;
  featuredOrder?: unknown;
  shotAt?: unknown;
}

function isPhotoCategory(value: unknown): value is PhotoCategory {
  return value === 'landscape' || value === 'portrait';
}

export function encodePhotoCursor(
  category: PhotoCategory,
  value: RawPhotoSortValue,
): string {
  if (typeof value._id !== 'string' || value._id.length === 0) {
    throw new RangeError('Cannot create a photo cursor without a document id.');
  }

  const featured = value.featured === true;
  const featuredOrder = featured &&
    typeof value.featuredOrder === 'number' &&
    Number.isInteger(value.featuredOrder) &&
    value.featuredOrder >= 0
    ? value.featuredOrder
    : MAX_FEATURED_ORDER;
  const shotAt = typeof value.shotAt === 'string' ? value.shotAt : '';
  const payload: PhotoCursorValue = {
    category,
    featured,
    featuredOrder,
    shotAt,
    id: value._id,
  };

  return `${CURSOR_PREFIX}${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`;
}

export function decodePhotoCursor(
  cursor: string,
  expectedCategory: PhotoCategory,
): PhotoCursorValue {
  if (!cursor.startsWith(CURSOR_PREFIX) || cursor.length > 1024) {
    throw new RangeError('Invalid photo cursor.');
  }

  try {
    const encoded = cursor.slice(CURSOR_PREFIX.length);
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<PhotoCursorValue>;
    if (
      !isPhotoCategory(value.category) ||
      value.category !== expectedCategory ||
      typeof value.featured !== 'boolean' ||
      typeof value.featuredOrder !== 'number' ||
      !Number.isInteger(value.featuredOrder) ||
      value.featuredOrder < 0 ||
      value.featuredOrder > MAX_FEATURED_ORDER ||
      typeof value.shotAt !== 'string' ||
      value.shotAt.length > 64 ||
      typeof value.id !== 'string' ||
      value.id.length === 0 ||
      value.id.length > 256
    ) {
      throw new Error('Invalid cursor payload.');
    }

    return value as PhotoCursorValue;
  } catch (error) {
    if (error instanceof RangeError) throw error;
    throw new RangeError('Invalid photo cursor.', {cause: error});
  }
}

export {MAX_FEATURED_ORDER};
