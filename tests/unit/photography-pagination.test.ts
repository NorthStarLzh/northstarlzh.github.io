import {describe, expect, it} from 'vitest';

import {InMemoryPhotoRepository} from '@/content/repositories';
import {createPhoto} from '@fixtures/domain';

describe('photography list ordering and cursor pagination', () => {
  it('orders featured first by featured order, then other work by month and stable id', async () => {
    const repository = new InMemoryPhotoRepository([
      createPhoto('same-b', ['landscape'], {shotAt: '2025-04'}),
      createPhoto('featured-two', ['landscape'], {
        featured: true,
        featuredOrder: 2,
        shotAt: '2020-01',
      }),
      createPhoto('newest', ['landscape'], {shotAt: '2026-01'}),
      createPhoto('featured-one', ['landscape'], {
        featured: true,
        featuredOrder: 1,
        shotAt: '2019-01',
      }),
      createPhoto('same-a', ['landscape'], {shotAt: '2025-04'}),
    ]);

    const result = await repository.listPage({category: 'landscape', limit: 20});
    expect(result.items.map(({id}) => id)).toEqual([
      'featured-one',
      'featured-two',
      'newest',
      'same-a',
      'same-b',
    ]);
  });

  it('rejects a malformed or out-of-range cursor instead of returning a shifted page', async () => {
    const repository = new InMemoryPhotoRepository([
      createPhoto('one', ['portrait']),
    ]);
    await expect(repository.listPage({
      category: 'portrait',
      cursor: 'tampered-cursor',
      limit: 20,
    })).rejects.toThrow(RangeError);
  });
});
