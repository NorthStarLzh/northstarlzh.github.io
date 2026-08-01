'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type MouseEvent,
  type ReactNode,
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
  hash: string,
): boolean {
  const [hrefPath, hrefHash = ''] = item.href.split('#');
  if (normalizedPath(hrefPath) !== normalizedPath(pathname)) return false;

  if (item.key === 'contact') return hash === `#${hrefHash}`;
  if (item.key === 'home') return hash !== '#contact';
  return true;
}

interface NavigationLinksProps {
  hash: string;
  navigation: NavigationItem[];
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  pathname: string;
}

function NavigationLinks({
  hash,
  navigation,
  onNavigate,
  pathname,
}: NavigationLinksProps) {
  return (
    <ul className="app-shell__navigation-list">
      {navigation.map((item) => {
        const current = isNavigationItemCurrent(item, pathname, hash);

        return (
          <li key={item.key}>
            <a
              aria-current={
                current
                  ? item.key === 'contact'
                    ? 'location'
                    : 'page'
                  : undefined
              }
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
  hash: string;
  locale: Locale;
  navigation: NavigationItem[];
  pathname: string;
}

function MobileNavigation({
  hash,
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
            hash={hash}
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

  return (
    <>
      <a className="app-shell__skip-link" href="#main-content">
        {t('skipToMain')}
      </a>
      <header className="app-shell__header">
        <Container className="app-shell__header-content" size="wide">
          <a className="app-shell__brand" href={`/${locale}`}>
            {t('brand')}
          </a>

          <div className="app-shell__desktop-navigation">
            <nav aria-label={t('primaryLabel')}>
              <NavigationLinks
                hash={hash}
                navigation={navigation}
                pathname={pathname}
              />
            </nav>
            <div className="app-shell__controls">
              <LocaleSwitcher locale={locale} />
              <ThemeToggle />
            </div>
          </div>

          <MobileNavigation
            hash={hash}
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
    </>
  );
}
