import { createElement } from 'react';

import { ModuleState } from '@/components/feedback';
import { Container, Section } from '@/components/layout';
import { AppImage } from '@/components/ui';
import type { Locale } from '@/content/contracts';
import { messagesByLocale } from '@/i18n/messages';

import { RESUME_DOWNLOAD_FILENAME } from './resume-download';
import styles from './resume.module.css';

export const PORTFOLIO_DOWNLOAD_FILENAME =
  'wind-flower-poetry-wine-tea-portfolio.pdf';

interface ResumeDocumentCardProps {
  downloadFilename: string;
  downloadLabel: string;
  downloadUrl: string;
  previewAlt: string;
  previewHeight: number;
  previewSrc: string;
  previewWidth: number;
  title: string;
  titleHeadingLevel: ResumeDocumentHeadingLevel;
}

export type ResumeDocumentHeadingLevel = 'h1' | 'h2' | 'h3';

function getCardHeadingLevel(
  headingLevel: ResumeDocumentHeadingLevel,
): ResumeDocumentHeadingLevel {
  if (headingLevel === 'h1') return 'h2';
  return 'h3';
}

function ResumeDocumentCard({
  downloadFilename,
  downloadLabel,
  downloadUrl,
  previewAlt,
  previewHeight,
  previewSrc,
  previewWidth,
  title,
  titleHeadingLevel,
}: ResumeDocumentCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardPreview}>
        <AppImage
          alt={previewAlt}
          className={styles.cardPreviewImage}
          height={previewHeight}
          loading="eager"
          sizes="(min-width: 48rem) 32rem, calc(100vw - 3rem)"
          src={previewSrc}
          unoptimized
          width={previewWidth}
        />
      </div>
      {createElement(titleHeadingLevel, { className: styles.cardTitle }, title)}
      <a
        aria-label={downloadLabel}
        className={styles.cardLink}
        download={downloadFilename}
        href={downloadUrl}
      >
        {downloadLabel}
      </a>
    </article>
  );
}

export interface ResumeDocumentPreviewsProps {
  headingLevel?: ResumeDocumentHeadingLevel;
  locale: Locale;
}

/** 作品集与个人简历的静态封面预览和直接下载入口。 */
export function ResumeDocumentPreviews({
  headingLevel = 'h2',
  locale,
}: ResumeDocumentPreviewsProps) {
  const messages = messagesByLocale[locale];
  const cardHeadingLevel = getCardHeadingLevel(headingLevel);

  return (
    <section aria-labelledby="cv-title" className={styles.documents} id="cv">
      <header className={styles.documentsHeader}>
        <p className="eds-eyebrow">{messages.about.cvEyebrow}</p>
        {createElement(
          headingLevel,
          { className: styles.documentsTitle, id: 'cv-title' },
          messages.about.cvTitle,
        )}
        <p className={styles.documentsDescription}>{messages.about.cvDescription}</p>
      </header>
      <div className={styles.cards}>
        <ResumeDocumentCard
          downloadFilename={PORTFOLIO_DOWNLOAD_FILENAME}
          downloadLabel={messages.download.portfolioAria}
          downloadUrl="/portfolio.pdf"
          previewAlt={messages.download.portfolioPreview}
          previewHeight={1080}
          previewSrc="/portfolio-preview.webp"
          previewWidth={1920}
          title={messages.download.portfolioTitle}
          titleHeadingLevel={cardHeadingLevel}
        />
        <ResumeDocumentCard
          downloadFilename={RESUME_DOWNLOAD_FILENAME}
          downloadLabel={messages.download.resumeAria}
          downloadUrl="/resume.pdf"
          previewAlt={messages.download.resumePreview}
          previewHeight={1700}
          previewSrc="/resume-preview.webp"
          previewWidth={1206}
          title={messages.download.resumeTitle}
          titleHeadingLevel={cardHeadingLevel}
        />
      </div>
    </section>
  );
}

export function ResumeErrorState({locale}: {locale: Locale}) {
  const messages = messagesByLocale[locale].resume;
  return (
    <Section>
      <Container size="narrow">
        <ModuleState
          description={messages.errorDescription}
          kind="error"
          locale={locale}
          title={messages.errorTitle}
        />
      </Container>
    </Section>
  );
}
