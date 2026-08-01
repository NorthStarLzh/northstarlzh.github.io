import { Container, Section, Stack } from '@/components/layout';
import type { Locale } from '@/content/contracts';
import { messagesByLocale } from '@/i18n/messages';

import { AwardList } from './award-list';
import { EducationTimeline } from './education-timeline';
import type { ResumeContent } from './load-resume-content';
import { ProfileSummary } from './profile-summary';
import { ResumeDownload } from './resume-download';
import styles from './resume.module.css';

export type ResumeVariant = 'full' | 'summary';

export interface ResumeModuleProps {
  avatarSrc?: string;
  avatarSrcSet?: string;
  content: ResumeContent;
  locale: Locale;
  variant?: ResumeVariant;
}

export function ResumeModule({
  avatarSrc,
  avatarSrcSet,
  content,
  locale,
  variant = 'full',
}: ResumeModuleProps) {
  const messages = messagesByLocale[locale];
  const compact = variant === 'summary';
  const density = compact ? 'compact' : 'full';

  return (
    <Section className={styles.module} data-resume-variant={variant}>
      <Container size={compact ? 'default' : 'wide'}>
        <Stack gap={compact ? 'xl' : '2xl'}>
          <header className={styles.moduleHeader}>
            {compact ? (
              <h2 className={styles.moduleTitle}>{messages.resume.summaryTitle}</h2>
            ) : (
              <h1 className={styles.moduleTitle}>{messages.resume.title}</h1>
            )}
            {!compact ? (
              <p className={styles.moduleDescription}>{messages.resume.description}</p>
            ) : null}
          </header>

          <ProfileSummary
            avatarSrc={avatarSrc}
            avatarSrcSet={avatarSrcSet}
            density={density}
            headingLevel={compact ? 'h3' : 'h2'}
            locale={locale}
            profile={content.profile}
          />
          <EducationTimeline
            density={density}
            entries={content.education}
            headingLevel={compact ? 'h3' : 'h2'}
            locale={locale}
          />
          <AwardList
            density={density}
            entries={content.awards}
            headingLevel={compact ? 'h3' : 'h2'}
            locale={locale}
          />
          <ResumeDownload
            locale={locale}
            resumeUrl={content.profile.resumeUrl}
          />
        </Stack>
      </Container>
    </Section>
  );
}

export type ResumeSummaryProps = Omit<ResumeModuleProps, 'variant'>;

export function ResumeSummary(props: ResumeSummaryProps) {
  return <ResumeModule {...props} variant="summary" />;
}
