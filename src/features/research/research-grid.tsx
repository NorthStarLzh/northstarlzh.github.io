'use client';

import type { Locale, ResearchProject } from '@/content/contracts';

import { ResearchCard } from './research-card';

export interface ResearchGridProps {
  locale: Locale;
  onOpen: (projectId: string) => void;
  projects: readonly ResearchProject[];
}

export function ResearchGrid({ locale, onOpen, projects }: ResearchGridProps) {
  return (
    <div className="research-grid" data-testid="research-grid">
      {projects.map((project) => (
        <ResearchCard
          key={project.id}
          locale={locale}
          onOpen={onOpen}
          project={project}
        />
      ))}
    </div>
  );
}
