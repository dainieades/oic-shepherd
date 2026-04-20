'use client';

import React from 'react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';

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
      <button
        onClick={onCancel}
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {cancelLabel}
      </button>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      {actionVariant === 'pill' ? (
        <button
          onClick={onAction}
          disabled={actionDisabled}
          style={{
            height: 32,
            padding: '0 14px',
            borderRadius: 8,
            background: actionDisabled ? 'var(--border)' : 'var(--sage)',
            color: actionDisabled ? 'var(--text-muted)' : '#fff',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: actionDisabled ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {actionLabel}
        </button>
      ) : (
        <button
          onClick={actionDisabled ? undefined : onAction}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: actionDisabled ? 'var(--text-muted)' : 'var(--sage)',
            background: 'none',
            border: 'none',
            cursor: actionDisabled ? 'default' : 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
