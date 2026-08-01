import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale, ResearchProject } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import {
  loadResearchProjects,
  ResearchPanel,
  type ResearchPanelStatus,
} from '@/features/research';

interface ResearchPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'research' });

  let projects: ResearchProject[] = [];
  let status: ResearchPanelStatus = 'ready';

  try {
    projects = await loadResearchProjects(createSanityRepositories().research);
    status = projects.length > 0 ? 'ready' : 'empty';
  } catch {
    status = 'error';
  }

  return (
    <Container>
      <Section aria-labelledby="research-page-title">
        <Stack gap="xl">
          <header>
            <h1 id="research-page-title">{t('title')}</h1>
            <p>{t('description')}</p>
          </header>
          <ResearchPanel locale={locale} projects={projects} status={status} />
        </Stack>
      </Section>
    </Container>
  );
}
