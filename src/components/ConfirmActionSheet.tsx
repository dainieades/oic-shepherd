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
    <BottomSheet onClose={onCancel} compact zIndex={Z_SHEET} variant="dialog">
      <div style={{ padding: '1.25rem 1.25rem 1.5rem' }}>
        <p
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: isDanger ? 'var(--red)' : 'var(--text-primary)',
            textAlign: 'center',
            marginTop: 0,
            marginBottom: '0.375rem',
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
            marginTop: 0,
            marginBottom: '1.5rem',
          }}
        >
          {description}
        </p>
        <button
          onClick={onConfirm}
          style={{
            width: '100%',
            height: '3.125rem',
            borderRadius: 'var(--radius)',
            background: isDanger ? 'var(--red)' : 'var(--sage)',
            color: isDanger ? 'var(--on-red)' : 'var(--on-sage)',
            fontSize: '1rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            marginBottom: '0.625rem',
          }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            height: '3.125rem',
            borderRadius: 'var(--radius)',
            background: 'var(--bg)',
            color: 'var(--text-secondary)',
            fontSize: '1rem',
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
