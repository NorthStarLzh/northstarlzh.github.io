import {describe, expect, it, vi} from 'vitest';

import type {PhotoRepository} from '@/content/contracts';
import {createGetPhotosHandler} from '@/features/photography';
import {landscapePhotoFixture} from '@fixtures/domain';

function repository(
  listPage: PhotoRepository['listPage'],
): PhotoRepository {
  return {
    getHeroPhoto: vi.fn(),
    listFeatured: vi.fn(),
    listPage,
  };
}

describe('GET /api/photos', () => {
  it('returns one stable JSON page with the fixed batch size', async () => {
    const listPage = vi.fn().mockResolvedValue({
      items: [landscapePhotoFixture],
      nextCursor: 'opaque-next',
      hasMore: true,
    });
    const GET = createGetPhotosHandler(repository(listPage));

    const response = await GET(new Request(
      'https://portfolio.test/api/photos?category=landscape&locale=zh&cursor=opaque-prior',
    ));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [landscapePhotoFixture],
      nextCursor: 'opaque-next',
      hasMore: true,
    });
    expect(listPage).toHaveBeenCalledWith({
      category: 'landscape',
      cursor: 'opaque-prior',
      limit: 20,
    });
  });

  it.each([
    'https://portfolio.test/api/photos?locale=zh',
    'https://portfolio.test/api/photos?category=people&locale=zh',
    'https://portfolio.test/api/photos?category=portrait',
    'https://portfolio.test/api/photos?category=portrait&locale=fr',
    'https://portfolio.test/api/photos?category=portrait&locale=en&cursor=',
  ])('rejects invalid parameters without querying content: %s', async (url) => {
    const listPage = vi.fn();
    const response = await createGetPhotosHandler(repository(listPage))(
      new Request(url),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid photography pagination request.',
      },
    });
    expect(listPage).not.toHaveBeenCalled();
  });

  it('rejects an invalid or replayed cursor as a client error', async () => {
    const listPage = vi.fn().mockRejectedValue(new RangeError('Invalid photo cursor.'));
    const response = await createGetPhotosHandler(repository(listPage))(
      new Request(
        'https://portfolio.test/api/photos?category=landscape&locale=en&cursor=tampered',
      ),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('INVALID_CURSOR');
  });

  it('does not expose content-service failures', async () => {
    const listPage = vi.fn().mockRejectedValue(new Error('private CMS detail'));
    const response = await createGetPhotosHandler(repository(listPage))(
      new Request(
        'https://portfolio.test/api/photos?category=portrait&locale=en',
      ),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        code: 'CONTENT_UNAVAILABLE',
        message: 'Photography content is temporarily unavailable.',
      },
    });
  });

  it('returns the same error envelope when an abnormal request rate is rejected', async () => {
    const listPage = vi.fn();
    const GET = createGetPhotosHandler(repository(listPage), () => false);
    const response = await GET(new Request(
      'https://portfolio.test/api/photos?category=landscape&locale=zh',
    ));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many photography pagination requests.',
      },
    });
    expect(listPage).not.toHaveBeenCalled();
  });
});
