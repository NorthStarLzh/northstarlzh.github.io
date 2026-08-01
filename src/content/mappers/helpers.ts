import type {ImageAsset, LocalizedText} from '../contracts';
import {isNonEmptyLocalizedText} from '../contracts';
import {InvalidContentError} from './errors';

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown, type: string, id?: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidContentError(type, `${type} must be an object.`, id, `${type}.object_required`);
  }
  return value as UnknownRecord;
}

export function optionalDocumentId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const id = (value as UnknownRecord)._id;
  return typeof id === 'string' && id.trim() ? id.trim() : undefined;
}

export function requiredString(
  value: unknown,
  field: string,
  type: string,
  id?: string,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidContentError(type, `${field} must be a non-empty string.`, id, `${field}.string_required`);
  }
  return value.trim();
}

export function requiredId(value: unknown, type: string, id?: string): string {
  return requiredString(value, '_id', type, id);
}

export function localizedText(
  value: unknown,
  field: string,
  type: string,
  id?: string,
): LocalizedText {
  if (!isNonEmptyLocalizedText(value)) {
    throw new InvalidContentError(
      type,
      `${field} must contain non-empty zh and en values.`,
      id,
      `${field}.zh_en_required`,
    );
  }
  return {zh: value.zh.trim(), en: value.en.trim()};
}

export function nonNegativeInteger(
  value: unknown,
  field: string,
  type: string,
  id?: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new InvalidContentError(
      type,
      `${field} must be a non-negative integer.`,
      id,
      `${field}.non_negative_integer_required`,
    );
  }
  return value;
}

export function mapImageAsset(
  value: unknown,
  type: string,
  documentId?: string,
  altOverride?: LocalizedText,
): ImageAsset {
  const image = asRecord(value, type, documentId);
  const id = requiredString(image.id, 'image.id', type, documentId);
  const width = image.width;
  const height = image.height;
  if (
    typeof width !== 'number' || !Number.isFinite(width) || width <= 0 ||
    typeof height !== 'number' || !Number.isFinite(height) || height <= 0
  ) {
    throw new InvalidContentError(
      type,
      'Image dimensions must be positive numbers.',
      documentId,
      'image.dimensions_required',
    );
  }
  const alt = altOverride ?? localizedText(image.alt, 'image.alt', type, documentId);
  const blurDataUrl = typeof image.blurDataUrl === 'string' && image.blurDataUrl.trim()
    ? image.blurDataUrl.trim()
    : undefined;

  return {
    id,
    width,
    height,
    aspectRatio: width / height,
    alt,
    ...(blurDataUrl ? {blurDataUrl} : {}),
  };
}

export function mapValidDocuments<T>(
  values: unknown,
  mapper: (value: unknown) => T,
  onInvalid: (error: unknown) => void,
): T[] {
  if (!Array.isArray(values)) return [];
  const result: T[] = [];
  for (const value of values) {
    try {
      result.push(mapper(value));
    } catch (error) {
      onInvalid(error);
    }
  }
  return result;
}
