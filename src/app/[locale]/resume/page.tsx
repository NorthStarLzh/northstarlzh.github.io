import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale } from '@/content/contracts';

interface ResumePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ResumePage({ params }: ResumePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  const target = `/${locale}/about#cv`;

  return (
    <>
      <meta content={`0; url=${target}`} httpEquiv="refresh" />
      <Container size="narrow">
        <Section aria-labelledby="legacy-resume-title">
          <Stack gap="md">
            <h1 className="eds-section-title" id="legacy-resume-title">
              {t('legacyResumeTitle')}
            </h1>
            <p className="eds-section-description">{t('legacyResumeDescription')}</p>
            <a className="eds-text-link" href={target}>
              {t('legacyResumeAction')}
            </a>
          </Stack>
        </Section>
      </Container>
    </>
  );
}
