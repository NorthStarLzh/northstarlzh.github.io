import { createElement } from 'react';

import { Container, Section } from '@/components/layout';
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
  const guideItems = [
    messages.guideItems.topic,
    messages.guideItems.identity,
    messages.guideItems.expectation,
    messages.guideItems.context,
  ];

  return (
    <Section
      className={styles.contact}
      data-testid="contact-section"
      id="contact"
    >
      <Container size="narrow">
        <div className={styles.content}>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>{messages.eyebrow}</p>
            {createElement(
              headingLevel,
              { className: styles.title, 'data-heading-level': headingLevel },
              messages.title,
            )}
            <p className={styles.description}>{messages.description}</p>
          </header>

          <div className={styles.primary}>
            <div className={styles.identity}>
              <div className={styles.avatarFrame}>
                <picture>
                  <source
                    sizes="4rem"
                    srcSet={toSrcSet(avatar)}
                  />
                  <AppImage
                    alt={avatarAlt}
                    className={styles.avatar}
                    height={profile.avatar.height}
                    loading="eager"
                    sizes="4rem"
                    src={avatar.src}
                    unoptimized
                    width={profile.avatar.width}
                  />
                </picture>
              </div>
              <div>
                <p className={styles.nickname}>{profile.nickname}</p>
                <p className={styles.meta}>
                  <span>{profile.institution}</span>
                  <span aria-hidden="true" className={styles.metaSeparator}>·</span>
                  <span>{role}</span>
                </p>
              </div>
            </div>

            <a
              aria-label={`${messages.emailLabel}${labelSeparator}${email}`}
              className={styles.email}
              href={createMailtoHref(email)}
            >
              <span className={styles.emailAction}>{messages.emailAction}</span>
              <span className={styles.emailAddress}>{email}</span>
            </a>
          </div>

          <section className={styles.guide} aria-labelledby="contact-guide-title">
            <div className={styles.guideHeader}>
              <h2 id="contact-guide-title">{messages.guideTitle}</h2>
              <p>{messages.guideDescription}</p>
            </div>
            <ol className={styles.guideList}>
              {guideItems.map((item, index) => (
                <li key={item.title} className={styles.guideItem}>
                  <span aria-hidden="true" className={styles.guideNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className={styles.guideNote}>{messages.guideNote}</p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
