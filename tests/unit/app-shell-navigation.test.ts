import { describe, expect, it, vi } from 'vitest';

import {
  createNavigation,
  isNavigationItemCurrent,
  type NavigationKey,
} from '@/features/app-shell';

const labels: Record<NavigationKey, string> = {
  about: 'About',
  contact: 'Contact',
  home: 'Home',
  photography: 'Photography',
  research: 'Research',
  resume: 'Résumé',
};

describe('application navigation configuration', () => {
  it.each([
    [
      'zh',
      [
        '/zh',
        '/zh/about',
        '/zh/photography',
        '/zh/research',
        '/zh/resume',
        '/zh/contact',
      ],
    ],
    [
      'en',
      [
        '/en',
        '/en/about',
        '/en/photography',
        '/en/research',
        '/en/resume',
        '/en/contact',
      ],
    ],
  ] as const)('builds the complete %s navigation', (locale, expectedHrefs) => {
    const navigation = createNavigation(locale, (key) => labels[key]);

    expect(navigation.map(({ key }) => key)).toEqual([
      'home',
      'about',
      'photography',
      'research',
      'resume',
      'contact',
    ]);
    expect(navigation.map(({ href }) => href)).toEqual(expectedHrefs);
    expect(navigation.map(({ label }) => label)).toEqual([
      'Home',
      'About',
      'Photography',
      'Research',
      'Résumé',
      'Contact',
    ]);
  });

  it('resolves every label once instead of embedding copy in components', () => {
    const resolveLabel = vi.fn((key: NavigationKey) => labels[key]);

    createNavigation('zh', resolveLabel);

    expect(resolveLabel).toHaveBeenCalledTimes(6);
    expect(resolveLabel.mock.calls.flat()).toEqual([
      'home',
      'about',
      'photography',
      'research',
      'resume',
      'contact',
    ]);
  });

  it('derives the current page from the URL path without module state', () => {
    const navigation = createNavigation('zh', (key) => labels[key]);
    const [home, , photography, , , contact] = navigation;

    expect(isNavigationItemCurrent(home, '/zh/')).toBe(true);
    expect(isNavigationItemCurrent(home, '/zh/contact')).toBe(false);
    expect(isNavigationItemCurrent(photography, '/zh/photography/')).toBe(
      true,
    );
    expect(isNavigationItemCurrent(photography, '/zh/research')).toBe(false);
    expect(isNavigationItemCurrent(contact, '/zh/contact')).toBe(true);
    expect(isNavigationItemCurrent(contact, '/en/contact')).toBe(false);
  });

  it('keeps a section highlighted on its subpages', () => {
    const navigation = createNavigation('zh', (key) => labels[key]);
    const photography = navigation[2];

    expect(
      isNavigationItemCurrent(photography, '/zh/photography/landscape'),
    ).toBe(true);
    expect(
      isNavigationItemCurrent(photography, '/zh/photography/portrait'),
    ).toBe(true);
    expect(
      isNavigationItemCurrent(photography, '/zh/photography/collections'),
    ).toBe(true);
    expect(isNavigationItemCurrent(photography, '/zh/photograph')).toBe(false);
  });
});
