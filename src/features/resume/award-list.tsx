import { useId } from 'react';

import type { AwardEntry, Locale } from '@/content/contracts';
import { localize } from '@/i18n/localize';
import { messagesByLocale } from '@/i18n/messages';

import { orderedByCmsOrder } from './order';
import type { ResumeDensity } from './profile-summary';
import styles from './resume.module.css';

export interface AwardListProps {
  density?: ResumeDensity;
  entries: readonly AwardEntry[];
  headingLevel?: 'h2' | 'h3';
  locale: Locale;
}

export function AwardList({
  density = 'full',
  entries,
  headingLevel: Heading = 'h2',
  locale,
}: AwardListProps) {
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
        {messages.resume.awardsTitle}
      </Heading>
      {orderedEntries.length === 0 ? (
        <p className={styles.emptyMessage}>{messages.empty.awards}</p>
      ) : (
        <ul className={styles.awardList}>
          {orderedEntries.map((entry) => (
            <li className={styles.awardEntry} key={entry.id}>
              <div className={styles.entryHeader}>
                <ItemHeading className={styles.entryTitle}>
                  {localize(entry.title, locale, {
                    path: `awards.${entry.id}.title`,
                  })}
                </ItemHeading>
                <span className={styles.entryDate}>{entry.date}</span>
              </div>
              {entry.description ? (
                <p className={styles.entryDescription}>
                  {localize(entry.description, locale, {
                    path: `awards.${entry.id}.description`,
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
