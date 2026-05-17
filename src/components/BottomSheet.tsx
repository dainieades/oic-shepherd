'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { BACKDROP_COLOR } from '@/lib/constants';
import { Button } from './Button';

export type SheetVariant = 'sheet' | 'dialog' | 'side-panel' | 'confirm';

interface BottomSheetProps {
  onClose: () => void;
  zIndex?: number;
  compact?: boolean;
  contentStyle?: React.CSSProperties;
  children: React.ReactNode;
  /**
   * Desktop presentation override. Below md (768px) all variants render as a
   * bottom sheet; at md+ 'dialog' centers as a modal and 'side-panel' anchors
   * to the right.
   */
  variant?: SheetVariant;
  'aria-labelledby'?: string;
  /** Allow tapping the backdrop to dismiss. Defaults to false. */
  allowBackdropClose?: boolean;
}

const OUTER_VARIANT_CLASS: Record<SheetVariant, string> = {
  sheet: '',
  dialog: 'sheet-outer-dialog',
  'side-panel': 'sheet-outer-side-panel',
  confirm: 'sheet-outer-confirm',
};

const PANEL_VARIANT_CLASS: Record<SheetVariant, string> = {
  sheet: '',
  dialog: 'sheet-panel-dialog',
  'side-panel': 'sheet-panel-side-panel',
  confirm: 'sheet-panel-confirm',
};

export function BottomSheet({
  onClose,
  zIndex = 60,
  compact = false,
  contentStyle,
  children,
  variant = 'sheet',
  'aria-labelledby': ariaLabelledby,
  allowBackdropClose = false,
}: BottomSheetProps) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = (
    <div
      className={`sheet-outer ${OUTER_VARIANT_CLASS[variant]}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: BACKDROP_COLOR,
        zIndex,
        display: 'flex',
      }}
      onClick={(e) => {
        if (allowBackdropClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        className={`sheet-panel ${PANEL_VARIANT_CLASS[variant]}`}
        style={{
          background: 'var(--surface)',
          ...(compact
            ? { paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)' }
            : {
                height: 'calc(100dvh - 3rem)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }),
          position: 'relative',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}

export function SubPanel({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack?: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ModalHeader) {
          return React.cloneElement(child as React.ReactElement<ModalHeaderProps>, { onCancel: onBack });
        }
        return child;
      })}
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  titleId?: string;
  onCancel: () => void;
  cancelLabel?: string;
  onAction: () => void;
  actionLabel: string;
  actionDisabled?: boolean;
  actionVariant?: 'pill' | 'text';
}

export function ModalHeader({
  title,
  titleId,
  onCancel,
  cancelLabel = 'Cancel',
  onAction,
  actionLabel,
  actionDisabled = false,
  actionVariant = 'pill',
}: ModalHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem 0.75rem',
        flexShrink: 0,
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <span id={titleId} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </span>
      <Button
        variant={actionVariant === 'text' ? 'text' : 'primary'}
        size="sm"
        onClick={onAction}
        disabled={actionDisabled}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
