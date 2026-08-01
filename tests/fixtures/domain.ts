import type {
  AwardEntry,
  EducationEntry,
  ImageAsset,
  LocalizedText,
  PaperResult,
  Photo,
  PhotoCategory,
  Profile,
  ResearchProject,
} from '@/content/contracts';

export function localized(zh: string, en: string): LocalizedText {
  return { zh, en };
}

export function createImageAsset(
  id: string,
  overrides: Partial<ImageAsset> = {},
): ImageAsset {
  const width = overrides.width ?? 1600;
  const height = overrides.height ?? 1000;

  return {
    id,
    width,
    height,
    aspectRatio: overrides.aspectRatio ?? width / height,
    alt: overrides.alt ?? localized(`测试图片 ${id}`, `Fixture image ${id}`),
    ...(overrides.blurDataUrl === undefined
      ? {}
      : { blurDataUrl: overrides.blurDataUrl }),
  };
}

export const profileFixture: Profile = {
  nickname: '测试作品集',
  avatar: createImageAsset('fixture-avatar', { width: 800, height: 800 }),
  bio: localized('仅用于自动化测试的简介。', 'Biography used only by automated tests.'),
  institution: 'Fixture University',
  role: localized('测试摄影师', 'Fixture photographer'),
  email: 'portfolio-owner@example.com',
  heroPhotoId: 'photo-001',
  resumeUrl: 'https://cdn.sanity.io/files/test-project/test-dataset/fixture-resume.pdf',
};

export const educationFixtures: EducationEntry[] = [
  {
    id: 'education-002',
    institution: localized('示例研究院', 'Fixture Institute'),
    description: localized('测试教育经历二', 'Fixture education entry two'),
    period: '2022–2024',
    order: 2,
  },
  {
    id: 'education-001',
    institution: localized('示例大学', 'Fixture University'),
    description: localized('测试教育经历一', 'Fixture education entry one'),
    period: '2018–2022',
    order: 1,
  },
];

export const awardFixtures: AwardEntry[] = [
  {
    id: 'award-002',
    title: localized('测试奖项二', 'Fixture award two'),
    date: '2024-06',
    description: localized('测试补充说明', 'Fixture description'),
    order: 2,
  },
  {
    id: 'award-001',
    title: localized('测试奖项一', 'Fixture award one'),
    date: '2023',
    order: 1,
  },
];

export function createPhoto(
  id: string,
  categories: PhotoCategory[],
  overrides: Partial<Photo> = {},
): Photo {
  return {
    id,
    image: createImageAsset(`image-${id}`),
    categories: [...categories],
    shotAt: '2025-01',
    city: localized('测试城市', 'Fixture City'),
    description: localized(`测试照片 ${id}`, `Fixture photo ${id}`),
    featured: false,
    ...overrides,
  };
}

export const landscapePhotoFixture = createPhoto('landscape-fixture', ['landscape']);
export const portraitPhotoFixture = createPhoto('portrait-fixture', ['portrait']);
export const crossCategoryPhotoFixture = createPhoto('cross-category-fixture', [
  'landscape',
  'portrait',
]);

function monthForIndex(index: number): string {
  const year = 2018 + Math.floor(index / 12);
  const month = String((index % 12) + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function categoriesForIndex(index: number): PhotoCategory[] {
  if (index % 10 === 0) {
    return ['landscape', 'portrait'];
  }

  return index % 2 === 0 ? ['landscape'] : ['portrait'];
}

export function createDeterministicPhotoDataset(count = 100): Photo[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Photo fixture count must be a non-negative integer.');
  }

  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1;
    const id = `photo-${String(sequence).padStart(3, '0')}`;
    const width = 1200 + (index % 5) * 160;
    const height = 800 + (index % 4) * 140;
    const featured = index < Math.min(5, count);

    return createPhoto(id, categoriesForIndex(index), {
      image: createImageAsset(`image-${id}`, { width, height }),
      shotAt: monthForIndex(index),
      city: localized(`测试城市 ${index % 8}`, `Fixture City ${index % 8}`),
      description: localized(`确定性测试照片 ${sequence}`, `Deterministic fixture photo ${sequence}`),
      featured,
      ...(featured ? { featuredOrder: sequence } : {}),
    });
  });
}

export const photoDataset = createDeterministicPhotoDataset();

export function createPaperResult(id: string): PaperResult {
  return {
    id,
    title: localized(`测试论文 ${id}`, `Fixture paper ${id}`),
  };
}

export function createResearchProject(
  id: string,
  imageCount: 1 | 2 | 3,
  overrides: Partial<ResearchProject> = {},
): ResearchProject {
  return {
    id,
    title: localized(`测试项目 ${id}`, `Fixture project ${id}`),
    period: '2024–2025',
    summary: localized('仅用于自动化测试的项目摘要。', 'Project summary used only by automated tests.'),
    images: Array.from({ length: imageCount }, (_, index) =>
      createImageAsset(`${id}-image-${index + 1}`),
    ),
    papers: [createPaperResult(`${id}-paper-1`)],
    featured: false,
    ...overrides,
  };
}

export const researchProjectOneImageFixture = createResearchProject('research-001', 1, {
  featured: true,
  featuredOrder: 1,
});
export const researchProjectTwoImagesFixture = createResearchProject('research-002', 2, {
  featured: true,
  featuredOrder: 2,
});
export const researchProjectThreeImagesFixture = createResearchProject('research-003', 3, {
  featured: true,
  featuredOrder: 3,
});

export const researchProjectFixtures: ResearchProject[] = [
  researchProjectThreeImagesFixture,
  researchProjectOneImageFixture,
  researchProjectTwoImagesFixture,
  createResearchProject('research-004', 1),
];
