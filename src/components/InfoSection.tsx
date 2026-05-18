import React from 'react';

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
        {title}
      </p>
      <div className="no-last-border bg-surface rounded overflow-hidden p-0">
        {children}
      </div>
    </div>
  );
}
