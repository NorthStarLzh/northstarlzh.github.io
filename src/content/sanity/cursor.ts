import type {PhotoCategory} from '../contracts';

const CURSOR_PREFIX = 'photo-v2.';

export interface PhotoCursorValue {
  category: PhotoCategory;
  offset: number;
}

function isPhotoCategory(value: unknown): value is PhotoCategory {
  return value === 'landscape' || value === 'portrait';
}

export function encodePhotoCursor(
  category: PhotoCategory,
  offset: number,
): string {
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new RangeError('Cannot create a photo cursor with an invalid offset.');
  }

  const payload: PhotoCursorValue = {
    category,
    offset,
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
      typeof value.offset !== 'number' ||
      !Number.isSafeInteger(value.offset) ||
      value.offset < 0
    ) {
      throw new Error('Invalid cursor payload.');
    }

    return value as PhotoCursorValue;
  } catch (error) {
    if (error instanceof RangeError) throw error;
    throw new RangeError('Invalid photo cursor.', {cause: error});
  }
}
