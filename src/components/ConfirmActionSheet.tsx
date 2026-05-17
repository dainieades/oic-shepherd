'use client';

import React from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { Z_SHEET } from '@/lib/constants';

type Tone = 'neutral' | 'danger';

interface ConfirmActionSheetProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmActionSheet({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'neutral',
  onConfirm,
  onCancel,
}: ConfirmActionSheetProps) {
  const isDanger = tone === 'danger';
  return (
    <BottomSheet onClose={onCancel} compact zIndex={Z_SHEET} variant="confirm">
      <div style={{ padding: '2rem 1.75rem 1.75rem' }}>
        <p
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: isDanger ? 'var(--red)' : 'var(--text-primary)',
            textAlign: 'center',
            marginTop: 0,
            marginBottom: '0.625rem',
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.55,
            marginTop: 0,
            marginBottom: '1.75rem',
          }}
        >
          {description}
        </p>
        <button
          onClick={onConfirm}
          style={{
            width: '100%',
            height: '2.625rem',
            borderRadius: 'var(--radius)',
            background: isDanger ? 'var(--red)' : 'var(--sage)',
            color: isDanger ? 'var(--on-red)' : 'var(--on-sage)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            marginBottom: '0.5rem',
          }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            height: '2.375rem',
            borderRadius: 'var(--radius)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
