import { afterEach, describe, expect, it } from 'vitest';

import {
  createE2EFixtureRepositories,
  isE2EFixtureMode,
} from '@/content/repositories';

const previousFlag = process.env.E2E_FIXTURE_MODE;

afterEach(() => {
  if (previousFlag === undefined) {
    delete process.env.E2E_FIXTURE_MODE;
  } else {
    process.env.E2E_FIXTURE_MODE = previousFlag;
  }
});

describe('E2E fixture repository seam', () => {
  it('is opt-in and never activates in a normal runtime', () => {
    delete process.env.E2E_FIXTURE_MODE;
    expect(isE2EFixtureMode()).toBe(false);
    process.env.E2E_FIXTURE_MODE = '1';
    expect(isE2EFixtureMode()).toBe(true);
  });

  it('provides a deterministic bilingual 100-photo public dataset', async () => {
    const repositories = createE2EFixtureRepositories();
    const [landscape, portrait, profile, projects, collections] = await Promise.all([
      repositories.photos.listPage({ category: 'landscape', limit: 100 }),
      repositories.photos.listPage({ category: 'portrait', limit: 100 }),
      repositories.profile.getProfile(),
      repositories.research.listAll(),
      repositories.photoCollections.listCollections(),
    ]);
    const ids = new Set([
      ...landscape.items.map(({ id }) => id),
      ...portrait.items.map(({ id }) => id),
    ]);

    expect(ids.size).toBe(100);
    expect(profile.bio.zh).toContain('自动化测试');
    expect(profile.bio.en).toContain('automated testing');
    expect(projects.map(({ images }) => images.length)).toEqual([1, 2, 3, 1]);
    expect(collections.map(({ slug }) => slug)).toEqual([
      'zhejiang-university',
      'travel',
    ]);
    await expect(
      repositories.photoCollections.getCollectionBySlug('travel'),
    ).resolves.toMatchObject({ id: 'fixture-collection-travel' });
    await expect(
      repositories.photoCollections.getCollectionBySlug('missing'),
    ).resolves.toBeNull();
  });
});
