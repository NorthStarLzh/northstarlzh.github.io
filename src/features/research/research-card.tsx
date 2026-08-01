'use client';

import type { Locale, ResearchProject } from '@/content/contracts';
import { localize } from '@/i18n/localize';

import { ResearchImage } from './research-image';

export interface ResearchCardProps {
  locale: Locale;
  onOpen: (projectId: string) => void;
  project: ResearchProject;
}

export function ResearchCard({ locale, onOpen, project }: ResearchCardProps) {
  const title = localize(project.title, locale, {
    path: `researchProject.${project.id}.title`,
  });

  return (
    <article className="research-card">
      <button
        className="research-card__button"
        onClick={() => onOpen(project.id)}
        type="button"
      >
        <ResearchImage
          className="research-card__image"
          image={project.images[0]}
          locale={locale}
          loading="lazy"
          path={`researchProject.${project.id}.images.0.alt`}
          sizes="(min-width: 75rem) 25vw, (min-width: 48rem) 50vw, 100vw"
        />
        <span className="research-card__body">
          <span className="research-card__title">{title}</span>
          <span className="research-card__period">{project.period}</span>
        </span>
      </button>
    </article>
  );
}
