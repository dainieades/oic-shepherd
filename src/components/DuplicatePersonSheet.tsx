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
      <div className="pt-8" style={{ paddingLeft: '1.75rem', paddingRight: '1.75rem', paddingBottom: '1.75rem' }}>
        <p
          className="text-20 font-bold text-center mt-0 text-text-primary"
          style={{ marginBottom: '0.625rem' }}
        >
          Possible duplicate
        </p>
        <p
          className="text-14 text-text-muted text-center leading-open mt-0"
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
              className="w-full flex items-center justify-between bg-surface border border-border-light rounded cursor-pointer text-left"
              style={{ padding: '0.625rem 0.875rem', marginBottom: '0.5rem' }}
            >
              <span className="text-14 font-medium text-text-primary">{fullName(m.person)}</span>
              <span className="text-12 text-text-muted">View</span>
            </button>
          ))}
        </div>
        <button
          onClick={onAddAnyway}
          className="w-full rounded text-15 font-semibold border-0 cursor-pointer mb-2 text-on-sage bg-sage"
          style={{ height: '2.625rem' }}
        >
          Add as new person
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded text-15 font-medium text-text-secondary bg-transparent border-0 cursor-pointer"
          style={{ height: '2.375rem' }}
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
