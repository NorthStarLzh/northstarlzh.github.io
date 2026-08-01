/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DesignSystemShowcase } from '@/components/design-system';

afterEach(cleanup);

describe('design-system showcase visual stories', () => {
  it.each([
    ['light', 'mobile'],
    ['light', 'tablet'],
    ['light', 'desktop'],
    ['dark', 'mobile'],
    ['dark', 'tablet'],
    ['dark', 'desktop'],
  ] as const)('matches the %s theme at the %s viewport', (theme, viewport) => {
    const { container } = render(
      <DesignSystemShowcase theme={theme} viewport={viewport} />,
    );
    const story = container.firstElementChild;
    expect(story).toHaveAttribute('data-theme', theme);
    expect(story).toHaveAttribute('data-preview-viewport', viewport);
    expect(story).toMatchSnapshot();
  });
});
