import type { Locale } from '@/content/contracts';

export type NavigationKey =
  | 'home'
  | 'about'
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
  key: NavigationKey;
  path: '' | '/about' | '/photography' | '/research' | '/resume' | '/contact';
}

const NAVIGATION_DEFINITIONS = [
  { key: 'home', path: '' },
  { key: 'about', path: '/about' },
  { key: 'photography', path: '/photography' },
  { key: 'research', path: '/research' },
  { key: 'resume', path: '/resume' },
  { key: 'contact', path: '/contact' },
] as const satisfies readonly NavigationDefinition[];

export type NavigationLabelResolver = (key: NavigationKey) => string;

export function createNavigation(
  locale: Locale,
  resolveLabel: NavigationLabelResolver,
): NavigationItem[] {
  return NAVIGATION_DEFINITIONS.map((definition) => ({
    href: `/${locale}${definition.path}`,
    key: definition.key,
    label: resolveLabel(definition.key),
  }));
}
