/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {type ComponentProps, useState} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {
  PhotoViewer,
  derivePhotoIndex,
  type LightboxAdapterProps,
  type PhotoViewerLabels,
} from '@/features/photography';
import {loadPhotoViewerAdapter} from '@/features/photography/photo-viewer-loader';
import {createPhoto} from '@fixtures/domain';

vi.mock('@/features/photography/photo-viewer-loader', () => ({
  loadPhotoViewerAdapter: vi.fn(),
}));

const photos = [
  createPhoto('first', ['landscape']),
  createPhoto('second', ['landscape']),
  createPhoto('third', ['landscape']),
];

const labels: PhotoViewerLabels = {
  viewerTitle: 'Photography viewer',
  loading: 'Loading viewer…',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  unavailable: 'The photo viewer is temporarily unavailable',
};

function FakeAdapter({activeId, onClose, onView}: LightboxAdapterProps) {
  return (
    <div aria-label="Photography viewer" role="dialog">
      <p>{activeId}</p>
      <button onClick={onClose} type="button">Close</button>
      <button onClick={() => onView('third')} type="button">Next fake</button>
    </div>
  );
}

function Harness(props: Omit<ComponentProps<typeof PhotoViewer>, 'activeId' | 'onClose'>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <>
      <button onClick={() => setActiveId('second')} type="button">Open second</button>
      <PhotoViewer
        {...props}
        activeId={activeId}
        onClose={() => setActiveId(null)}
      />
    </>
  );
}

beforeEach(() => {
  vi.mocked(loadPhotoViewerAdapter).mockResolvedValue({default: FakeAdapter});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PhotoViewer public interface', () => {
  it('derives the current position from a stable photo id', () => {
    expect(derivePhotoIndex(photos, 'second')).toBe(1);
    expect(derivePhotoIndex([photos[2], photos[0], photos[1]], 'second')).toBe(2);
    expect(derivePhotoIndex(photos, 'missing')).toBe(-1);
    expect(derivePhotoIndex(photos, null)).toBe(-1);
  });

  it('does not load the adapter while closed, then opens the requested id and restores focus', async () => {
    render(
      <Harness labels={labels} locale="en" photos={photos} />,
    );

    expect(loadPhotoViewerAdapter).not.toHaveBeenCalled();
    const trigger = screen.getByRole('button', {name: 'Open second'});
    await userEvent.click(trigger);

    expect(await screen.findByRole('dialog', {name: 'Photography viewer'}))
      .toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(loadPhotoViewerAdapter).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', {name: 'Close'}));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the current photo as an id when the adapter navigates', async () => {
    render(<Harness labels={labels} locale="en" photos={photos} />);
    await userEvent.click(screen.getByRole('button', {name: 'Open second'}));
    await userEvent.click(await screen.findByRole('button', {name: 'Next fake'}));

    expect(screen.getByText('third')).toBeInTheDocument();
  });

  it('restores the correct trigger after reopening the dynamically cached module', async () => {
    render(<Harness labels={labels} locale="en" photos={photos} />);
    const trigger = screen.getByRole('button', {name: 'Open second'});

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', {name: 'Close'}));
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', {name: 'Close'}));

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(loadPhotoViewerAdapter).toHaveBeenCalledTimes(2);
  });

  it('shows a localized, backdrop-closeable fallback when dynamic loading fails', async () => {
    vi.mocked(loadPhotoViewerAdapter).mockRejectedValueOnce(new Error('chunk missing'));
    render(<Harness labels={labels} locale="en" photos={photos} />);

    const trigger = screen.getByRole('button', {name: 'Open second'});
    await userEvent.click(trigger);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The photo viewer is temporarily unavailable',
    );

    await userEvent.click(screen.getByTestId('photo-viewer-error-backdrop'));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
