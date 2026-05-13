'use client';

import React from 'react';
import { BACKDROP_COLOR } from '@/lib/constants';
import { Button } from './Button';

export type SheetVariant = 'sheet' | 'dialog' | 'side-panel';

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
}

const OUTER_VARIANT_CLASS: Record<SheetVariant, string> = {
  sheet: '',
  dialog: 'sheet-outer-dialog',
  'side-panel': 'sheet-outer-side-panel',
};

const PANEL_VARIANT_CLASS: Record<SheetVariant, string> = {
  sheet: '',
  dialog: 'sheet-panel-dialog',
  'side-panel': 'sheet-panel-side-panel',
};

export function BottomSheet({
  onClose,
  zIndex = 60,
  compact = false,
  contentStyle,
  children,
  variant = 'sheet',
  'aria-labelledby': ariaLabelledby,
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

  return (
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
        if (e.target === e.currentTarget) onClose();
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
