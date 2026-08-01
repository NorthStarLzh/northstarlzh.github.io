import { createElement } from 'react';

import { Stack } from '@/components/layout';
import { AppImage } from '@/components/ui';
import type { Locale, Profile } from '@/content/contracts';
import { localize } from '@/i18n/localize';

import styles from './resume.module.css';

export type ResumeDensity = 'compact' | 'full';

export interface ProfileSummaryProps {
  avatarSrc?: string;
  avatarSrcSet?: string;
  density?: ResumeDensity;
  headingLevel?: 'h1' | 'h2' | 'h3';
  locale: Locale;
  profile: Profile;
}

export function ProfileSummary({
  avatarSrc,
  avatarSrcSet,
  density = 'full',
  headingLevel = 'h2',
  locale,
  profile,
}: ProfileSummaryProps) {
  const avatarAlt = localize(profile.avatar.alt, locale, {
    path: 'profile.avatar.alt',
  });

  return (
    <section className={styles.profile} data-density={density}>
      <div className={styles.avatarFrame}>
        {avatarSrc ? (
          <picture>
            {avatarSrcSet ? (
              <source
                sizes={density === 'compact' ? '8rem' : '(min-width: 48rem) 18rem, 9rem'}
                srcSet={avatarSrcSet}
              />
            ) : null}
            <AppImage
              alt={avatarAlt}
              className={styles.avatar}
              height={profile.avatar.height}
              loading="eager"
              sizes={density === 'compact' ? '8rem' : '(min-width: 48rem) 18rem, 9rem'}
              src={avatarSrc}
              unoptimized={Boolean(avatarSrcSet)}
              width={profile.avatar.width}
            />
          </picture>
        ) : (
          <div
            aria-label={avatarAlt}
            className={styles.avatarPlaceholder}
            data-avatar-asset-id={profile.avatar.id}
            role="img"
          >
            <span aria-hidden="true">{profile.nickname.slice(0, 1)}</span>
          </div>
        )}
      </div>

      <Stack className={styles.profileCopy} gap="sm">
        {createElement(headingLevel, { className: styles.profileTitle }, profile.nickname)}
        <p className={styles.profileMeta}>
          {profile.institution} · {localize(profile.role, locale, { path: 'profile.role' })}
        </p>
        <p className={styles.profileBio}>
          {localize(profile.bio, locale, { path: 'profile.bio' })}
        </p>
      </Stack>
    </section>
  );
}
