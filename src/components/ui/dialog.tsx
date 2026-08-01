'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type ReactElement, type ReactNode, useRef } from 'react';

import { IconButton } from './button';

export interface DialogProps {
  children: ReactNode;
  className?: string;
  closeLabel: string;
  description: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
  trigger?: ReactElement;
}

export function Dialog({
  children,
  className,
  closeLabel,
  description,
  onOpenChange,
  open,
  title,
  trigger,
}: DialogProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function rememberReturnFocus() {
    const activeElement = document.activeElement;
    returnFocusRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : null;
  }

  function restoreReturnFocus(event: Event) {
    const returnFocus = returnFocusRef.current;
    returnFocusRef.current = null;

    if (!returnFocus?.isConnected) {
      return;
    }

    event.preventDefault();
    returnFocus.focus();
  }

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ds-dialog-overlay" />
        <DialogPrimitive.Content
          className={['ds-dialog-content', className].filter(Boolean).join(' ')}
          onCloseAutoFocus={restoreReturnFocus}
          onOpenAutoFocus={rememberReturnFocus}
        >
          <div className="ds-dialog-header">
            <div>
              <DialogPrimitive.Title className="ds-dialog-title">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="ds-dialog-description">
                {description}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton label={closeLabel} size="sm" variant="ghost">
                <span aria-hidden="true">×</span>
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          <div className="ds-dialog-body">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
