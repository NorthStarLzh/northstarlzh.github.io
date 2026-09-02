import {ModuleState} from '@/components/feedback';
import {Container, Section, Stack} from '@/components/layout';
import {AppImage} from '@/components/ui';
import type {Locale} from '@/content/contracts';
import {messagesByLocale} from '@/i18n/messages';

import {RESUME_DOWNLOAD_FILENAME} from './resume-download';
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
      <h2 className={styles.cardTitle}>{title}</h2>
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

/** 两张静态封面预览与直接下载链接，不嵌入 PDF 阅读器。 */
export async function renderResumePage(locale: Locale) {
  const messages = messagesByLocale[locale];

  return (
    <Section className={styles.page}>
      <Container size="wide">
        <Stack gap="2xl">
          <h1 className={styles.srOnly}>{messages.resume.title}</h1>
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
            />
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
