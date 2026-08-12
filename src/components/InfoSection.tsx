import React from 'react';

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-10 text-text-muted tracking-wide-6 mb-2 font-semibold uppercase">
        {title}
      </p>
      <div className="no-last-border bg-surface overflow-hidden rounded p-0">{children}</div>
    </div>
  );
}
