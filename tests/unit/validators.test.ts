import { describe, expect, it } from 'vitest';

import {
  hasValidImageDimensions,
  hasValidPhotoCategories,
  hasValidResearchImageCount,
  isNonEmptyLocalizedText,
  isValidEmail,
  isValidYearMonth,
} from '@/content/contracts';
import { createImageAsset } from '@fixtures/domain';

describe('isNonEmptyLocalizedText', () => {
  it.each([
    { zh: '中文', en: 'English' },
    { zh: ' 中 ', en: ' E ' },
  ])('accepts complete bilingual text', (value) => {
    expect(isNonEmptyLocalizedText(value)).toBe(true);
  });

  it.each([
    null,
    undefined,
    '',
    {},
    { zh: '', en: 'English' },
    { zh: '中文', en: '   ' },
    { zh: '中文' },
    { zh: 1, en: 'English' },
  ])('rejects empty or incomplete value %#', (value) => {
    expect(isNonEmptyLocalizedText(value)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it.each(['a@b.co', 'portfolio-owner@example.com'])('accepts valid email %s', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each([
    '',
    'plain-address',
    '@example.com',
    'a@',
    'a b@example.com',
    'a@example',
    null,
    undefined,
    `${'a'.repeat(245)}@example.com`,
  ])('rejects invalid or empty email %#', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('isValidYearMonth', () => {
  it.each(['0000-01', '2025-12', '9999-06'])('accepts a valid boundary %s', (value) => {
    expect(isValidYearMonth(value)).toBe(true);
  });

  it.each([
    '',
    '2025-00',
    '2025-13',
    '2025-1',
    '25-01',
    '2025/01',
    ' 2025-01',
    null,
    undefined,
  ])('rejects an invalid or empty month %#', (value) => {
    expect(isValidYearMonth(value)).toBe(false);
  });
});

describe('hasValidImageDimensions', () => {
  it.each([
    { width: Number.MIN_VALUE, height: Number.MIN_VALUE, aspectRatio: 1 },
    { width: 1, height: 1, aspectRatio: 1 },
    { width: 6000, height: 4000, aspectRatio: 1.5 },
  ])('accepts positive finite dimensions', (value) => {
    expect(hasValidImageDimensions(value)).toBe(true);
  });

  it.each([
    null,
    {},
    { width: 0, height: 1, aspectRatio: 1 },
    { width: -1, height: 1, aspectRatio: 1 },
    { width: 1, height: 0, aspectRatio: 1 },
    { width: 1, height: 1, aspectRatio: 0 },
    { width: Number.POSITIVE_INFINITY, height: 1, aspectRatio: 1 },
    { width: 1, height: Number.NaN, aspectRatio: 1 },
    { width: '1', height: 1, aspectRatio: 1 },
  ])('rejects non-positive, non-finite, or empty dimensions %#', (value) => {
    expect(hasValidImageDimensions(value)).toBe(false);
  });
});

describe('hasValidPhotoCategories', () => {
  it.each([
    {categories: []},
    {categories: ['landscape']},
    {categories: ['portrait']},
    {categories: ['landscape', 'portrait']},
  ])(
    'accepts empty or supported, unique categories %#',
    ({ categories }) => {
      expect(hasValidPhotoCategories(categories)).toBe(true);
    },
  );

  it.each([
    ['unknown'],
    ['landscape', 'unknown'],
    ['landscape', 'landscape'],
    null,
    undefined,
    '',
  ])('rejects unknown, duplicate, or non-array categories %#', (value) => {
    expect(hasValidPhotoCategories(value)).toBe(false);
  });
});

describe('hasValidResearchImageCount', () => {
  const image = createImageAsset('fixture');

  it.each([
    { images: [image] },
    { images: [image, image] },
    { images: [image, image, image] },
  ])(
    'accepts one through three images',
    ({ images }) => {
      expect(hasValidResearchImageCount(images)).toBe(true);
    },
  );

  it.each([[], [image, image, image, image], null, undefined, ''])
    ('rejects counts outside one through three and empty values %#', (value) => {
      expect(hasValidResearchImageCount(value)).toBe(false);
    });
});
