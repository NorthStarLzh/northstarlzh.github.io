import {describe, expect, it} from 'vitest';

import {buildViewerImageSources} from '@/features/photography';
import {createImageAsset} from '@fixtures/domain';

describe('photo viewer image sources', () => {
  it('builds bounded large variants without using the original asset URL', () => {
    const image = createImageAsset('image-abc123-3200x2000-jpg', {
      width: 3200,
      height: 2000,
    });

    const result = buildViewerImageSources(image, {
      projectId: 'project1',
      dataset: 'production',
    });

    expect(result.src).toBe(
      'https://cdn.sanity.io/images/project1/production/abc123-3200x2000.jpg?auto=format&fit=max&w=2560',
    );
    expect(result.src).not.toBe(
      'https://cdn.sanity.io/images/project1/production/abc123-3200x2000.jpg',
    );
    expect(result.srcSet.map(({width}) => width)).toEqual([1280, 1920, 2560]);
    expect(result.srcSet[2]).toEqual({
      src: result.src,
      width: 2560,
      height: 1600,
    });
  });

  it('uses a transformed placeholder when the asset id or configuration is invalid', () => {
    const result = buildViewerImageSources(createImageAsset('fixture-image'), {});

    expect(result.src).toBe('/photography-viewer-placeholder.svg?fit=max&w=1600');
    expect(result.srcSet).toEqual([
      {
        src: '/photography-viewer-placeholder.svg?fit=max&w=1280',
        width: 1280,
        height: 800,
      },
      {
        src: '/photography-viewer-placeholder.svg?fit=max&w=1600',
        width: 1600,
        height: 1000,
      },
    ]);
  });
});
