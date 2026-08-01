import {describe, expect, it} from 'vitest';

import {
  buildPhotographyCategoryUrl,
  parsePhotoCategory,
} from '@/features/photography';

describe('photography category URL state', () => {
  it.each([
    ['landscape', 'landscape'],
    ['portrait', 'portrait'],
  ] as const)('keeps the supported category %s', (input, expected) => {
    expect(parsePhotoCategory(input)).toBe(expected);
  });

  it.each([undefined, null, '', 'people', ['portrait']])(
    'falls back to landscape for %j',
    (input) => {
      expect(parsePhotoCategory(input)).toBe('landscape');
    },
  );

  it('replaces only category while preserving unrelated query state and the gallery anchor', () => {
    expect(
      buildPhotographyCategoryUrl(
        '/zh/photography',
        'view=compact&category=landscape',
        'portrait',
      ),
    ).toBe('/zh/photography?view=compact&category=portrait#gallery');
  });
});
