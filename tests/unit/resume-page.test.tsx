import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { renderResumePage } from '@/features/resume';
import type { ProfileRepository } from '@/content/contracts';
import { InMemoryProfileRepository } from '@/content/repositories';
import {
  awardFixtures,
  educationFixtures,
  profileFixture,
} from '@fixtures/domain';

describe('localized résumé page', () => {
  it.each([
    ['zh', '个人简历', '示例大学', '测试奖项一'],
    ['en', 'Résumé', 'Fixture University', 'Fixture award one'],
  ] as const)(
    'server-renders repository content in %s',
    async (locale, pageTitle, institution, award) => {
      const repository = new InMemoryProfileRepository(
        profileFixture,
        educationFixtures,
        awardFixtures,
      );

      const page = await renderResumePage(locale, repository);
      const html = renderToStaticMarkup(page);

      expect(html).toContain(`>${pageTitle}</h1>`);
      expect(html.indexOf(institution)).toBeLessThan(html.indexOf(locale === 'zh' ? '示例研究院' : 'Fixture Institute'));
      expect(html).toContain(award);
      expect(html).toContain('download="wind-flower-poetry-wine-tea-resume.pdf"');
      expect(html).not.toContain('<iframe');
    },
  );

  it('renders a localized module error when repository content is unavailable', async () => {
    const unavailableRepository: ProfileRepository = {
      getProfile: async () => Promise.reject(new Error('secret upstream detail')),
      listEducation: async () => [],
      listAwards: async () => [],
    };

    const page = await renderResumePage('en', unavailableRepository);
    const html = renderToStaticMarkup(page);

    expect(html).toContain('role="alert"');
    expect(html).toContain('The résumé is unavailable');
    expect(html).not.toContain('secret upstream detail');
  });
});
