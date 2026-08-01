// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { FeaturedResearchSection } from '@/features/research';
import { messagesByLocale } from '@/i18n/messages';
import { researchProjectFixtures } from '@fixtures/domain';

afterEach(cleanup);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: () => undefined,
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: () => undefined,
  });
});

describe('FeaturedResearchSection', () => {
  it('reuses the card and dialog while limiting the home section to three projects', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messagesByLocale.en}>
        <FeaturedResearchSection
          locale="en"
          projects={researchProjectFixtures}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Featured research' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Fixture project/ })).toHaveLength(3);
    await user.click(
      screen.getByRole('button', { name: /Fixture project research-003/ }),
    );
    expect(
      screen.getByRole('dialog', { name: 'Fixture project research-003' }),
    ).toBeInTheDocument();
  });
});
