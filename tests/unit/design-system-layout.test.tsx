/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Cluster, Container, Section, Stack } from '@/components/layout';

afterEach(cleanup);

describe('layout primitives', () => {
  it('renders semantic elements and applies only shared spacing tokens', () => {
    render(
      <Container as="main" data-testid="container" size="narrow">
        <Section aria-label="Portfolio" data-testid="section" spacing="2xl">
          <Stack data-testid="stack" gap="lg">
            <span>One</span>
            <Cluster data-testid="cluster" gap="xs" justify="space-between">
              <span>Two</span>
              <span>Three</span>
            </Cluster>
          </Stack>
        </Section>
      </Container>,
    );

    const container = screen.getByTestId('container');
    expect(container.tagName).toBe('MAIN');
    expect(container).toHaveClass('ds-container');
    expect(container).toHaveStyle({ '--container-max': 'var(--content-narrow)' });
    expect(screen.getByTestId('section')).toHaveStyle({
      '--section-space': 'var(--space-2xl)',
    });
    expect(screen.getByTestId('stack')).toHaveStyle({
      '--stack-gap': 'var(--space-lg)',
    });
    expect(screen.getByTestId('cluster')).toHaveStyle({
      '--cluster-gap': 'var(--space-xs)',
      '--cluster-justify': 'space-between',
    });
  });

  it('preserves caller attributes and styles', () => {
    render(
      <Stack aria-label="custom stack" className="custom" style={{ color: 'red' }}>
        Content
      </Stack>,
    );

    const stack = screen.getByLabelText('custom stack');
    expect(stack).toHaveClass('ds-stack', 'custom');
    expect(stack).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
