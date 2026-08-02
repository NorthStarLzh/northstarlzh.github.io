import {describe, expect, it} from 'vitest';

import {
  buildBatchPhotoDocument,
  computeNextFeaturedOrder,
  hasReachedFeaturedLimit,
  isSupportedImageFile,
  MAX_FEATURED_PHOTOS,
  sanitizeShotAt,
} from '../../sanity/components/batch-photo';

const validShotAt = '2026-07';

describe('buildBatchPhotoDocument', () => {
  it('creates a minimal photo with only the image when no defaults are given', () => {
    expect(buildBatchPhotoDocument('image-abc')).toEqual({
      _type: 'photo',
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: 'image-abc'},
        hotspot: {_type: 'sanity.imageHotspot', x: 0.5, y: 0.5, width: 1, height: 1},
      },
    });
  });

  it('applies optional category, shotAt, and city defaults', () => {
    const document = buildBatchPhotoDocument('image-abc', {
      category: 'landscape',
      shotAt: validShotAt,
      city: '杭州',
    });
    expect(document).toMatchObject({
      categories: ['landscape'],
      shotAt: validShotAt,
      city: {_type: 'localizedShortText', zh: '杭州', en: '杭州'},
    });
  });

  it('omits blank or malformed optional defaults', () => {
    const document = buildBatchPhotoDocument('image-abc', {
      category: undefined,
      shotAt: 'not-a-date',
      city: '   ',
    });
    expect(document).not.toHaveProperty('categories');
    expect(document).not.toHaveProperty('shotAt');
    expect(document).not.toHaveProperty('city');
  });
});

describe('sanitizeShotAt', () => {
  it('accepts YYYY-MM and trims whitespace', () => {
    expect(sanitizeShotAt(`  ${validShotAt}  `)).toBe(validShotAt);
    expect(sanitizeShotAt('2025-12')).toBe('2025-12');
  });

  it('rejects blank and malformed values', () => {
    expect(sanitizeShotAt('')).toBeUndefined();
    expect(sanitizeShotAt('   ')).toBeUndefined();
    expect(sanitizeShotAt('2026-13')).toBeUndefined();
    expect(sanitizeShotAt('2026')).toBeUndefined();
    expect(sanitizeShotAt(undefined)).toBeUndefined();
  });
});

describe('isSupportedImageFile', () => {
  it('accepts image files and rejects others', () => {
    expect(isSupportedImageFile({type: 'image/jpeg'} as File)).toBe(true);
    expect(isSupportedImageFile({type: 'image/png'} as File)).toBe(true);
    expect(isSupportedImageFile({type: 'application/pdf'} as File)).toBe(false);
    expect(isSupportedImageFile({type: ''} as File)).toBe(false);
  });
});

describe('featured photo helpers', () => {
  it('assigns the next free non-negative featured order', () => {
    expect(computeNextFeaturedOrder([])).toBe(0);
    expect(computeNextFeaturedOrder([0])).toBe(1);
    expect(computeNextFeaturedOrder([0, 1, 2])).toBe(3);
    expect(computeNextFeaturedOrder([0, 5])).toBe(6);
    expect(computeNextFeaturedOrder([-1, 2.5, 1])).toBe(2);
  });

  it('tracks the homepage featured limit', () => {
    expect(MAX_FEATURED_PHOTOS).toBe(5);
    expect(hasReachedFeaturedLimit(4)).toBe(false);
    expect(hasReachedFeaturedLimit(5)).toBe(true);
    expect(hasReachedFeaturedLimit(6)).toBe(true);
  });
});
