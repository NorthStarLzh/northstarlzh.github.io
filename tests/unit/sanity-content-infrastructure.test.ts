import {describe, expect, it} from 'vitest';
import {parse} from 'groq-js';

import {
  ALL_RESEARCH_QUERY,
  AWARDS_QUERY,
  CONTENT_CACHE_TAGS,
  CONTENT_REVALIDATE_SECONDS,
  EDUCATION_QUERY,
  FEATURED_PHOTOS_QUERY,
  FEATURED_RESEARCH_QUERY,
  HERO_PHOTO_QUERY,
  PHOTO_PAGE_QUERY,
  PROFILE_QUERY,
  RESEARCH_BY_ID_QUERY,
  SanityConfigurationError,
  contentFetchOptions,
  createPhotoPageQuery,
  createSanityReadClient,
  decodePhotoCursor,
  encodePhotoCursor,
  resolveSanityReadConfiguration,
} from '@/content/sanity';

describe('read-only Sanity client factory', () => {
  it('uses the explicitly configured development dataset and published CDN reads', () => {
    expect(resolveSanityReadConfiguration({
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'portfolio-test',
      NEXT_PUBLIC_SANITY_DATASET: 'development',
      NEXT_PUBLIC_SANITY_API_VERSION: '2026-07-28',
      SANITY_READ_TOKEN: 'must-not-be-read',
    })).toEqual({
      projectId: 'portfolio-test',
      dataset: 'development',
      apiVersion: '2026-07-28',
      useCdn: true,
      perspective: 'published',
      stega: false,
    });
  });

  it('fails explicitly instead of querying a placeholder project or dataset', () => {
    expect(() => resolveSanityReadConfiguration({})).toThrow(SanityConfigurationError);
    expect(() => resolveSanityReadConfiguration({
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'project',
    })).toThrow(SanityConfigurationError);
  });

  it('returns a fetch-only facade and never exposes mutation methods or a token', () => {
    const client = createSanityReadClient({
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'portfolio-test',
      NEXT_PUBLIC_SANITY_DATASET: 'development',
      SANITY_READ_TOKEN: 'write-capable-secret',
    });

    expect(Object.keys(client)).toEqual(['fetch']);
    expect(client).not.toHaveProperty('mutate');
    expect(client).not.toHaveProperty('token');
  });
});

describe('cache policy', () => {
  it('uses a 60 second fallback and de-duplicates all public content tags', () => {
    expect(CONTENT_REVALIDATE_SECONDS).toBe(60);
    expect(Object.values(CONTENT_CACHE_TAGS).sort()).toEqual([
      'awards',
      'education',
      'home',
      'photos',
      'profile',
      'research',
      'resume',
    ]);
    expect(contentFetchOptions(
      CONTENT_CACHE_TAGS.photos,
      CONTENT_CACHE_TAGS.home,
      CONTENT_CACHE_TAGS.photos,
    )).toEqual({
      cache: 'force-cache',
      next: {revalidate: 60, tags: ['photos', 'home']},
    });
  });
});

describe('GROQ query contracts', () => {
  it('provides every M04 read query without mutation or draft syntax', () => {
    const queries = [
      PROFILE_QUERY,
      EDUCATION_QUERY,
      AWARDS_QUERY,
      HERO_PHOTO_QUERY,
      FEATURED_PHOTOS_QUERY,
      PHOTO_PAGE_QUERY,
      FEATURED_RESEARCH_QUERY,
      ALL_RESEARCH_QUERY,
      RESEARCH_BY_ID_QUERY,
    ];
    expect(queries).toHaveLength(9);
    for (const query of queries) {
      expect(() => parse(query)).not.toThrow();
      expect(query).toContain('*[');
      expect(query).not.toMatch(/\b(create|delete|mutate|patch)\b/i);
      expect(query).not.toContain('drafts.');
    }
  });

  it('limits home selections and applies stable tie breakers', () => {
    expect(FEATURED_PHOTOS_QUERY).toContain('[0...5]');
    expect(FEATURED_PHOTOS_QUERY).toContain('"image": image{');
    expect(FEATURED_PHOTOS_QUERY).toContain('featuredOrder asc, shotAt desc, _id asc');
    expect(FEATURED_RESEARCH_QUERY).toContain('[0...3]');
    expect(FEATURED_RESEARCH_QUERY).toContain('featuredOrder asc, period desc, _id asc');
    expect(EDUCATION_QUERY).toContain('order(order asc, _id asc)');
    expect(AWARDS_QUERY).toContain('order(order asc, _id asc)');
  });

  it('parameterizes category, cursor, limit and document id values', () => {
    expect(PHOTO_PAGE_QUERY).toContain('$category in categories');
    expect(createPhotoPageQuery(2)).toContain('[0...2]');
    expect(createPhotoPageQuery(21)).toContain('[0...21]');
    expect(() => createPhotoPageQuery(22)).toThrow(RangeError);
    expect(PHOTO_PAGE_QUERY).toContain('$cursorId');
    expect(RESEARCH_BY_ID_QUERY).toContain('_id == $id');
  });

  it('projects only mapped profile fields and not internal metadata', () => {
    expect(PROFILE_QUERY).toContain('"heroPhotoId": heroPhoto->_id');
    expect(PROFILE_QUERY).toContain('"resumeUrl": resume.asset->url');
    expect(PROFILE_QUERY).not.toContain('_updatedAt');
    expect(PROFILE_QUERY).not.toContain('_rev');
  });
});

describe('opaque photo cursor', () => {
  it('round-trips the complete stable sort boundary', () => {
    const cursor = encodePhotoCursor('landscape', {
      _id: 'photo-10',
      featured: true,
      featuredOrder: 2,
      shotAt: '2026-06',
    });
    expect(cursor).not.toContain('photo-10');
    expect(decodePhotoCursor(cursor, 'landscape')).toEqual({
      category: 'landscape',
      featured: true,
      featuredOrder: 2,
      shotAt: '2026-06',
      id: 'photo-10',
    });
  });

  it.each(['plain-text', 'photo-v1.not-base64', 'photo-v1.e30'])
    ('rejects malformed cursor %s', (cursor) => {
      expect(() => decodePhotoCursor(cursor, 'landscape')).toThrow(RangeError);
    });

  it('rejects a cursor replayed under another category', () => {
    const cursor = encodePhotoCursor('portrait', {
      _id: 'photo-1',
      featured: false,
      shotAt: '2026-01',
    });
    expect(() => decodePhotoCursor(cursor, 'landscape')).toThrow(RangeError);
  });
});
