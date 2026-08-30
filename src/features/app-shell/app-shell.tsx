'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { Container } from '@/components/layout';
import { Dialog, IconButton } from '@/components/ui';
import type { Locale } from '@/content/contracts';
import { LocaleSwitcher } from '@/features/locale';
import { ThemeToggle } from '@/features/theme';

import type { NavigationItem } from './navigation';

const subscribeToHash = (onStoreChange: () => void) => {
  window.addEventListener('hashchange', onStoreChange);
  window.addEventListener('popstate', onStoreChange);

  return () => {
    window.removeEventListener('hashchange', onStoreChange);
    window.removeEventListener('popstate', onStoreChange);
  };
};

const getHashSnapshot = () => window.location.hash;
const getServerHashSnapshot = () => '';

function normalizedPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function isNavigationItemCurrent(
  item: NavigationItem,
  pathname: string,
): boolean {
  const itemPath = normalizedPath(item.href);
  const currentPath = normalizedPath(pathname);
  if (currentPath === itemPath) return true;

  // Section subpages keep their parent highlighted, e.g. /zh/photography stays
  // current on /zh/photography/landscape. The locale root (home) has no
  // subpages, so it only matches its exact path.
  const depth = itemPath.split('/').filter(Boolean).length;
  return depth > 1 && currentPath.startsWith(`${itemPath}/`);
}

interface NavigationLinksProps {
  navigation: NavigationItem[];
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  pathname: string;
}

function NavigationLinks({
  navigation,
  onNavigate,
  pathname,
}: NavigationLinksProps) {
  return (
    <ul className="app-shell__navigation-list">
      {navigation.map((item) => {
        const current = isNavigationItemCurrent(item, pathname);

        return (
          <li key={item.key}>
            <a
              aria-current={current ? 'page' : undefined}
              className="app-shell__navigation-link"
              href={item.href}
              onClick={onNavigate}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export interface AppShellProps {
  children: ReactNode;
  locale: Locale;
  navigation: NavigationItem[];
}

interface MobileNavigationProps {
  locale: Locale;
  navigation: NavigationItem[];
  pathname: string;
}

function MobileNavigation({
  locale,
  navigation,
  pathname,
}: MobileNavigationProps) {
  const t = useTranslations('navigation');
  const buttons = useTranslations('buttons');
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell__mobile-navigation">
      <Dialog
        className="app-shell__mobile-panel"
        closeLabel={buttons('closeMenu')}
        description={t('menuDescription')}
        onOpenChange={setOpen}
        open={open}
        title={t('menuTitle')}
        trigger={
          <IconButton
            label={buttons('openMenu')}
            size="sm"
            variant="ghost"
          >
            ☰
          </IconButton>
        }
      >
        <nav aria-label={t('mobileLabel')}>
          <NavigationLinks
            navigation={navigation}
            onNavigate={() => setOpen(false)}
            pathname={pathname}
          />
        </nav>
        <div className="app-shell__mobile-controls">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </div>
      </Dialog>
    </div>
  );
}

export function AppShell({ children, locale, navigation }: AppShellProps) {
  const pathname = usePathname();
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  );
  const t = useTranslations('navigation');
  const navigationLocation = `${pathname}${hash}`;
  const [scrolled, setScrolled] = useState(false);

  // The reference design floats the language/theme controls over the hero
  // media on the home page; elsewhere they use the regular page text color.
  const isHome = normalizedPath(pathname) === normalizedPath(`/${locale}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerClass = [
    'app-shell__header',
    scrolled ? 'app-shell__header--scrolled' : '',
  ].filter(Boolean).join(' ');

  const contentControlsClass = [
    'app-shell__content-controls',
    isHome ? 'app-shell__content-controls--over-media' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <a className="app-shell__skip-link" href="#main-content">
        {t('skipToMain')}
      </a>
      <div className="app-shell__shell">
        <aside className="app-shell__sidebar">
          <a className="app-shell__brand" href={`/${locale}`}>
            {t('brand')}
          </a>
          <nav className="app-shell__sidebar-nav" aria-label={t('primaryLabel')}>
            <NavigationLinks navigation={navigation} pathname={pathname} />
          </nav>
        </aside>
        <div className="app-shell__content">
          <div className={contentControlsClass}>
            <LocaleSwitcher locale={locale} />
            <ThemeToggle plain />
          </div>
          <header className={headerClass}>
            <Container className="app-shell__header-content" size="wide">
              <a className="app-shell__brand" href={`/${locale}`}>
                {t('brand')}
              </a>
              <MobileNavigation
                key={navigationLocation}
                locale={locale}
                navigation={navigation}
                pathname={pathname}
              />
            </Container>
          </header>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
