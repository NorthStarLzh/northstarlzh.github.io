'use client';

import { useState } from 'react';

import type { Locale, ResearchProject } from '@/content/contracts';

import { ResearchDialog } from './research-dialog';
import { ResearchGrid } from './research-grid';

export interface ResearchShowcaseProps {
  locale: Locale;
  projects: readonly ResearchProject[];
}

export function ResearchShowcase({ locale, projects }: ResearchShowcaseProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const projectIds = projects.map(({ id }) => id).join('\u0000');
  const [previousProjectIds, setPreviousProjectIds] = useState(projectIds);

  if (projectIds !== previousProjectIds) {
    setPreviousProjectIds(projectIds);
    if (activeProjectId && !projects.some(({ id }) => id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }

  const activeProject = activeProjectId
    ? projects.find(({ id }) => id === activeProjectId) ?? null
    : null;

  return (
    <>
      <ResearchGrid
        locale={locale}
        onOpen={setActiveProjectId}
        projects={projects}
      />
      <ResearchDialog
        locale={locale}
        onClose={() => setActiveProjectId(null)}
        project={activeProject}
      />
    </>
  );
}
