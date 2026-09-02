/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {
  JustifiedGallery,
  buildThumbnailSources,
  createJustifiedRows,
} from '@/features/photography';
import {createPhoto} from '@fixtures/domain';

afterEach(cleanup);

function photo(id: string, aspectRatio: number) {
  return createPhoto(id, ['landscape'], {
    image: {
      id: `image-${id}-1600x900-jpg`,
      width: 1600,
      height: Math.round(1600 / aspectRatio),
      aspectRatio,
      alt: {zh: `摄影作品 ${id}`, en: `Photograph ${id}`},
    },
  });
}

describe('JustifiedGallery adapter', () => {
  it('partitions photographs into full-width, equal-height rows', () => {
    const photos = [
      photo('one', 1.8),
      photo('two', 1.2),
      photo('three', 1.5),
      photo('four', 0.8),
      photo('five', 1.6),
      photo('six', 1.1),
    ];
    const rows = createJustifiedRows(photos, 1_200, 16, 230);

    expect(rows.flatMap((row) => row.photos).map(({id}) => id)).toEqual(
      photos.map(({id}) => id),
    );
    expect(rows.every((row) => row.justified)).toBe(true);
    for (const row of rows) {
      const renderedWidth = row.photos.reduce(
        (sum, item) => sum + item.image.aspectRatio * row.height,
        0,
      ) + 16 * (row.photos.length - 1);
      expect(renderedWidth).toBeCloseTo(1_200, 5);
    }
  });

  it('reserves original proportions and emits the selected photo id', async () => {
    const onOpen = vi.fn();
    const ridge = photo('wide-ridge', 16 / 9);
    render(<JustifiedGallery locale="zh" onOpen={onOpen} photos={[ridge]} />);

    const image = screen.getByRole('img', {name: '摄影作品 wide-ridge'});
    expect(image).toHaveAttribute('width', '1600');
    expect(image).toHaveAttribute('height', '900');
    const source = document.querySelector('source');
    expect(source).toHaveAttribute(
      'sizes',
      '(min-width: 75rem) 25vw, (min-width: 48rem) 33vw, (min-width: 36rem) 50vw, 100vw',
    );
    expect(source?.getAttribute('srcset')).toContain('480w');
    expect(source?.getAttribute('srcset')).toContain('1200w');
    expect(source?.getAttribute('srcset')).not.toContain('1600w');

    await userEvent.click(screen.getByRole('button', {name: '摄影作品 wide-ridge'}));
    expect(onOpen).toHaveBeenCalledWith('wide-ridge');
  });

  it('maps a Sanity asset id to bounded CDN thumbnail variants', () => {
    expect(buildThumbnailSources(
      'image-abc123-2400x1600-jpg',
      {projectId: 'project1', dataset: 'production'},
    )).toEqual({
      src: 'https://cdn.sanity.io/images/project1/production/abc123-2400x1600.jpg?auto=format&fit=max&w=800',
      srcSet: [
        'https://cdn.sanity.io/images/project1/production/abc123-2400x1600.jpg?auto=format&fit=max&w=480 480w',
        'https://cdn.sanity.io/images/project1/production/abc123-2400x1600.jpg?auto=format&fit=max&w=800 800w',
        'https://cdn.sanity.io/images/project1/production/abc123-2400x1600.jpg?auto=format&fit=max&w=1200 1200w',
      ].join(', '),
    });
  });
});
