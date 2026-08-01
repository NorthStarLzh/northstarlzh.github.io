'use client';

import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

import {
  moduleStateMessages,
  type ModuleStateKind,
  type ModuleStateLocale,
} from './module-state.messages';

type ModuleStateStyle = CSSProperties & {
  '--module-state-min-height'?: CSSProperties['minHeight'];
};

export interface ModuleStateProps {
  className?: string;
  description?: string;
  kind: ModuleStateKind;
  locale?: ModuleStateLocale;
  minHeight?: CSSProperties['minHeight'];
  retry?: () => void;
  retryLabel?: string;
  title?: string;
}

export function ModuleState({
  className,
  description,
  kind,
  locale = 'zh',
  minHeight,
  retry,
  retryLabel,
  title,
}: ModuleStateProps) {
  const fallback = moduleStateMessages[locale][kind];
  const style: ModuleStateStyle = { '--module-state-min-height': minHeight };
  const role = kind === 'error' ? 'alert' : 'status';

  return (
    <div
      aria-busy={kind === 'loading' || undefined}
      className={['ds-module-state', className].filter(Boolean).join(' ')}
      data-state={kind}
      role={role}
      style={style}
    >
      <div className="ds-stack" style={{ '--stack-gap': 'var(--space-md)' } as CSSProperties}>
        {kind === 'loading' ? (
          <div data-testid="module-state-skeleton">
            <Skeleton height="1.75rem" width="12rem" />
            <SkeletonText className="mt-sm" lines={2} />
          </div>
        ) : null}
        <h2 className="ds-module-state__title">{title ?? fallback.title}</h2>
        <p className="ds-module-state__description">
          {description ?? fallback.description}
        </p>
        {retry ? (
          <div>
            <Button onClick={retry} size="sm" variant="secondary">
              {retryLabel ?? fallback.retryLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
