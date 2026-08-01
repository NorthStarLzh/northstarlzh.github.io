import { describe, expect, it } from 'vitest';

import {
  InMemoryPhotoRepository,
  InMemoryProfileRepository,
  InMemoryResearchRepository,
} from '@/content/repositories';
import {
  awardFixtures,
  educationFixtures,
  photoDataset,
  profileFixture,
  researchProjectFixtures,
} from '@fixtures/domain';

describe('InMemoryProfileRepository', () => {
  it('returns the profile and sorted resume entries', async () => {
    const repository = new InMemoryProfileRepository(
      profileFixture,
      educationFixtures,
      awardFixtures,
    );

    await expect(repository.getProfile()).resolves.toEqual(profileFixture);
    await expect(repository.listEducation()).resolves.toEqual([
      educationFixtures[1],
      educationFixtures[0],
    ]);
    await expect(repository.listAwards()).resolves.toEqual([
      awardFixtures[1],
      awardFixtures[0],
    ]);
  });

  it('returns defensive copies', async () => {
    const repository = new InMemoryProfileRepository(profileFixture);
    const profile = await repository.getProfile();
    profile.nickname = 'mutated';

    await expect(repository.getProfile()).resolves.toEqual(profileFixture);
  });
});

describe('InMemoryPhotoRepository', () => {
  it('returns the configured hero and five ordered featured photos', async () => {
    const repository = new InMemoryPhotoRepository(photoDataset, profileFixture.heroPhotoId);

    await expect(repository.getHeroPhoto()).resolves.toMatchObject({ id: 'photo-001' });
    const featured = await repository.listFeatured(5);
    expect(featured).toHaveLength(5);
    expect(featured.every((photo, index) => photo.featuredOrder === index + 1)).toBe(true);
  });

  it('paginates one category with an opaque test cursor and stable completion', async () => {
    const repository = new InMemoryPhotoRepository(photoDataset);
    const first = await repository.listPage({ category: 'landscape', limit: 20 });
    const second = await repository.listPage({
      category: 'landscape',
      cursor: first.nextCursor ?? undefined,
      limit: 100,
    });

    expect(first.items).toHaveLength(20);
    expect(first.items.every(({ categories }) => categories.includes('landscape'))).toBe(true);
    expect(first.nextCursor).toBe('memory:20');
    expect(first.hasMore).toBe(true);
    expect(second.hasMore).toBe(false);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items, ...second.items].map(({ id }) => id)).size).toBe(
      first.items.length + second.items.length,
    );
  });

  it.each([
    { category: 'portrait' as const, limit: 0 },
    { category: 'portrait' as const, limit: -1 },
    { category: 'portrait' as const, limit: 1.5 },
  ])('rejects invalid page limits %#', async (input) => {
    const repository = new InMemoryPhotoRepository(photoDataset);
    await expect(repository.listPage(input)).rejects.toThrow(RangeError);
  });

  it.each(['invalid', 'memory:-1', 'memory:1.5', 'memory:999'])
    ('rejects an invalid or out-of-range cursor %s', async (cursor) => {
      const repository = new InMemoryPhotoRepository(photoDataset);
      await expect(
        repository.listPage({ category: 'portrait', cursor, limit: 20 }),
      ).rejects.toThrow(RangeError);
    });

  it('fails clearly when the configured hero is absent', async () => {
    const repository = new InMemoryPhotoRepository(photoDataset, 'missing-photo');
    await expect(repository.getHeroPhoto()).rejects.toThrow('missing-photo');
  });
});

describe('InMemoryResearchRepository', () => {
  it('returns at most three featured projects in configured order', async () => {
    const repository = new InMemoryResearchRepository(researchProjectFixtures);
    const projects = await repository.listFeatured(3);

    expect(projects.map(({ id }) => id)).toEqual([
      'research-001',
      'research-002',
      'research-003',
    ]);
  });

  it('returns all projects and looks up a project by id', async () => {
    const repository = new InMemoryResearchRepository(researchProjectFixtures);

    await expect(repository.listAll()).resolves.toHaveLength(4);
    await expect(repository.getById('research-002')).resolves.toMatchObject({
      id: 'research-002',
      images: expect.any(Array),
    });
    await expect(repository.getById('missing')).resolves.toBeNull();
  });

  it('returns defensive copies', async () => {
    const repository = new InMemoryResearchRepository(researchProjectFixtures);
    const projects = await repository.listAll();
    projects[0].title.zh = 'mutated';

    await expect(repository.listAll()).resolves.toEqual(researchProjectFixtures);
  });
});
