'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/BottomSheet';
import { Z_SHEET } from '@/lib/constants';
import { fullName, type DuplicateMatch } from '@/lib/utils';

interface DuplicatePersonSheetProps {
  matches: DuplicateMatch[];
  onAddAnyway: () => void;
  onCancel: () => void;
}

export default function DuplicatePersonSheet({
  matches,
  onAddAnyway,
  onCancel,
}: DuplicatePersonSheetProps) {
  const router = useRouter();

  return (
    <BottomSheet onClose={onCancel} compact zIndex={Z_SHEET} variant="confirm">
      <div
        className="pt-8"
        style={{ paddingLeft: '1.75rem', paddingRight: '1.75rem', paddingBottom: '1.75rem' }}
      >
        <p
          className="text-20 text-text-primary mt-0 text-center font-bold"
          style={{ marginBottom: '0.625rem' }}
        >
          Possible duplicate
        </p>
        <p
          className="text-14 text-text-muted leading-open mt-0 text-center"
          style={{ marginBottom: '1.25rem' }}
        >
          {matches.length === 1
            ? `This name looks similar to someone already in the directory.`
            : `This name looks similar to ${matches.length} people already in the directory.`}
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          {matches.slice(0, 3).map((m) => (
            <button
              key={m.person.id}
              onClick={() => router.push(`/person/${m.person.id}`)}
              className="bg-surface border-border-light flex w-full cursor-pointer items-center justify-between rounded border text-left"
              style={{ padding: '0.625rem 0.875rem', marginBottom: '0.5rem' }}
            >
              <span className="text-14 text-text-primary font-medium">{fullName(m.person)}</span>
              <span className="text-12 text-text-muted">View</span>
            </button>
          ))}
        </div>
        <button
          onClick={onAddAnyway}
          className="text-15 text-on-sage bg-sage mb-2 w-full cursor-pointer rounded border-0 font-semibold"
          style={{ height: '2.625rem' }}
        >
          Add as new person
        </button>
        <button
          onClick={onCancel}
          className="text-15 text-text-secondary w-full cursor-pointer rounded border-0 bg-transparent font-medium"
          style={{ height: '2.375rem' }}
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
