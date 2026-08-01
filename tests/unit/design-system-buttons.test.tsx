/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button, ButtonLink, IconButton } from '@/components/ui';

afterEach(cleanup);

describe('button primitives', () => {
  it('supports activation, sizes and variants', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} size="lg" variant="secondary">
        View work
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'View work' });
    expect(button).toHaveClass('ds-button--lg', 'ds-button--secondary');
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('makes disabled and loading buttons inoperable', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
        <Button loading loadingLabel="Saving" onClick={onClick}>
          Save
        </Button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Disabled' }));
    await user.click(screen.getByRole('button', { name: 'Saving' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Saving' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('requires an accessible icon label and supports keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <>
        <IconButton label="Close">×</IconButton>
        <ButtonLink href="/resume.pdf">Download resume</ButtonLink>
      </>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Download resume' })).toHaveFocus();
  });

  it('removes disabled links from keyboard navigation and prevents activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ButtonLink disabled href="/private" onClick={onClick}>
        Unavailable
      </ButtonLink>,
    );

    const link = screen.getByRole('link', { name: 'Unavailable' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    await user.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <div>
        <Button>Continue</Button>
        <IconButton label="Favorite">♡</IconButton>
        <ButtonLink href="/resume.pdf">Resume</ButtonLink>
      </div>,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
