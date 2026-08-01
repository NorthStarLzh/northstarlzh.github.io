/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { axe } from 'vitest-axe';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Button, Dialog } from '@/components/ui';

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

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog
        closeLabel="Close details"
        description="A complete project description"
        onOpenChange={setOpen}
        open={open}
        title="Project details"
        trigger={<Button>Open details</Button>}
      >
        <p>Dialog body</p>
        <Button>Secondary action</Button>
      </Dialog>
      <button type="button">Background action</button>
    </>
  );
}

function ExternalTriggerDialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open controlled dialog</Button>
      <Dialog
        closeLabel="Close controlled dialog"
        description="A dialog opened by an external control"
        onOpenChange={setOpen}
        open={open}
        title="Controlled dialog"
      >
        <p>Controlled dialog body</p>
      </Dialog>
    </>
  );
}

describe('Dialog adapter', () => {
  it('opens accessibly and closes with Escape while restoring focus', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open details' });
    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Project details' })).toBeInTheDocument();
    expect(screen.getByText('A complete project description')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Close details' })).toHaveFocus(),
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('keeps Tab focus inside the dialog', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open details' }));

    const close = screen.getByRole('button', { name: 'Close details' });
    const secondary = screen.getByRole('button', { name: 'Secondary action' });
    await waitFor(() => expect(close).toHaveFocus());
    await user.tab();
    expect(secondary).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Background action' })).not.toBeInTheDocument();
    expect(screen.getByText('Background action')).not.toHaveFocus();
  });

  it('closes from the labelled close button', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open details' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close details' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('restores focus when a controlled consumer owns the trigger', async () => {
    const user = userEvent.setup();
    render(<ExternalTriggerDialogHarness />);

    const externalTrigger = screen.getByRole('button', {
      name: 'Open controlled dialog',
    });
    await user.click(externalTrigger);
    await user.click(
      screen.getByRole('button', { name: 'Close controlled dialog' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(externalTrigger).toHaveFocus();
  });

  it('has no detectable accessibility violations while open', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open details' }));

    const results = await axe(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
