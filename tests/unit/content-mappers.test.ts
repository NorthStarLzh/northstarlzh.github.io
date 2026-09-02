import {describe, expect, it} from 'vitest';

import {
  InvalidContentError,
  mapAward,
  mapEducation,
  mapPhoto,
  mapProfile,
  mapResearchProject,
} from '@/content/mappers';

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

function rawPhoto(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'photo-1',
    image: rawImage(),
    categories: ['landscape'],
    shotAt: '2026-07',
    city: bilingual('杭州', 'Hangzhou'),
    description: bilingual('照片介绍', 'Photo description'),
    featured: true,
    featuredOrder: 1,
    displayOrder: 10,
    ...overrides,
  };
}

function rawResearch(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'research-1',
    title: bilingual('项目', 'Project'),
    period: '2025–2026',
    summary: bilingual('摘要', 'Summary'),
    images: [rawImage('research-image-1')],
    papers: [{_key: 'paper-1', title: bilingual('论文', 'Paper')}],
    noPublishedPapers: false,
    featured: true,
    featuredOrder: 1,
    ...overrides,
  };
}

describe('profile and resume mappers', () => {
  it('maps the singleton profile and computes avatar dimensions', () => {
    const profile = mapProfile({
      _id: 'profile',
      nickname: '风花诗酒茶',
      avatar: rawImage('avatar'),
      bio: bilingual('简介', 'Biography'),
      institution: 'Zhejiang University',
      role: bilingual('摄影师', 'Photographer'),
      email: 'Northstar_lzh@zju.edu.cn',
      heroPhotoId: 'photo-1',
      resumeUrl: 'https://cdn.sanity.io/files/project/development/resume.pdf',
    });

    expect(profile).toMatchObject({
      nickname: '风花诗酒茶',
      heroPhotoId: 'photo-1',
      avatar: {
        id: 'avatar',
        aspectRatio: 1.6,
        alt: {zh: '风花诗酒茶的头像', en: 'Portrait of 风花诗酒茶'},
      },
    });
  });

  it('allows a missing optional resume but rejects unsafe file URLs and invalid email', () => {
    const base = {
      _id: 'profile',
      nickname: 'Portfolio',
      avatar: rawImage('avatar'),
      bio: bilingual(),
      institution: 'University',
      role: bilingual(),
      email: 'owner@example.com',
      heroPhotoId: '',
    };
    expect(mapProfile(base).resumeUrl).toBe('');
    expect(() => mapProfile({...base, resumeUrl: 'https://example.com/resume.pdf'}))
      .toThrow(InvalidContentError);
    expect(() => mapProfile({...base, email: 'not-an-email'}))
      .toThrow(InvalidContentError);
  });

  it('maps ordered education and optional award descriptions', () => {
    expect(mapEducation({
      _id: 'education-1',
      institution: bilingual(),
      description: bilingual(),
      period: '2022–2026',
      order: 0,
    })).toMatchObject({id: 'education-1', order: 0});
    expect(mapAward({
      _id: 'award-1',
      title: bilingual(),
      date: '2026-07',
      order: 1,
    })).not.toHaveProperty('description');
  });

  it.each(['2026-00', '26', '2026-13', 'July 2026'])
    ('rejects an invalid award date %s', (date) => {
      expect(() => mapAward({
        _id: 'award-1',
        title: bilingual(),
        date,
        order: 0,
      })).toThrow(InvalidContentError);
    });
});

describe('photo mapper', () => {
  it('maps rendering fields and computes the source aspect ratio', () => {
    expect(mapPhoto(rawPhoto())).toEqual({
      id: 'photo-1',
      image: {
        id: 'image-1',
        width: 1600,
        height: 1000,
        aspectRatio: 1.6,
        blurDataUrl: 'data:image/jpeg;base64,fixture',
        alt: bilingual('替代文本', 'Alternative text'),
      },
      categories: ['landscape'],
      displayOrder: 10,
      shotAt: '2026-07',
      city: bilingual('杭州', 'Hangzhou'),
      description: bilingual('照片介绍', 'Photo description'),
      featured: true,
      featuredOrder: 1,
    });
  });

  it.each([
    {categories: ['unknown']},
    {categories: ['landscape', 'landscape']},
    {displayOrder: -1},
    {displayOrder: 1.5},
    {shotAt: '2026-13'},
    {image: {...rawImage(), width: 0}},
  ])('rejects malformed photo data %#', (overrides) => {
    expect(() => mapPhoto(rawPhoto(overrides))).toThrow(InvalidContentError);
  });

  it('maps a photo whose metadata is all optional as empty values', () => {
    const mapped = mapPhoto(rawPhoto({categories: [], shotAt: '', city: undefined, description: undefined}));
    expect(mapped.categories).toEqual([]);
    expect(mapped).not.toHaveProperty('shotAt');
    expect(mapped).not.toHaveProperty('city');
    expect(mapped).not.toHaveProperty('description');
    expect(mapped.image.alt).toEqual(bilingual('替代文本', 'Alternative text'));
  });

  it('falls back to a neutral alt when the photo alt is missing or partial', () => {
    const missing = mapPhoto(rawPhoto({image: {...rawImage(), alt: undefined}}));
    expect(missing.image.alt).toEqual(bilingual('摄影作品', 'Photograph'));

    const partial = mapPhoto(rawPhoto({image: {...rawImage(), alt: {zh: '', en: 'English'}}}));
    expect(partial.image.alt).toEqual(bilingual('摄影作品', 'Photograph'));
  });

  it('does not require featuredOrder for a non-featured photo', () => {
    const mapped = mapPhoto(rawPhoto({featured: false, featuredOrder: undefined}));
    expect(mapped.featured).toBe(false);
    expect(mapped).not.toHaveProperty('featuredOrder');
  });

  it('identifies a missing English photo description with a stable validation code', () => {
    expect(() => mapPhoto(rawPhoto({
      description: {zh: '多年后在竹林里的重逢'},
    }))).toThrow(expect.objectContaining({
      name: 'InvalidContentError',
      validationCode: 'description.zh_en_required',
    }));
  });
});

describe('research mapper', () => {
  it.each([1, 2, 3])('accepts exactly %i project images', (count) => {
    const images = Array.from({length: count}, (_, index) => rawImage(`image-${index}`));
    expect(mapResearchProject(rawResearch({images})).images).toHaveLength(count);
  });

  it.each([0, 4])('rejects %i project images', (count) => {
    const images = Array.from({length: count}, (_, index) => rawImage(`image-${index}`));
    expect(() => mapResearchProject(rawResearch({images}))).toThrow(InvalidContentError);
  });

  it('requires paper titles unless the explicit no-results marker is set', () => {
    expect(() => mapResearchProject(rawResearch({papers: []})))
      .toThrow(InvalidContentError);
    expect(mapResearchProject(rawResearch({papers: [], noPublishedPapers: true})).papers)
      .toEqual([]);
    expect(() => mapResearchProject(rawResearch({
      papers: [{_key: 'paper-1', title: {zh: '', en: 'Paper'}}],
    }))).toThrow(InvalidContentError);
  });
});
