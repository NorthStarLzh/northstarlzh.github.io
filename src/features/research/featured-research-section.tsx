'use client';

import { useTranslations } from 'next-intl';

import { Container, Section, Stack } from '@/components/layout';
import type { Locale, ResearchProject } from '@/content/contracts';

import { ResearchPanel } from './research-panel';

export interface FeaturedResearchSectionProps {
  locale: Locale;
  projects: readonly ResearchProject[];
}

export function FeaturedResearchSection({
  locale,
  projects,
}: FeaturedResearchSectionProps) {
  const t = useTranslations('research');
  const featuredProjects = projects.slice(0, 3);

  return (
    <Section aria-labelledby="featured-research-title">
      <Container>
        <Stack gap="lg">
          <div className="eds-section-head">
            <p className="eds-eyebrow">{t('eyebrow')}</p>
            <h2 className="eds-section-title" id="featured-research-title">{t('featuredTitle')}</h2>
            <p className="eds-section-description">{t('featuredDescription')}</p>
          </div>
          <ResearchPanel
            locale={locale}
            projects={featuredProjects}
            status={featuredProjects.length > 0 ? 'ready' : 'empty'}
          />
        </Stack>
      </Container>
    </Section>
  );
}
