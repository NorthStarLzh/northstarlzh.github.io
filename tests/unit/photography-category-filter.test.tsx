/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';

import {CategoryFilter} from '@/features/photography';

afterEach(cleanup);

const zhLabels = {landscape: '风光', portrait: '人像', collections: '合集'};
const enLabels = {landscape: 'Landscape', portrait: 'Portrait', collections: 'Collections'};

describe('CategoryFilter', () => {
  it('renders links to category index pages with the active category marked', () => {
    render(
      <CategoryFilter
        activeCategory="landscape"
        labels={zhLabels}
        locale="zh"
      />,
    );

    const landscapeLink = screen.getByRole('link', {name: '风光'});
    expect(landscapeLink).toHaveAttribute('href', '/zh/photography/landscape/');
    expect(landscapeLink).toHaveAttribute('aria-current', 'true');

    const portraitLink = screen.getByRole('link', {name: '人像'});
    expect(portraitLink).toHaveAttribute('href', '/zh/photography/portrait/');
    expect(portraitLink).not.toHaveAttribute('aria-current');
  });

  it('marks portrait as active when selected', () => {
    render(
      <CategoryFilter
        activeCategory="portrait"
        labels={enLabels}
        locale="en"
      />,
    );

    expect(screen.getByRole('link', {name: 'Landscape'})).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', {name: 'Portrait'})).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', {name: 'Portrait'})).toHaveAttribute(
      'href',
      '/en/photography/portrait/',
    );
  });

  it('always links to the collections list and marks it active on collection pages', () => {
    const {unmount} = render(
      <CategoryFilter
        activeCategory="landscape"
        labels={zhLabels}
        locale="zh"
      />,
    );

    const collectionsLink = screen.getByRole('link', {name: '合集'});
    expect(collectionsLink).toHaveAttribute('href', '/zh/photography/collections/');
    expect(collectionsLink).not.toHaveAttribute('aria-current');

    unmount();

    render(
      <CategoryFilter
        activeCategory="collections"
        labels={zhLabels}
        locale="zh"
      />,
    );
    expect(screen.getByRole('link', {name: '合集'})).toHaveAttribute('aria-current', 'true');
  });
});
