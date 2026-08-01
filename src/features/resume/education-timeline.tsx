import { useId } from 'react';

import type { EducationEntry, Locale } from '@/content/contracts';
import { localize } from '@/i18n/localize';
import { messagesByLocale } from '@/i18n/messages';

import { orderedByCmsOrder } from './order';
import type { ResumeDensity } from './profile-summary';
import styles from './resume.module.css';

export interface EducationTimelineProps {
  density?: ResumeDensity;
  entries: readonly EducationEntry[];
  headingLevel?: 'h2' | 'h3';
  locale: Locale;
}

export function EducationTimeline({
  density = 'full',
  entries,
  headingLevel: Heading = 'h2',
  locale,
}: EducationTimelineProps) {
  const headingId = useId();
  const messages = messagesByLocale[locale];
  const orderedEntries = orderedByCmsOrder(entries);
  const ItemHeading = Heading === 'h3' ? 'h4' : 'h3';

  return (
    <section
      aria-labelledby={headingId}
      className={styles.resumeSection}
      data-density={density}
    >
      <Heading className={styles.sectionTitle} id={headingId}>
        {messages.resume.educationTitle}
      </Heading>
      {orderedEntries.length === 0 ? (
        <p className={styles.emptyMessage}>{messages.empty.education}</p>
      ) : (
        <ol className={styles.timeline}>
          {orderedEntries.map((entry) => (
            <li className={styles.timelineEntry} key={entry.id}>
              <div className={styles.entryHeader}>
                <ItemHeading className={styles.entryTitle}>
                  {localize(entry.institution, locale, {
                    path: `education.${entry.id}.institution`,
                  })}
                </ItemHeading>
                <span className={styles.entryDate}>{entry.period}</span>
              </div>
              <p className={styles.entryDescription}>
                {localize(entry.description, locale, {
                  path: `education.${entry.id}.description`,
                })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
