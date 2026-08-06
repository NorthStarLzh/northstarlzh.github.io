import type {
  AwardEntry,
  EducationEntry,
  ImageAsset,
  LocalizedText,
  Photo,
  PhotoCategory,
  PhotoCollection,
  Profile,
  ResearchProject,
} from '../contracts';
import {
  InMemoryPhotoCollectionRepository,
  InMemoryPhotoRepository,
  InMemoryProfileRepository,
  InMemoryResearchRepository,
} from './in-memory';

const E2E_FIXTURE_FLAG = '1';

function localized(zh: string, en: string): LocalizedText {
  return { zh, en };
}

function image(id: string, index = 0): ImageAsset {
  const width = 1200 + (index % 5) * 160;
  const height = 800 + (index % 4) * 140;
  return {
    id: `e2e-${id}`,
    width,
    height,
    aspectRatio: width / height,
    alt: localized(`自动化测试图片 ${id}`, `Automated test image ${id}`),
  };
}

function categoriesForIndex(index: number): PhotoCategory[] {
  if (index % 10 === 0) return ['landscape', 'portrait'];
  return index % 2 === 0 ? ['landscape'] : ['portrait'];
}

function monthForIndex(index: number): string {
  const year = 2025 - Math.floor(index / 12);
  const month = String(12 - (index % 12)).padStart(2, '0');
  return `${year}-${month}`;
}

function createPhotos(): Photo[] {
  return Array.from({ length: 100 }, (_, index) => {
    const sequence = index + 1;
    const id = `fixture-photo-${String(sequence).padStart(3, '0')}`;
    const featured = index < 5;
    return {
      id,
      image: image(id, index),
      categories: categoriesForIndex(index),
      shotAt: monthForIndex(index),
      city: localized(
        `测试城市 ${index % 8}`,
        `Fixture City ${index % 8}`,
      ),
      description: localized(
        `仅用于自动化测试的摄影作品 ${sequence}。`,
        `Photograph ${sequence}, used only by automated tests.`,
      ),
      featured,
      ...(featured ? { featuredOrder: sequence } : {}),
    };
  });
}

const profile: Profile = {
  nickname: '风花诗酒茶 · 自动化测试',
  avatar: image('avatar'),
  bio: localized(
    '此内容仅用于本地自动化测试，不代表真实个人经历。',
    'This content is used only for local automated testing and is not a real biography.',
  ),
  institution: 'Fixture University',
  role: localized('测试摄影师', 'Fixture photographer'),
  email: 'portfolio-owner@example.com',
  heroPhotoId: 'fixture-photo-001',
  resumeUrl: 'http://127.0.0.1:3100/fixture-resume.pdf',
};

const education: EducationEntry[] = [
  {
    id: 'fixture-education-1',
    institution: localized('示例大学', 'Fixture University'),
    description: localized('自动化测试教育经历。', 'Automated test education entry.'),
    period: '2020–2024',
    order: 1,
  },
  {
    id: 'fixture-education-2',
    institution: localized('示例研究院', 'Fixture Institute'),
    description: localized('自动化测试研究经历。', 'Automated test research entry.'),
    period: '2024–2026',
    order: 2,
  },
];

const awards: AwardEntry[] = [
  {
    id: 'fixture-award-1',
    title: localized('自动化测试奖项', 'Automated test award'),
    date: '2025',
    description: localized('非真实奖项。', 'Not a real award.'),
    order: 1,
  },
];

const longSummary = {
  zh: Array.from(
    { length: 18 },
    (_, index) => `第 ${index + 1} 段自动化测试内容，用于验证长文本弹窗可以滚动。`,
  ).join('\n'),
  en: Array.from(
    { length: 18 },
    (_, index) => `Automated test paragraph ${index + 1} verifies that long dialog content remains scrollable.`,
  ).join('\n'),
};

function project(index: number, imageCount: 1 | 2 | 3): ResearchProject {
  return {
    id: `fixture-research-${index}`,
    title: localized(`自动化测试项目 ${index}`, `Automated test project ${index}`),
    period: `202${index}–202${index + 1}`,
    summary: index === 3
      ? longSummary
      : localized(
          '此项目仅用于自动化测试。',
          'This project is used only for automated testing.',
        ),
    images: Array.from({ length: imageCount }, (_, imageIndex) =>
      image(`research-${index}-${imageIndex + 1}`, imageIndex),
    ),
    papers: [
      {
        id: `fixture-paper-${index}`,
        title: localized(`自动化测试论文 ${index}`, `Automated test paper ${index}`),
      },
    ],
    featured: index <= 3,
    ...(index <= 3 ? { featuredOrder: index } : {}),
  };
}

const photos = createPhotos();

function createCollections(): PhotoCollection[] {
  return [
    {
      id: 'fixture-collection-zju',
      title: localized('浙江大学摄影合集', 'Zhejiang University collection'),
      description: localized(
        '自动化测试合集：浙江大学校园风光。',
        'Automated test collection: Zhejiang University campus.',
      ),
      slug: 'zhejiang-university',
      photos: [photos[0], photos[1], photos[2], photos[10]],
      sortOrder: 1,
    },
    {
      id: 'fixture-collection-travel',
      title: localized('旅行摄影合集', 'Travel collection'),
      description: localized(
        '自动化测试合集：旅途中的风景与人。',
        'Automated test collection: scenery and people on the road.',
      ),
      slug: 'travel',
      photos: [photos[4], photos[5], photos[6]],
      sortOrder: 2,
    },
  ];
}

const projects = [project(1, 1), project(2, 2), project(3, 3), project(4, 1)];
const collections = createCollections();

export function isE2EFixtureMode(): boolean {
  return process.env.E2E_FIXTURE_MODE === E2E_FIXTURE_FLAG;
}

export function createE2EFixtureRepositories() {
  return {
    profile: new InMemoryProfileRepository(profile, education, awards),
    photos: new InMemoryPhotoRepository(photos, profile.heroPhotoId),
    photoCollections: new InMemoryPhotoCollectionRepository(collections),
    research: new InMemoryResearchRepository(projects),
  };
}
