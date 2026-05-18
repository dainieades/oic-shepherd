import React from 'react';

export function DrawerSection({
  label,
  children,
  cardPadding = '0 1rem',
}: {
  label: string;
  children: React.ReactNode;
  cardPadding?: string;
}) {
  return (
    <div className="mb-6">
      <p
        className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2.5"
      >
        {label}
      </p>
      <div
        className="no-last-border bg-surface rounded border border-border-light overflow-hidden"
        style={{ padding: cardPadding }}
      >
        {children}
      </div>
    </div>
  );
}
