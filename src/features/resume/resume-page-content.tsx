import {ModuleState} from '@/components/feedback';
import {Container, Section, Stack} from '@/components/layout';
import type {Locale} from '@/content/contracts';
import {messagesByLocale} from '@/i18n/messages';

import {RESUME_DOWNLOAD_FILENAME} from './resume-download';
import styles from './resume.module.css';

export const PORTFOLIO_DOWNLOAD_FILENAME =
  'wind-flower-poetry-wine-tea-portfolio.pdf';

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

/** 参考图设计：页面仅展示两个下载卡片（个人作品集 / 个人简历）。 */
export async function renderResumePage(locale: Locale) {
  const messages = messagesByLocale[locale];

  return (
    <Section className={styles.page}>
      <Container size="wide">
        <Stack gap="2xl">
          <h1 className={styles.srOnly}>{messages.resume.title}</h1>
          <div className={styles.cards}>
            <article className={styles.card}>
              <div className={styles.cardPreview}>
                <iframe
                  aria-label={messages.download.portfolioPreview}
                  loading="lazy"
                  src="/portfolio.pdf"
                  title={messages.download.portfolioPreview}
                />
              </div>
              <h2 className={styles.cardTitle}>
                {messages.download.portfolioTitle}
              </h2>
              <a
                aria-label={messages.download.portfolioAria}
                className={styles.cardLink}
                download={PORTFOLIO_DOWNLOAD_FILENAME}
                href="/portfolio.pdf"
              >
                {messages.download.portfolio}
              </a>
            </article>
            <article className={styles.card}>
              <div className={styles.cardPreview}>
                <iframe
                  aria-label={messages.download.resumePreview}
                  loading="lazy"
                  src="/resume.pdf"
                  title={messages.download.resumePreview}
                />
              </div>
              <h2 className={styles.cardTitle}>
                {messages.download.resumeTitle}
              </h2>
              <a
                aria-label={messages.download.resumeAria}
                className={styles.cardLink}
                download={RESUME_DOWNLOAD_FILENAME}
                href="/resume.pdf"
              >
                {messages.download.resume}
              </a>
            </article>
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
