/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {
  MasonryGallery,
  buildThumbnailSources,
} from '@/features/photography';
import {createPhoto} from '@fixtures/domain';

afterEach(cleanup);

describe('MasonryGallery adapter', () => {
  it('reserves each original aspect ratio and emits the selected photo id', async () => {
    const onOpen = vi.fn();
    const photo = createPhoto('wide-ridge', ['landscape'], {
      image: {
        id: 'image-ridge-1600x900-jpg',
        width: 1600,
        height: 900,
        aspectRatio: 16 / 9,
        alt: {zh: '晨光山脊', en: 'Ridge at dawn'},
      },
    });
    render(<MasonryGallery locale="zh" onOpen={onOpen} photos={[photo]} />);

    const image = screen.getByRole('img', {name: '晨光山脊'});
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

    await userEvent.click(screen.getByRole('button', {name: '晨光山脊'}));
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
