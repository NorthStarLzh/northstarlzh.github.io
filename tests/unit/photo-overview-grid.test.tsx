/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {PhotoOverviewGrid} from '@/features/photography';
import {createPhoto} from '@fixtures/domain';

afterEach(cleanup);

describe('PhotoOverviewGrid', () => {
  it('renders a dense contact sheet and opens the selected original', async () => {
    const onOpen = vi.fn();
    const photos = [
      createPhoto('overview-wide', ['landscape']),
      createPhoto('overview-tall', ['landscape']),
      createPhoto('overview-square', ['landscape']),
    ];

    render(<PhotoOverviewGrid locale="en" onOpen={onOpen} photos={photos} />);

    const grid = screen.getByTestId('photography-overview');
    expect(grid).toHaveClass('photography-overview');
    expect(grid.querySelectorAll('.photography-card')).toHaveLength(3);

    const first = screen.getByRole('button', {
      name: 'Fixture image image-overview-wide',
    });
    expect(first.querySelector('source')).toHaveAttribute(
      'sizes',
      '(min-width: 75rem) 16vw, (min-width: 48rem) 25vw, 34vw',
    );
    await userEvent.click(first);
    expect(onOpen).toHaveBeenCalledWith('overview-wide');
  });
});
