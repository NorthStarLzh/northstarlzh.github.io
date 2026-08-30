import { createElement } from 'react';

import { Container, Section, Stack } from '@/components/layout';
import { AppImage } from '@/components/ui';
import type { Locale, Profile } from '@/content/contracts';
import { isValidEmail } from '@/content/contracts';
import { buildHomeAvatarSources, toSrcSet } from '@/features/home';
import { localize } from '@/i18n/localize';
import { messagesByLocale } from '@/i18n/messages';

import styles from './contact.module.css';

const UNSAFE_MAILTO_CHARACTERS = /[?#\u0000-\u001f\u007f]/;

export function createMailtoHref(email: string): string {
  const normalized = email.trim();
  if (!isValidEmail(normalized) || UNSAFE_MAILTO_CHARACTERS.test(normalized)) {
    throw new TypeError('Contact email must be a valid email address.');
  }

  const encoded = encodeURIComponent(normalized).replace(/%40/gi, '@');
  return `mailto:${encoded}`;
}

export interface ContactSectionProps {
  headingLevel?: 'h1' | 'h2' | 'h3';
  locale: Locale;
  profile: Profile;
}

export function ContactSection({
  headingLevel = 'h2',
  locale,
  profile,
}: ContactSectionProps) {
  const email = profile.email.trim();
  const messages = messagesByLocale[locale].contact;
  const labelSeparator = locale === 'zh' ? '：' : ': ';
  const avatar = buildHomeAvatarSources(profile.avatar);
  const avatarAlt = localize(profile.avatar.alt, locale, {
    path: 'profile.avatar.alt',
  });
  const role = localize(profile.role, locale, { path: 'profile.role' });

  return (
    <Section
      className={styles.contact}
      data-testid="contact-section"
      id="contact"
    >
      <Container size="narrow">
        <Stack className={styles.content} gap="md">
          {createElement(
            headingLevel,
            { className: styles.title, 'data-heading-level': headingLevel },
            messages.title,
          )}
          <p className={styles.description}>{messages.description}</p>

          <div className={styles.identity}>
            <div className={styles.avatarFrame}>
              <picture>
                <source
                  sizes="(min-width: 48rem) 8rem, 6.5rem"
                  srcSet={toSrcSet(avatar)}
                />
                <AppImage
                  alt={avatarAlt}
                  className={styles.avatar}
                  height={profile.avatar.height}
                  loading="eager"
                  sizes="(min-width: 48rem) 8rem, 6.5rem"
                  src={avatar.src}
                  unoptimized
                  width={profile.avatar.width}
                />
              </picture>
            </div>
            <p className={styles.nickname}>{profile.nickname}</p>
            <p className={styles.meta}>
              {profile.institution}
              <span aria-hidden="true"> · </span>
              {role}
            </p>
          </div>

          <a
            aria-label={`${messages.emailLabel}${labelSeparator}${email}`}
            className={styles.email}
            href={createMailtoHref(email)}
          >
            {email}
          </a>
        </Stack>
      </Container>
    </Section>
  );
}
