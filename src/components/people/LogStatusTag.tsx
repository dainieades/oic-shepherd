import React from 'react';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';

interface LogStatusTagProps {
  daysSince: number | null;
  lastNoteTs: number | null;
}

export default function LogStatusTag({ daysSince, lastNoteTs }: LogStatusTagProps) {
  if (lastNoteTs === null) {
    return <StatusBadge label="Never logged" bg="var(--border-light)" color="var(--text-muted)" />;
  }
  if (daysSince !== null && daysSince >= 7) {
    return (
      <StatusBadge
        label={`${daysSince}d ago`}
        bg="var(--amber-light)"
        color="var(--amber)"
        border="1px solid var(--amber-border)"
      />
    );
  }
  return (
    <span className="text-12 text-text-muted">
      Logged {format(new Date(lastNoteTs), 'MMM d')}
    </span>
  );
}
