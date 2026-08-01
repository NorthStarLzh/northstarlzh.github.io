import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import type { SpaceToken } from '@/styles/tokens';

type LayoutElement = 'article' | 'aside' | 'div' | 'main' | 'nav' | 'section';

type LayoutStyle = CSSProperties & Record<`--${string}`, string | number | undefined>;

function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

function gapValue(gap: SpaceToken): string {
  return `var(--space-${gap})`;
}

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: LayoutElement;
  children: ReactNode;
  size?: 'narrow' | 'default' | 'wide' | 'full';
}

const containerWidths: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'var(--content-narrow)',
  default: 'var(--content-default)',
  wide: 'var(--content-wide)',
  full: 'none',
};

export function Container({
  as = 'div',
  children,
  className,
  size = 'default',
  style,
  ...props
}: ContainerProps) {
  const containerStyle: LayoutStyle = {
    '--container-max': containerWidths[size],
    ...style,
  };

  return createElement(
    as,
    { ...props, className: cx('ds-container', className), style: containerStyle },
    children,
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: LayoutElement;
  children: ReactNode;
  spacing?: SpaceToken;
}

export function Section({
  as = 'section',
  children,
  className,
  spacing = 'section',
  style,
  ...props
}: SectionProps) {
  const sectionStyle: LayoutStyle = {
    '--section-space': gapValue(spacing),
    ...style,
  };

  return createElement(
    as,
    { ...props, className: cx('ds-section', className), style: sectionStyle },
    children,
  );
}

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: LayoutElement;
  children: ReactNode;
  gap?: SpaceToken;
}

export function Stack({
  as = 'div',
  children,
  className,
  gap = 'md',
  style,
  ...props
}: StackProps) {
  const stackStyle: LayoutStyle = {
    '--stack-gap': gapValue(gap),
    ...style,
  };

  return createElement(
    as,
    { ...props, className: cx('ds-stack', className), style: stackStyle },
    children,
  );
}

export interface ClusterProps extends HTMLAttributes<HTMLElement> {
  align?: 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'stretch';
  as?: LayoutElement;
  children: ReactNode;
  gap?: SpaceToken;
  justify?: 'center' | 'flex-end' | 'flex-start' | 'space-around' | 'space-between';
}

export function Cluster({
  align = 'center',
  as = 'div',
  children,
  className,
  gap = 'md',
  justify = 'flex-start',
  style,
  ...props
}: ClusterProps) {
  const clusterStyle: LayoutStyle = {
    '--cluster-align': align,
    '--cluster-gap': gapValue(gap),
    '--cluster-justify': justify,
    ...style,
  };

  return createElement(
    as,
    { ...props, className: cx('ds-cluster', className), style: clusterStyle },
    children,
  );
}
