import {describe, expect, it} from 'vitest';

import type {PhotoPageInput} from '@/content/contracts';
import {
  ContentServiceError,
  HeroPhotoUnavailableError,
  ProfileContentError,
  type ContentLogger,
  type InvalidDocumentLog,
} from '@/content/mappers';
import {
  MAX_PHOTO_PAGE_SIZE,
  SanityPhotoCollectionRepository,
  SanityPhotoRepository,
  SanityProfileRepository,
  SanityResearchRepository,
} from '@/content/repositories';
import {
  CONTENT_CACHE_TAGS,
  decodePhotoCursor,
  encodePhotoCursor,
  type SanityFetchOptions,
  type SanityQueryClient,
} from '@/content/sanity';

const bilingual = (zh = '中文', en = 'English') => ({zh, en});

function rawImage(id = 'image-1') {
  return {
    id,
    width: 1600,
    height: 1000,
    blurDataUrl: 'data:image/jpeg;base64,fixture',
    alt: bilingual('替代文本', 'Alternative text'),
  };
}

function rawProfile(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'profile',
    nickname: '风花诗酒茶',
    avatar: rawImage('avatar'),
    bio: bilingual('简介', 'Biography'),
    institution: 'Zhejiang University',
    role: bilingual('摄影师', 'Photographer'),
    email: 'Northstar_lzh@zju.edu.cn',
    heroPhotoId: 'photo-1',
    resumeUrl: 'https://cdn.sanity.io/files/project/development/resume.pdf',
    ...overrides,
  };
}

function rawPhoto(id: string, overrides: Record<string, unknown> = {}) {
  return {
    _id: id,
    image: rawImage(`image-${id}`),
    categories: ['landscape'],
    shotAt: '2026-07',
    city: bilingual('杭州', 'Hangzhou'),
    description: bilingual('照片', 'Photo'),
    featured: false,
    featuredOrder: undefined,
    ...overrides,
  };
}

function rawResearch(id: string, overrides: Record<string, unknown> = {}) {
  return {
    _id: id,
    title: bilingual('项目', 'Project'),
    period: '2025–2026',
    summary: bilingual('摘要', 'Summary'),
    images: [rawImage(`${id}-image-1`)],
    papers: [{_key: `${id}-paper-1`, title: bilingual('论文', 'Paper')}],
    noPublishedPapers: false,
    featured: false,
    featuredOrder: undefined,
    ...overrides,
  };
}

function rawPhotoCollection(id: string, overrides: Record<string, unknown> = {}) {
  return {
    _id: id,
    title: bilingual('合集', 'Collection'),
    description: bilingual('简介', 'Description'),
    slug: 'zhejiang-university',
    cover: {...rawImage('cover'), alt: bilingual('封面', 'Cover')},
    photos: [rawPhoto('photo-1'), rawPhoto('photo-2')],
    sortOrder: 1,
    ...overrides,
  };
}

interface FetchCall {
  query: string;
  params: Record<string, unknown>;
  options: SanityFetchOptions;
}

class QueueClient implements SanityQueryClient {
  readonly calls: FetchCall[] = [];

  constructor(private readonly responses: unknown[]) {}

  async fetch<T>(
    query: string,
    params: Record<string, unknown>,
    options: SanityFetchOptions,
  ): Promise<T> {
    this.calls.push({query, params, options});
    if (this.responses.length === 0) throw new Error('Unexpected query.');
    const response = this.responses.shift();
    if (response instanceof Error) throw response;
    return response as T;
  }
}

function collectingLogger(): {logger: ContentLogger; entries: InvalidDocumentLog[]} {
  const entries: InvalidDocumentLog[] = [];
  return {
    entries,
    logger: {invalidDocument: (entry) => entries.push(entry)},
  };
}

describe('SanityProfileRepository', () => {
  it('maps the required profile with its isolated cache tag', async () => {
    const client = new QueueClient([rawProfile()]);
    const repository = new SanityProfileRepository(client);

    await expect(repository.getProfile()).resolves.toMatchObject({
      nickname: '风花诗酒茶',
      email: 'Northstar_lzh@zju.edu.cn',
    });
    expect(client.calls[0].params).toEqual({});
    expect(client.calls[0].options).toEqual({
      cache: 'force-cache',
      next: {revalidate: 60, tags: [CONTENT_CACHE_TAGS.profile]},
    });
  });

  it('throws an explicit profile error for missing or invalid singleton content', async () => {
    await expect(new SanityProfileRepository(new QueueClient([null])).getProfile())
      .rejects.toBeInstanceOf(ProfileContentError);

    const {logger, entries} = collectingLogger();
    await expect(new SanityProfileRepository(
      new QueueClient([rawProfile({email: 'invalid'})]),
      logger,
    ).getProfile()).rejects.toBeInstanceOf(ProfileContentError);
    expect(entries).toEqual([expect.objectContaining({
      module: 'profile',
      documentId: 'profile',
    })]);
  });

  it('records and excludes an invalid ordinary education document', async () => {
    const client = new QueueClient([[
      {
        _id: 'education-good',
        institution: bilingual(),
        description: bilingual(),
        period: '2022–2026',
        order: 1,
      },
      {
        _id: 'education-bad',
        institution: bilingual('', 'English'),
        description: bilingual(),
        period: '2022–2026',
        order: 2,
      },
    ]]);
    const {logger, entries} = collectingLogger();
    const repository = new SanityProfileRepository(client, logger);

    await expect(repository.listEducation()).resolves.toEqual([
      expect.objectContaining({id: 'education-good'}),
    ]);
    expect(entries).toEqual([expect.objectContaining({
      module: 'education',
      documentType: 'education',
      documentId: 'education-bad',
      errorCategory: 'validation',
    })]);
    expect(client.calls[0].options.next.tags).toEqual(['education', 'resume']);
  });

  it('wraps an uncached CMS failure in a safe module error', async () => {
    const client = new QueueClient([new Error('secret upstream detail')]);
    const repository = new SanityProfileRepository(client);

    await expect(repository.listAwards()).rejects.toMatchObject({
      name: 'ContentServiceError',
      message: 'The content service is temporarily unavailable.',
      module: 'awards',
    });
    expect(client.calls[0].options.next).toEqual({
      revalidate: 60,
      tags: ['awards', 'resume'],
    });
  });
});

describe('SanityPhotoRepository', () => {
  it('returns a valid configured hero without querying the fallback', async () => {
    const client = new QueueClient([rawPhoto('hero')]);
    await expect(new SanityPhotoRepository(client).getHeroPhoto())
      .resolves.toMatchObject({id: 'hero'});
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].options.next.tags).toEqual(['photos', 'home']);
  });

  it('uses the first valid featured photo when the configured hero is missing or invalid', async () => {
    const client = new QueueClient([
      rawPhoto('broken-hero', {shotAt: 'invalid'}),
      [
        rawPhoto('broken-featured', {featured: true, featuredOrder: 0, categories: ['unknown']}),
        rawPhoto('featured-fallback', {featured: true, featuredOrder: 1}),
      ],
    ]);
    const {logger, entries} = collectingLogger();

    await expect(new SanityPhotoRepository(client, logger).getHeroPhoto())
      .resolves.toMatchObject({id: 'featured-fallback'});
    expect(client.calls).toHaveLength(2);
    expect(client.calls[1].params).toEqual({limit: 5});
    expect(entries.map(({documentId}) => documentId)).toEqual([
      'broken-hero',
      'broken-featured',
    ]);
  });

  it('fails explicitly when neither hero nor a featured fallback is usable', async () => {
    const repository = new SanityPhotoRepository(new QueueClient([null, []]));
    await expect(repository.getHeroPhoto()).rejects.toBeInstanceOf(HeroPhotoUnavailableError);
  });

  it('limits and maps the five featured photos', async () => {
    const raw = Array.from({length: 6}, (_, index) => rawPhoto(`photo-${index}`, {
      featured: true,
      featuredOrder: index,
    }));
    const client = new QueueClient([raw]);
    const result = await new SanityPhotoRepository(client).listFeatured(5);
    expect(result).toHaveLength(5);
    expect(client.calls[0].params).toEqual({limit: 5});
  });

  it('builds stable page parameters, excludes bad documents, and advances past them', async () => {
    const client = new QueueClient([[
      rawPhoto('photo-good', {featured: true, featuredOrder: 1, shotAt: '2026-07'}),
      rawPhoto('photo-bad', {featured: true, featuredOrder: 2, shotAt: 'bad'}),
      rawPhoto('photo-extra', {shotAt: '2026-06'}),
    ]]);
    const {logger, entries} = collectingLogger();
    const result = await new SanityPhotoRepository(client, logger).listPage({
      category: 'landscape',
      limit: 2,
    });

    expect(result.items.map(({id}) => id)).toEqual(['photo-good']);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
    expect(decodePhotoCursor(result.nextCursor ?? '', 'landscape')).toMatchObject({
      id: 'photo-bad',
      featured: true,
      featuredOrder: 2,
      shotAt: 'bad',
    });
    expect(client.calls[0].params).toEqual({
      category: 'landscape',
      hasCursor: false,
      cursorFeatured: false,
      cursorFeaturedOrder: 2_147_483_647,
      cursorShotAt: '',
      cursorId: '',
    });
    expect(client.calls[0].options.next.tags).toEqual(['photos']);
    expect(entries).toEqual([expect.objectContaining({
      validationCode: 'shotAt.year_month_required',
    })]);
  });

  it('decodes the prior page boundary into the next parameterized query', async () => {
    const cursor = encodePhotoCursor('portrait', {
      _id: 'photo-20',
      featured: false,
      shotAt: '2025-12',
    });
    const client = new QueueClient([[]]);
    const result = await new SanityPhotoRepository(client).listPage({
      category: 'portrait',
      cursor,
      limit: MAX_PHOTO_PAGE_SIZE,
    });

    expect(result).toEqual({items: [], nextCursor: null, hasMore: false});
    expect(client.calls[0].params).toMatchObject({
      hasCursor: true,
      cursorFeatured: false,
      cursorShotAt: '2025-12',
      cursorId: 'photo-20',
    });
  });

  it.each([
    {category: 'landscape', limit: 0},
    {category: 'portrait', limit: MAX_PHOTO_PAGE_SIZE + 1},
    {category: 'unknown', limit: 10},
  ])('rejects unsafe page input %# before querying CMS', async (input) => {
    const client = new QueueClient([]);
    await expect(new SanityPhotoRepository(client).listPage(
      input as PhotoPageInput,
    )).rejects.toBeInstanceOf(RangeError);
    expect(client.calls).toHaveLength(0);
  });

  it('rejects a cursor from another category before querying CMS', async () => {
    const client = new QueueClient([]);
    const cursor = encodePhotoCursor('portrait', {
      _id: 'photo-1',
      featured: false,
      shotAt: '2026-01',
    });
    await expect(new SanityPhotoRepository(client).listPage({
      category: 'landscape',
      cursor,
      limit: 10,
    })).rejects.toBeInstanceOf(RangeError);
    expect(client.calls).toHaveLength(0);
  });
});

describe('SanityResearchRepository', () => {
  it('maps at most three featured projects and uses home invalidation', async () => {
    const client = new QueueClient([[
      rawResearch('research-1', {featured: true, featuredOrder: 1}),
      rawResearch('research-2', {featured: true, featuredOrder: 2}),
      rawResearch('research-3', {featured: true, featuredOrder: 3}),
      rawResearch('research-4', {featured: true, featuredOrder: 4}),
    ]]);
    const result = await new SanityResearchRepository(client).listFeatured(3);
    expect(result.map(({id}) => id)).toEqual(['research-1', 'research-2', 'research-3']);
    expect(client.calls[0].params).toEqual({limit: 3});
    expect(client.calls[0].options.next.tags).toEqual(['research', 'home']);
  });

  it('records and excludes invalid projects from the all-project result', async () => {
    const client = new QueueClient([[
      rawResearch('research-good'),
      rawResearch('research-bad', {images: []}),
    ]]);
    const {logger, entries} = collectingLogger();
    await expect(new SanityResearchRepository(client, logger).listAll())
      .resolves.toEqual([expect.objectContaining({id: 'research-good'})]);
    expect(entries).toEqual([expect.objectContaining({
      module: 'research',
      documentId: 'research-bad',
    })]);
  });

  it('returns null for missing or invalid requested projects', async () => {
    await expect(new SanityResearchRepository(new QueueClient([null])).getById('missing'))
      .resolves.toBeNull();

    const {logger, entries} = collectingLogger();
    await expect(new SanityResearchRepository(
      new QueueClient([rawResearch('bad', {images: []})]),
      logger,
    ).getById('bad')).resolves.toBeNull();
    expect(entries).toHaveLength(1);
  });

  it('parameterizes ids and rejects empty values before the query', async () => {
    const client = new QueueClient([rawResearch('research-1')]);
    await new SanityResearchRepository(client).getById(' research-1 ');
    expect(client.calls[0].params).toEqual({id: 'research-1'});

    const untouchedClient = new QueueClient([]);
    await expect(new SanityResearchRepository(untouchedClient).getById('  '))
      .rejects.toBeInstanceOf(RangeError);
    expect(untouchedClient.calls).toHaveLength(0);
  });

  it('surfaces a safe module error when the CMS has no cached response', async () => {
    const repository = new SanityResearchRepository(
      new QueueClient([new Error('connection refused')]),
    );
    await expect(repository.listAll()).rejects.toMatchObject({
      name: 'ContentServiceError',
      message: 'The content service is temporarily unavailable.',
      module: 'research',
    } satisfies Partial<ContentServiceError>);
  });
});

describe('SanityPhotoCollectionRepository', () => {
  it('maps collections and their photos with the photoCollections cache tag', async () => {
    const client = new QueueClient([
      [
        rawPhotoCollection('collection-1'),
        rawPhotoCollection('collection-2', {slug: 'travel', sortOrder: 2}),
      ],
    ]);
    const repository = new SanityPhotoCollectionRepository(client);

    await expect(repository.listCollections()).resolves.toEqual([
      expect.objectContaining({
        id: 'collection-1',
        slug: 'zhejiang-university',
        cover: expect.objectContaining({id: 'cover'}),
        photos: expect.arrayContaining([
          expect.objectContaining({id: 'photo-1'}),
        ]),
      }),
      expect.objectContaining({id: 'collection-2', slug: 'travel'}),
    ]);
    expect(client.calls[0].options.next.tags).toEqual(['photoCollections']);
  });

  it('parameterizes and trims the slug and returns null for missing collections', async () => {
    const client = new QueueClient([null]);
    const repository = new SanityPhotoCollectionRepository(client);

    await expect(repository.getCollectionBySlug(' travel ')).resolves.toBeNull();
    expect(client.calls[0].params).toEqual({slug: 'travel'});

    const untouchedClient = new QueueClient([]);
    await expect(new SanityPhotoCollectionRepository(untouchedClient).getCollectionBySlug('  '))
      .rejects.toBeInstanceOf(RangeError);
    expect(untouchedClient.calls).toHaveLength(0);
  });

  it('logs and drops collections with no photos while keeping the rest', async () => {
    const {logger, entries} = collectingLogger();
    const client = new QueueClient([
      [
        rawPhotoCollection('collection-good'),
        rawPhotoCollection('collection-empty', {photos: []}),
      ],
    ]);
    const repository = new SanityPhotoCollectionRepository(client, logger);

    await expect(repository.listCollections()).resolves.toEqual([
      expect.objectContaining({id: 'collection-good'}),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      module: 'photoCollections',
      documentType: 'photoCollection',
      documentId: 'collection-empty',
    });
  });
});
