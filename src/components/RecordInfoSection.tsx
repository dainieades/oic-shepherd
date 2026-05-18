import React from 'react';
import { format, parseISO } from 'date-fns';
import { type Family, type Note } from '@/lib/types';
import { InfoSection } from '@/components/InfoSection';
import { InfoRow } from '@/components/InfoRow';

export function RecordInfoSection({ family, notes }: { family: Family; notes: Note[] }) {
  const lastLoggedNote = notes.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0];
  return (
    <InfoSection title="Record info">
      <InfoRow
        label="Last logged"
        value={lastLoggedNote ? format(parseISO(lastLoggedNote.createdAt), 'MMM d, yyyy') : 'Never'}
        muted
      />
      <InfoRow
        label="Added"
        value={family.createdAt ? format(parseISO(family.createdAt), 'MMM d, yyyy') : '—'}
        muted
      />
      <InfoRow
        label="Last edited"
        value={family.lastEditedAt ? format(parseISO(family.lastEditedAt), 'MMM d, yyyy') : '—'}
        muted
      />
    </InfoSection>
  );
}
