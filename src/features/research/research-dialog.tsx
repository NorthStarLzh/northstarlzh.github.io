'use client';

import { useTranslations } from 'next-intl';

import { Dialog } from '@/components/ui';
import type { Locale, ResearchProject } from '@/content/contracts';
import { localize } from '@/i18n/localize';

import { ResearchImage } from './research-image';

export interface ResearchDialogProps {
  locale: Locale;
  onClose: () => void;
  project: ResearchProject | null;
}

export function ResearchDialog({ locale, onClose, project }: ResearchDialogProps) {
  const t = useTranslations('research');
  const dialogs = useTranslations('dialogs');

  if (!project) return null;

  const title = localize(project.title, locale, {
    path: `researchProject.${project.id}.title`,
  });
  const summary = localize(project.summary, locale, {
    path: `researchProject.${project.id}.summary`,
  });

  return (
    <Dialog
      className="research-dialog"
      closeLabel={dialogs('close')}
      description={project.period}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title={title}
    >
      <div className="research-dialog__content">
        <p className="research-dialog__summary">{summary}</p>
        <div
          className="research-dialog__images"
          data-image-count={project.images.length}
        >
          {project.images.map((image) => (
            <ResearchImage
              className="research-dialog__image"
              image={image}
              key={image.id}
              locale={locale}
              loading="lazy"
              path={`researchProject.${project.id}.images.${image.id}.alt`}
              sizes="(min-width: 48rem) 42rem, calc(100vw - 3rem)"
            />
          ))}
        </div>
        <section aria-labelledby={`research-papers-${project.id}`}>
          <h3 id={`research-papers-${project.id}`}>{t('papers')}</h3>
          {project.papers.length > 0 ? (
            <ul className="research-dialog__papers">
              {project.papers.map((paper) => (
                <li key={paper.id}>
                  {localize(paper.title, locale, {
                    path: `researchProject.${project.id}.papers.${paper.id}.title`,
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('noPapers')}</p>
          )}
        </section>
      </div>
    </Dialog>
  );
}
