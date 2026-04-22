'use client';

import React from 'react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';
import { Button } from './Button';

interface BottomSheetProps {
  onClose: () => void;
  zIndex?: number;
  dragHandle?: boolean;
  children: React.ReactNode;
}

export function BottomSheet({
  onClose,
  zIndex = 60,
  dragHandle = false,
  children,
}: BottomSheetProps) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {dragHandle && (
          <div
            style={{
              width: 36,
              height: 4,
              background: 'var(--border)',
              borderRadius: 2,
              margin: '14px auto 0',
              flexShrink: 0,
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  onCancel: () => void;
  cancelLabel?: string;
  onAction: () => void;
  actionLabel: string;
  actionDisabled?: boolean;
  actionVariant?: 'pill' | 'text';
}

export function ModalHeader({
  title,
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
        padding: '14px 20px 12px',
        flexShrink: 0,
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
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
