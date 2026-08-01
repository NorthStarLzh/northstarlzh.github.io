/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {act} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {PhotoFeed, type PhotoFeedProps} from '@/features/photography';
import {createPhoto} from '@fixtures/domain';

type ActEnvironment = typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

afterEach(() => {
  document.body.innerHTML = '';
  delete (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT;
  vi.unstubAllGlobals();
});

describe('PhotoFeed hydration', () => {
  it('renders the initial page with pagination navigation in static mode', async () => {
    (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT = true;
    const props: PhotoFeedProps = {
      category: 'landscape',
      currentPage: 1,
      hasMore: true,
      initialPage: {
        items: [createPhoto('hydration-photo', ['landscape'])],
        nextCursor: 'cursor-1',
        hasMore: true,
      },
      labels: {
        loadMore: 'Load more',
        loading: 'Loading photographs…',
        retry: 'Retry',
        complete: 'All photographs loaded',
        error: 'Loading failed',
        prevPage: 'Previous page',
        nextPage: 'Next page',
        pageInfo: 'Page {current} of {total}',
      },
      locale: 'en',
      nextPageUrl: '/en/photography/landscape/2/#gallery',
      onOpen: () => undefined,
      prevPageUrl: null,
    };
    const serverHtml = renderToString(<PhotoFeed {...props} />);
    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.append(container);
    expect(container).toHaveTextContent('Next page');

    let root!: ReturnType<typeof hydrateRoot>;

    await act(async () => {
      root = hydrateRoot(container, <PhotoFeed {...props} />);
    });

    expect(container.querySelector('.photography-feed__pagination')).not.toBeNull();
    expect(container).toHaveTextContent('Page 1 of …');

    await act(async () => root.unmount());
  });
});
