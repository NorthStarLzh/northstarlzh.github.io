import { Container, Section, Stack } from '@/components/layout';
import type { Locale } from '@/content/contracts';
import { isValidEmail } from '@/content/contracts';
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
  email: string;
  locale: Locale;
}

export function ContactSection({ email, locale }: ContactSectionProps) {
  const normalizedEmail = email.trim();
  const messages = messagesByLocale[locale].contact;
  const labelSeparator = locale === 'zh' ? '：' : ': ';

  return (
    <Section className={styles.contact} id="contact">
      <Container size="narrow">
        <Stack className={styles.content} gap="md">
          <h2 className={styles.title}>{messages.title}</h2>
          <p className={styles.description}>{messages.description}</p>
          <a
            aria-label={`${messages.emailLabel}${labelSeparator}${normalizedEmail}`}
            className={styles.email}
            href={createMailtoHref(normalizedEmail)}
          >
            {normalizedEmail}
          </a>
        </Stack>
      </Container>
    </Section>
  );
}
