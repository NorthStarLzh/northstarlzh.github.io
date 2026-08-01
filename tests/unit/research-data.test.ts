import { describe, expect, it } from 'vitest';

import { InMemoryResearchRepository } from '@/content/repositories';
import {
  loadFeaturedResearch,
  loadResearchProjects,
} from '@/features/research';
import { researchProjectFixtures } from '@fixtures/domain';

describe('research data loaders', () => {
  it('loads every published project for the research page through its repository seam', async () => {
    const repository = new InMemoryResearchRepository(researchProjectFixtures);

    const projects = await loadResearchProjects(repository);

    expect(projects.map(({ id }) => id)).toEqual([
      'research-003',
      'research-001',
      'research-002',
      'research-004',
    ]);
  });

  it('loads exactly the three ordered featured projects for the home seam', async () => {
    const repository = new InMemoryResearchRepository(researchProjectFixtures);

    const projects = await loadFeaturedResearch(repository);

    expect(projects.map(({ id }) => id)).toEqual([
      'research-001',
      'research-002',
      'research-003',
    ]);
  });
});
