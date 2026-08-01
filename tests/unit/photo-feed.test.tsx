/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';

import type {PageResult, Photo} from '@/content/contracts';
import {PhotoFeed} from '@/features/photography';
import {createPhoto} from '@fixtures/domain';

const firstLandscape = createPhoto('landscape-1', ['landscape']);
const secondLandscape = createPhoto('landscape-2', ['landscape']);

const labels = {
  loadMore: 'Load more',
  loading: 'Loading photographs…',
  retry: 'Retry',
  complete: 'All photographs loaded',
  error: 'Loading failed. Please try again',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  pageInfo: 'Page {current} of {total}',
};

function page(
  items: Photo[],
  nextCursor: string | null,
): PageResult<Photo> {
  return {items, nextCursor, hasMore: nextCursor !== null};
}

afterEach(() => {
  cleanup();
});

describe('PhotoFeed static pagination', () => {
  it('renders photos and pagination navigation with next link', () => {
    render(
      <PhotoFeed
        category="landscape"
        currentPage={1}
        hasMore={true}
        initialPage={page([firstLandscape], 'cursor-1')}
        labels={labels}
        locale="en"
        nextPageUrl="/en/photography/landscape/2/#gallery"
        onOpen={() => undefined}
        prevPageUrl={null}
      />,
    );

    expect(screen.getByRole('button', {name: 'Fixture image image-landscape-1'}))
      .toBeInTheDocument();
    expect(screen.getByText('Page 1 of …')).toBeInTheDocument();

    const nextLink = screen.getByRole('link', {name: 'Next page →'});
    expect(nextLink).toHaveAttribute('href', '/en/photography/landscape/2/#gallery');

    // Previous link should be disabled
    expect(screen.getByText('← Previous page').closest('span'))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('shows prev and next links on an intermediate page', () => {
    render(
      <PhotoFeed
        category="portrait"
        currentPage={2}
        hasMore={true}
        initialPage={page([secondLandscape], 'cursor-2')}
        labels={labels}
        locale="zh"
        nextPageUrl="/zh/photography/portrait/3/#gallery"
        onOpen={() => undefined}
        prevPageUrl="/zh/photography/portrait/#gallery"
      />,
    );

    const prevLink = screen.getByRole('link', {name: '← Previous page'});
    expect(prevLink).toHaveAttribute('href', '/zh/photography/portrait/#gallery');

    const nextLink = screen.getByRole('link', {name: 'Next page →'});
    expect(nextLink).toHaveAttribute('href', '/zh/photography/portrait/3/#gallery');
  });

  it('disables next link and shows final page label when there are no more pages', () => {
    render(
      <PhotoFeed
        category="landscape"
        currentPage={3}
        hasMore={false}
        initialPage={page([firstLandscape], null)}
        labels={labels}
        locale="en"
        nextPageUrl={null}
        onOpen={() => undefined}
        prevPageUrl="/en/photography/landscape/2/#gallery"
      />,
    );

    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();

    // Next link should be disabled
    expect(screen.getByText('Next page →').closest('span'))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('shows empty message when there are no photographs', () => {
    render(
      <PhotoFeed
        category="landscape"
        currentPage={1}
        hasMore={false}
        initialPage={page([], null)}
        labels={{...labels, empty: 'No photographs'}}
        locale="en"
        nextPageUrl={null}
        onOpen={() => undefined}
        prevPageUrl={null}
      />,
    );

    expect(screen.getByText('No photographs')).toBeInTheDocument();
  });

  it('remounts when category or page changes via the key prop', () => {
    const view = render(
      <PhotoFeed
        category="landscape"
        currentPage={1}
        hasMore={true}
        initialPage={page([firstLandscape], 'cursor-1')}
        labels={labels}
        locale="en"
        nextPageUrl="/en/photography/landscape/2/#gallery"
        onOpen={() => undefined}
        prevPageUrl={null}
      />,
    );

    expect(screen.getByRole('button', {name: 'Fixture image image-landscape-1'})).toBeInTheDocument();

    view.rerender(
      <PhotoFeed
        category="portrait"
        currentPage={1}
        hasMore={false}
        initialPage={page([secondLandscape], null)}
        labels={labels}
        locale="en"
        nextPageUrl={null}
        onOpen={() => undefined}
        prevPageUrl={null}
      />,
    );

    // Should show page 1 of 1 for the new category
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
