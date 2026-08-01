/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';

import {InMemoryPhotoRepository} from '@/content/repositories';
import {PhotoFeed} from '@/features/photography';
import {createDeterministicPhotoDataset} from '@fixtures/domain';

afterEach(() => {
  cleanup();
});

describe('photography pagination with the 100-photo fixture', () => {
  it('renders twenty photos on the first page with navigation to next page', async () => {
    const photos = createDeterministicPhotoDataset(100).map((photo) => ({
      ...photo,
      categories: ['landscape' as const],
    }));
    const repository = new InMemoryPhotoRepository(photos);
    const initialPage = await repository.listPage({category: 'landscape', limit: 20});

    render(
      <PhotoFeed
        category="landscape"
        currentPage={1}
        hasMore={initialPage.hasMore}
        initialPage={initialPage}
        labels={{
          loadMore: 'Load more',
          loading: 'Loading photographs…',
          retry: 'Retry',
          complete: 'All photographs loaded',
          error: 'Loading failed',
          prevPage: 'Previous page',
          nextPage: 'Next page',
          pageInfo: 'Page {current} of {total}',
        }}
        locale="en"
        nextPageUrl="/en/photography/landscape/2/#gallery"
        onOpen={() => undefined}
        prevPageUrl={null}
      />,
    );

    expect(document.querySelectorAll('[data-photo-id]')).toHaveLength(20);
    expect(screen.getByText('Page 1 of …')).toBeInTheDocument();

    const nextLink = screen.getByRole('link', {name: 'Next page →'});
    expect(nextLink).toHaveAttribute('href', '/en/photography/landscape/2/#gallery');
  });

  it('renders the final page with no next link and correct page label', async () => {
    const photos = createDeterministicPhotoDataset(100).map((photo) => ({
      ...photo,
      categories: ['landscape' as const],
    }));
    const repository = new InMemoryPhotoRepository(photos);
    // Walk to the last page
    let cursor: string | undefined;
    for (let i = 1; i < 5; i++) {
      const pageResult = await repository.listPage({category: 'landscape', cursor, limit: 20});
      cursor = pageResult.nextCursor ?? undefined;
    }
    const lastPage = await repository.listPage({category: 'landscape', cursor, limit: 20});

    render(
      <PhotoFeed
        category="landscape"
        currentPage={5}
        hasMore={false}
        initialPage={lastPage}
        labels={{
          loadMore: 'Load more',
          loading: 'Loading photographs…',
          retry: 'Retry',
          complete: 'All photographs loaded',
          error: 'Loading failed',
          prevPage: 'Previous page',
          nextPage: 'Next page',
          pageInfo: 'Page {current} of {total}',
        }}
        locale="en"
        nextPageUrl={null}
        onOpen={() => undefined}
        prevPageUrl="/en/photography/landscape/4/#gallery"
      />,
    );

    expect(document.querySelectorAll('[data-photo-id]')).toHaveLength(20);
    expect(screen.getByText('Page 5 of 5')).toBeInTheDocument();

    const prevLink = screen.getByRole('link', {name: '← Previous page'});
    expect(prevLink).toHaveAttribute('href', '/en/photography/landscape/4/#gallery');

    // Next link should be disabled
    expect(screen.getByText('Next page →').closest('span'))
      .toHaveAttribute('aria-disabled', 'true');
  });
});
