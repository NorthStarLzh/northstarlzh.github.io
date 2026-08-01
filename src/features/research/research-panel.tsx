'use client';

import { useTranslations } from 'next-intl';

import { ModuleState } from '@/components/feedback';
import type { Locale, ResearchProject } from '@/content/contracts';

import { ResearchShowcase } from './research-showcase';

export type ResearchPanelStatus = 'ready' | 'loading' | 'empty' | 'error';

export interface ResearchPanelProps {
  locale: Locale;
  projects: readonly ResearchProject[];
  status: ResearchPanelStatus;
}

export function ResearchPanel({ locale, projects, status }: ResearchPanelProps) {
  const research = useTranslations('research');
  const loading = useTranslations('loading');

  if (status === 'loading') {
    return (
      <ModuleState
        description={research('description')}
        kind="loading"
        locale={locale}
        minHeight="18rem"
        title={loading('research')}
      />
    );
  }

  if (status === 'empty') {
    return (
      <ModuleState
        description={research('emptyDescription')}
        kind="empty"
        locale={locale}
        minHeight="18rem"
        title={research('emptyTitle')}
      />
    );
  }

  if (status === 'error') {
    return (
      <ModuleState
        description={research('errorDescription')}
        kind="error"
        locale={locale}
        minHeight="18rem"
        title={research('errorTitle')}
      />
    );
  }

  return <ResearchShowcase locale={locale} projects={projects} />;
}
