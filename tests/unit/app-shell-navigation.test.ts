import { describe, expect, it, vi } from 'vitest';

import {
  createNavigation,
  isNavigationItemCurrent,
  type NavigationKey,
} from '@/features/app-shell';

const labels: Record<NavigationKey, string> = {
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
      ['/zh', '/zh/photography', '/zh/research', '/zh/resume', '/zh#contact'],
    ],
    [
      'en',
      ['/en', '/en/photography', '/en/research', '/en/resume', '/en#contact'],
    ],
  ] as const)('builds the complete %s navigation', (locale, expectedHrefs) => {
    const navigation = createNavigation(locale, (key) => labels[key]);

    expect(navigation.map(({ key }) => key)).toEqual([
      'home',
      'photography',
      'research',
      'resume',
      'contact',
    ]);
    expect(navigation.map(({ href }) => href)).toEqual(expectedHrefs);
    expect(navigation.map(({ label }) => label)).toEqual([
      'Home',
      'Photography',
      'Research',
      'Résumé',
      'Contact',
    ]);
  });

  it('resolves every label once instead of embedding copy in components', () => {
    const resolveLabel = vi.fn((key: NavigationKey) => labels[key]);

    createNavigation('zh', resolveLabel);

    expect(resolveLabel).toHaveBeenCalledTimes(5);
    expect(resolveLabel.mock.calls.flat()).toEqual([
      'home',
      'photography',
      'research',
      'resume',
      'contact',
    ]);
  });

  it('derives current page and contact state from the URL without module state', () => {
    const navigation = createNavigation('zh', (key) => labels[key]);
    const [home, photography, , , contact] = navigation;

    expect(isNavigationItemCurrent(home, '/zh/', '')).toBe(true);
    expect(isNavigationItemCurrent(home, '/zh', '#contact')).toBe(false);
    expect(
      isNavigationItemCurrent(photography, '/zh/photography/', ''),
    ).toBe(true);
    expect(isNavigationItemCurrent(photography, '/zh/research', '')).toBe(
      false,
    );
    expect(isNavigationItemCurrent(contact, '/zh', '#contact')).toBe(true);
    expect(isNavigationItemCurrent(contact, '/en', '#contact')).toBe(false);
  });
});
