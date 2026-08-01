/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppImage, Skeleton, SkeletonText } from '@/components/ui';

afterEach(cleanup);

describe('AppImage', () => {
  it('keeps dimensions, alt text and loading strategy explicit', () => {
    render(
      <AppImage
        alt="Mountain ridge at dawn"
        height={800}
        loading="lazy"
        sizes="(min-width: 75rem) 50vw, 100vw"
        src="/ridge.jpg"
        width={1200}
      />,
    );

    const image = screen.getByRole('img', { name: 'Mountain ridge at dawn' });
    expect(image).toHaveAttribute('width', '1200');
    expect(image).toHaveAttribute('height', '800');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('sizes', '(min-width: 75rem) 50vw, 100vw');
    expect(image).toHaveClass('ds-app-image');
  });

  it('rejects invalid dimensions instead of causing layout instability', () => {
    expect(() =>
      render(
        <AppImage
          alt="Invalid"
          height={0}
          loading="eager"
          sizes="100vw"
          src="/invalid.jpg"
          width={100}
        />,
      ),
    ).toThrow(RangeError);
  });
});

describe('Skeleton', () => {
  it('reserves dimensions matching media and cards', () => {
    render(
      <>
        <Skeleton
          aspectRatio="3 / 2"
          data-testid="media-skeleton"
          variant="media"
          width="30rem"
        />
        <Skeleton data-testid="card-skeleton" height="22rem" variant="card" />
        <SkeletonText lines={3} />
      </>,
    );

    expect(screen.getByTestId('media-skeleton')).toHaveStyle({
      '--skeleton-aspect-ratio': '3 / 2',
      '--skeleton-width': '30rem',
    });
    expect(screen.getByTestId('card-skeleton')).toHaveStyle({
      '--skeleton-height': '22rem',
    });
    expect(document.querySelectorAll('[data-skeleton-lines="3"] .ds-skeleton')).toHaveLength(3);
  });

  it.each([0, -2, Number.NaN, Number.POSITIVE_INFINITY])(
    'keeps an invalid line count (%s) to one stable placeholder',
    (lines) => {
      const { unmount } = render(<SkeletonText lines={lines} />);

      expect(document.querySelectorAll('[data-skeleton-lines="1"] .ds-skeleton')).toHaveLength(1);
      unmount();
    },
  );
});
