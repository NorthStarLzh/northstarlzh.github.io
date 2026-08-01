// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ContactSection } from '@/features/contact';
import { ResumeModule } from '@/features/resume';
import {
  awardFixtures,
  educationFixtures,
  profileFixture,
} from '@fixtures/domain';

afterEach(cleanup);

describe('résumé and contact responsive stories', () => {
  it.each(['mobile', 'tablet', 'desktop'] as const)(
    'keeps the complete content at the %s viewport',
    (viewport) => {
      const { container } = render(
        <div data-preview-viewport={viewport}>
          <ResumeModule
            content={{
              profile: profileFixture,
              education: educationFixtures,
              awards: awardFixtures,
            }}
            locale="zh"
          />
          <ContactSection
            email="Northstar_lzh@zju.edu.cn"
            locale="zh"
          />
        </div>,
      );

      expect(container.firstElementChild).toHaveAttribute(
        'data-preview-viewport',
        viewport,
      );
      expect(container.firstElementChild).toMatchSnapshot();
    },
  );
});
