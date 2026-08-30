import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ModuleState } from '@/components/feedback';
import { Container, Section } from '@/components/layout';
import type { Locale, Profile } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import { ContactSection } from '@/features/contact';
import { routing } from '@/i18n/routing';

interface ContactPageProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('description') };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  let profile: Profile | null = null;
  try {
    profile = await createSanityRepositories().profile.getProfile();
  } catch {
    profile = null;
  }

  if (!profile) {
    return (
      <Container>
        <Section>
          <ModuleState
            description={t('errorDescription')}
            kind="error"
            locale={locale}
            title={t('errorTitle')}
          />
        </Section>
      </Container>
    );
  }

  return (
    <ContactSection headingLevel="h1" locale={locale} profile={profile} />
  );
}
