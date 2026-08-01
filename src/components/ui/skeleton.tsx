import type { CSSProperties, HTMLAttributes } from 'react';

type SkeletonStyle = CSSProperties & Record<`--${string}`, string | number | undefined>;

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  aspectRatio?: string;
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  variant?: 'avatar' | 'card' | 'media' | 'text';
  width?: CSSProperties['width'];
}

export function Skeleton({
  aspectRatio,
  className,
  height,
  radius,
  style,
  variant = 'text',
  width,
  ...props
}: SkeletonProps) {
  const skeletonStyle: SkeletonStyle = {
    '--skeleton-aspect-ratio': aspectRatio,
    '--skeleton-height': height,
    '--skeleton-radius': radius,
    '--skeleton-width': width,
    ...style,
  };

  return (
    <span
      {...props}
      aria-hidden="true"
      className={['ds-skeleton', `ds-skeleton--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      style={skeletonStyle}
    />
  );
}

export interface SkeletonTextProps {
  className?: string;
  lineHeight?: CSSProperties['height'];
  lines?: number;
}

function normalizeLineCount(lines: number): number {
  if (!Number.isFinite(lines)) {
    return 1;
  }

  return Math.max(1, Math.floor(lines));
}

export function SkeletonText({
  className,
  lineHeight = '1rem',
  lines = 3,
}: SkeletonTextProps) {
  const safeLines = normalizeLineCount(lines);

  return (
    <div aria-hidden="true" className={className} data-skeleton-lines={safeLines}>
      {Array.from({ length: safeLines }, (_, index) => (
        <Skeleton
          height={lineHeight}
          key={index}
          style={{ marginBlockEnd: index === safeLines - 1 ? 0 : 'var(--space-xs)' }}
          width={index === safeLines - 1 && safeLines > 1 ? '72%' : '100%'}
        />
      ))}
    </div>
  );
}
