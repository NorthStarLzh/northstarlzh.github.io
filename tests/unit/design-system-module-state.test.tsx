/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModuleState, moduleStateMessages } from '@/components/feedback';

afterEach(cleanup);

describe('ModuleState', () => {
  it('uses the Chinese loading entry and a stable skeleton', () => {
    render(<ModuleState kind="loading" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent(moduleStateMessages.zh.loading.title);
    expect(screen.getByTestId('module-state-skeleton')).toBeInTheDocument();
  });

  it('uses the English empty entry without exposing retry controls', () => {
    render(<ModuleState kind="empty" locale="en" />);

    expect(screen.getByRole('status')).toHaveTextContent('Nothing here yet');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('announces errors and retries with custom text', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(
      <ModuleState
        description="Please reconnect."
        kind="error"
        locale="en"
        retry={retry}
        retryLabel="Try once more"
        title="Network unavailable"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    await user.click(screen.getByRole('button', { name: 'Try once more' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it.each(['loading', 'empty', 'error'] as const)(
    'has no detectable accessibility violations for %s',
    async (kind) => {
      const { container } = render(
        <ModuleState kind={kind} locale="en" retry={kind === 'error' ? () => undefined : undefined} />,
      );
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(results.violations).toHaveLength(0);
    },
  );
});
