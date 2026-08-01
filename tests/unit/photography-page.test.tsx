import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';

import {InMemoryPhotoRepository} from '@/content/repositories';
import {PhotographyList} from '@/features/photography';
import {loadInitialPhotographyPage} from '@/features/photography';
import {createDeterministicPhotoDataset} from '@fixtures/domain';

const labels = {
  loadMore: 'Load more',
  loading: 'Loading photographs…',
  retry: 'Retry',
  complete: 'All photographs loaded',
  error: 'Loading failed. Please try again',
  empty: 'No photographs yet',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  pageInfo: 'Page {current} of {total}',
};

const viewerLabels = {
  viewerTitle: 'Photography viewer',
  loading: 'Loading viewer…',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  unavailable: 'Viewer unavailable',
};

describe('photography page server boundary', () => {
  it('parses URL category and asks the repository for at most twenty initial photos', async () => {
    const repository = new InMemoryPhotoRepository(createDeterministicPhotoDataset());
    const result = await loadInitialPhotographyPage(repository, {category: 'portrait'});

    expect(result.category).toBe('portrait');
    expect(result.page.items).toHaveLength(20);
    expect(result.page.items.every((photo) => photo.categories.includes('portrait'))).toBe(true);
  });

  it('renders the first repository page into HTML with pagination navigation', async () => {
    const repository = new InMemoryPhotoRepository(
      createDeterministicPhotoDataset(100).map((photo) => ({
        ...photo,
        categories: ['landscape' as const],
      })),
    );
    const {category, page} = await loadInitialPhotographyPage(repository, {});
    const html = renderToStaticMarkup(
      <PhotographyList
        category={category}
        currentPage={1}
        hasMore={page.hasMore}
        initialPage={page}
        labels={labels}
        locale="en"
        nextPageUrl="/en/photography/landscape/2/#gallery"
        prevPageUrl={null}
        viewerLabels={viewerLabels}
      />,
    );

    expect((html.match(/data-photo-id=/g) ?? [])).toHaveLength(20);
    expect(page.hasMore).toBe(true);
    expect(html).not.toContain('data-photo-id="photo-021"');
    expect(html).toContain('Next page');
  });
});
