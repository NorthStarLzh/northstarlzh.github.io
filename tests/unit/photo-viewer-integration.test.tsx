/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {PageResult, Photo} from '@/content/contracts';
import {
  FeaturedPhotoGallery,
  PhotographyList,
  type LightboxAdapterProps,
  type PhotoViewerLabels,
} from '@/features/photography';
import {loadPhotoViewerAdapter} from '@/features/photography/photo-viewer-loader';
import {createPhoto} from '@fixtures/domain';

vi.mock('@/features/photography/photo-viewer-loader', () => ({
  loadPhotoViewerAdapter: vi.fn(),
}));

const viewerLabels: PhotoViewerLabels = {
  viewerTitle: 'Photography viewer',
  loading: 'Loading viewer…',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  unavailable: 'Viewer unavailable',
};

const feedLabels = {
  loadMore: 'Load more',
  loading: 'Loading photographs…',
  retry: 'Retry',
  complete: 'All photographs loaded',
  error: 'Loading failed',
  empty: 'No photographs',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  pageInfo: 'Page {current} of {total}',
};

function FakeAdapter({activeId, onClose}: LightboxAdapterProps) {
  return (
    <div aria-label="Photography viewer" role="dialog">
      <p>Viewing {activeId}</p>
      <button onClick={onClose} type="button">Close</button>
    </div>
  );
}

function page(items: Photo[], nextCursor: string | null): PageResult<Photo> {
  return {items, nextCursor, hasMore: nextCursor !== null};
}

beforeEach(() => {
  vi.mocked(loadPhotoViewerAdapter).mockResolvedValue({default: FakeAdapter});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('photo viewer composition', () => {
  it('opens a photography-page photo in the lightbox', async () => {
    const first = createPhoto('page-first', ['landscape']);
    const second = createPhoto('page-second', ['landscape']);
    render(
      <PhotographyList
        category="landscape"
        currentPage={1}
        hasMore={false}
        initialPage={page([first, second], null)}
        labels={feedLabels}
        locale="en"
        nextPageUrl={null}
        prevPageUrl={null}
        viewerLabels={viewerLabels}
      />,
    );

    await userEvent.click(screen.getByRole('button', {name: 'Fixture image image-page-first'}));
    expect(await screen.findByText('Viewing page-first')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(screen.queryByText('Viewing page-first')).not.toBeInTheDocument();
  });

  it('reuses the same viewer interface for the five-photo home selection', async () => {
    const featured = Array.from({length: 5}, (_, index) =>
      createPhoto(`featured-${index + 1}`, ['landscape'], {
        featured: true,
        featuredOrder: index + 1,
      }),
    );
    render(
      <FeaturedPhotoGallery
        labels={viewerLabels}
        locale="zh"
        photos={featured}
        title="精选摄影"
      />,
    );

    expect(screen.getAllByRole('button', {name: /测试图片/})).toHaveLength(5);
    await userEvent.click(screen.getByRole('button', {name: '测试图片 image-featured-4'}));
    expect(await screen.findByText('Viewing featured-4')).toBeInTheDocument();
  });
});
