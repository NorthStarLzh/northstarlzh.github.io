import type { Locale } from '@/content/contracts';

export type NavigationKey =
  | 'home'
  | 'photography'
  | 'research'
  | 'resume'
  | 'contact';

export interface NavigationItem {
  key: NavigationKey;
  href: string;
  label: string;
}

interface NavigationDefinition {
  hash?: '#contact';
  key: NavigationKey;
  path: '' | '/photography' | '/research' | '/resume';
}

const NAVIGATION_DEFINITIONS = [
  { key: 'home', path: '' },
  { key: 'photography', path: '/photography' },
  { key: 'research', path: '/research' },
  { key: 'resume', path: '/resume' },
  { hash: '#contact', key: 'contact', path: '' },
] as const satisfies readonly NavigationDefinition[];

export type NavigationLabelResolver = (key: NavigationKey) => string;

export function createNavigation(
  locale: Locale,
  resolveLabel: NavigationLabelResolver,
): NavigationItem[] {
  return NAVIGATION_DEFINITIONS.map((definition) => {
    const hash = 'hash' in definition ? definition.hash : '';

    return {
      href: `/${locale}${definition.path}${hash}`,
      key: definition.key,
      label: resolveLabel(definition.key),
    };
  });
}
