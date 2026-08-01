// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DesignSystemShowcase } from '@/components/design-system';

afterEach(cleanup);

describe('theme base-page visual snapshots', () => {
  it.each(['light', 'dark'] as const)('matches the %s theme', (theme) => {
    const { container } = render(
      <main data-theme={theme}>
        <DesignSystemShowcase theme={theme} viewport="desktop" />
      </main>,
    );

    expect(container.firstElementChild).toMatchSnapshot();
  });
});
