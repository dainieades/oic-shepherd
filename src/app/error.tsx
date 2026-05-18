'use client';

import React from 'react';
import { Warning } from '@phosphor-icons/react';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <Warning size={40} weight="duotone" className="text-text-tertiary" />
      <div className="flex flex-col gap-1">
        <p
          style={{
            fontSize: 'var(--text-17)',
            fontWeight: 'var(--font-semibold)',
          }}
          className="text-text-primary"
        >
          Something went wrong
        </p>
        <p style={{ fontSize: 'var(--text-14)' }} className="text-text-secondary">
          An unexpected error occurred. You can try again or go back.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-5 py-2 text-white"
        style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--font-medium)' }}
      >
        Try again
      </button>
    </div>
  );
}
