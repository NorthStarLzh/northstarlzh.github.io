'use client';

import { useLocale } from 'next-intl';

import { Container, Section } from '@/components/layout';
import type { Locale } from '@/content/contracts';

import { ResearchPanel } from './research-panel';

export function ResearchLoading() {
  const locale = useLocale() as Locale;

  return (
    <Container>
      <Section>
        <ResearchPanel locale={locale} projects={[]} status="loading" />
      </Section>
    </Container>
  );
}
