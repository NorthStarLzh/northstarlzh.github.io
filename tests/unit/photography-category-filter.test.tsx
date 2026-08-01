/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';

import {CategoryFilter} from '@/features/photography';

afterEach(cleanup);

describe('CategoryFilter', () => {
  it('renders links to category index pages with the active category marked', () => {
    render(
      <CategoryFilter
        activeCategory="landscape"
        labels={{landscape: '风光', portrait: '人像'}}
        locale="zh"
      />,
    );

    const landscapeLink = screen.getByRole('link', {name: '风光'});
    expect(landscapeLink).toHaveAttribute('href', '/zh/photography/landscape/#gallery');
    expect(landscapeLink).toHaveAttribute('aria-current', 'true');

    const portraitLink = screen.getByRole('link', {name: '人像'});
    expect(portraitLink).toHaveAttribute('href', '/zh/photography/portrait/#gallery');
    expect(portraitLink).not.toHaveAttribute('aria-current');
  });

  it('marks portrait as active when selected', () => {
    render(
      <CategoryFilter
        activeCategory="portrait"
        labels={{landscape: 'Landscape', portrait: 'Portrait'}}
        locale="en"
      />,
    );

    expect(screen.getByRole('link', {name: 'Landscape'})).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', {name: 'Portrait'})).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', {name: 'Portrait'})).toHaveAttribute(
      'href',
      '/en/photography/portrait/#gallery',
    );
  });
});
