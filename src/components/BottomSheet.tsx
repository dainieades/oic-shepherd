'use client';

import React from 'react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';
import { Button } from './Button';

interface BottomSheetProps {
  onClose: () => void;
  zIndex?: number;
  compact?: boolean;
  contentStyle?: React.CSSProperties;
  children: React.ReactNode;
  'aria-labelledby'?: string;
}

export function BottomSheet({
  onClose,
  zIndex = 60,
  compact = false,
  contentStyle,
  children,
  'aria-labelledby': ariaLabelledby,
}: BottomSheetProps) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
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
      style={{
        position: 'fixed',
        inset: 0,
        background: BACKDROP_COLOR,
        zIndex,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          ...(compact
            ? { paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)' }
            : { height: 'calc(100dvh - 3rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }),
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
      <span id={titleId} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
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
