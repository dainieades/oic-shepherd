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
      <div
        className="pt-8"
        style={{ paddingLeft: '1.75rem', paddingRight: '1.75rem', paddingBottom: '1.75rem' }}
      >
        <p
          className={`text-20 mt-0 text-center font-bold ${isDanger ? 'text-red' : 'text-text-primary'}`}
          style={{ marginBottom: '0.625rem' }}
        >
          {title}
        </p>
        <p
          className="text-14 text-text-muted leading-open mt-0 text-center"
          style={{ marginBottom: '1.75rem' }}
        >
          {description}
        </p>
        <button
          onClick={onConfirm}
          className={`text-15 mb-2 w-full cursor-pointer rounded border-0 font-semibold ${isDanger ? 'text-on-red bg-red' : 'text-on-sage bg-sage'}`}
          style={{ height: '2.625rem' }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="text-15 text-text-secondary w-full cursor-pointer rounded border-0 bg-transparent font-medium"
          style={{ height: '2.375rem' }}
        >
          {cancelLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
