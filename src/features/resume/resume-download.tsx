import { ButtonLink } from '@/components/ui';
import type { Locale } from '@/content/contracts';
import { messagesByLocale } from '@/i18n/messages';

import styles from './resume.module.css';

export const RESUME_DOWNLOAD_FILENAME = 'wind-flower-poetry-wine-tea-resume.pdf';

export interface ResumeDownloadProps {
  locale: Locale;
  resumeUrl: string;
}

export function createResumeDownloadUrl(resumeUrl: string): string | null {
  if (resumeUrl.trim().length === 0) return null;

  const url = new URL(resumeUrl);
  url.searchParams.set('dl', RESUME_DOWNLOAD_FILENAME);
  return url.toString();
}

export function ResumeDownload({ locale, resumeUrl }: ResumeDownloadProps) {
  const messages = messagesByLocale[locale];
  const downloadUrl = createResumeDownloadUrl(resumeUrl);

  return (
    <div className={styles.download}>
      {downloadUrl ? (
        <ButtonLink
          download={RESUME_DOWNLOAD_FILENAME}
          href={downloadUrl}
          size="lg"
        >
          {messages.download.resume}
        </ButtonLink>
      ) : (
        <p className={styles.downloadUnavailable} role="status">
          {messages.download.unavailable}
        </p>
      )}
    </div>
  );
}
