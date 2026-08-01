import { describe, expect, it } from 'vitest';

import { InMemoryProfileRepository } from '@/content/repositories';
import { loadResumeContent } from '@/features/resume';
import {
  awardFixtures,
  educationFixtures,
  profileFixture,
} from '@fixtures/domain';

describe('loadResumeContent', () => {
  it('loads the profile, education, and awards through the repository seam', async () => {
    const repository = new InMemoryProfileRepository(
      profileFixture,
      educationFixtures,
      awardFixtures,
    );

    await expect(loadResumeContent(repository)).resolves.toEqual({
      profile: profileFixture,
      education: [educationFixtures[1], educationFixtures[0]],
      awards: [awardFixtures[1], awardFixtures[0]],
    });
  });
});
