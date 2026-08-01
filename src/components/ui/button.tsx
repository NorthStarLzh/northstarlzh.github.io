'use client';

import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cx(
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    className,
  );
}

function LoadingIndicator() {
  return <span aria-hidden="true" className="ds-button__spinner" />;
}

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  disabled = false,
  loading = false,
  loadingLabel,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={buttonClassName(variant, size, className)}
      data-loading={loading || undefined}
      disabled={isDisabled}
      type={type}
    >
      {loading ? <LoadingIndicator /> : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export interface IconButtonProps
  extends Omit<ButtonProps, 'aria-label' | 'children' | 'loadingLabel'> {
  children: ReactNode;
  label: string;
  loadingLabel?: string;
}

export function IconButton({
  children,
  className,
  label,
  loading = false,
  loadingLabel,
  size = 'md',
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      aria-label={loading && loadingLabel ? loadingLabel : label}
      className={cx(buttonClassName(variant, size, className), 'ds-icon-button')}
      data-loading={loading || undefined}
      disabled={props.disabled || loading}
      type={props.type ?? 'button'}
    >
      {loading ? <LoadingIndicator /> : <span aria-hidden="true">{children}</span>}
    </button>
  );
}

export interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  disabled?: boolean;
  href: string;
  loading?: boolean;
  loadingLabel?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function ButtonLink({
  children,
  className,
  disabled = false,
  href,
  loading = false,
  loadingLabel,
  onClick,
  size = 'md',
  tabIndex,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const isDisabled = disabled || loading;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <a
      {...props}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={buttonClassName(variant, size, className)}
      data-loading={loading || undefined}
      href={href}
      onClick={handleClick}
      tabIndex={isDisabled ? -1 : tabIndex}
    >
      {loading ? <LoadingIndicator /> : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </a>
  );
}
