import { Container } from '@/components/layout';
import type { Locale } from '@/content/contracts';
import { isValidEmail } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import { createMailtoHref } from '@/features/contact';
import { messagesByLocale } from '@/i18n/messages';

import type { NavigationItem } from './navigation';

const FOOTER_NAV_KEYS = new Set(['about', 'photography', 'research', 'resume']);

export interface AppFooterProps {
  locale: Locale;
  navigation: NavigationItem[];
}

export async function AppFooter({ locale, navigation }: AppFooterProps) {
  const messages = messagesByLocale[locale];
  const brand = messages.navigation.brand;

  let email: string | undefined;
  try {
    const profile = await createSanityRepositories().profile.getProfile();
    if (isValidEmail(profile.email)) email = profile.email;
  } catch {
    email = undefined;
  }

  let mailto: string | undefined;
  if (email) {
    try {
      mailto = createMailtoHref(email);
    } catch {
      mailto = undefined;
    }
  }

  const links = navigation.filter((item) => FOOTER_NAV_KEYS.has(item.key));

  return (
    <footer className="app-footer">
      <Container className="app-footer__content">
        <div className="app-footer__top">
          <div className="app-footer__identity">
            <p className="app-footer__brand">{brand}</p>
            <p className="app-footer__tagline">{messages.footer.tagline}</p>
          </div>
          <div className="app-footer__links">
            <nav aria-label={messages.footer.navLabel} className="app-footer__nav">
              {links.map((item) => (
                <a className="app-footer__link" href={item.href} key={item.key}>
                  {item.label}
                </a>
              ))}
            </nav>
            {mailto ? (
              <a className="app-footer__email" href={mailto}>
                {email}
              </a>
            ) : null}
          </div>
        </div>
        <p className="app-footer__legal">
          © {new Date().getFullYear()} {brand} · {messages.footer.rights}
        </p>
      </Container>
    </footer>
  );
}
