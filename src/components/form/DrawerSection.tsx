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
      <p className="text-10 text-text-muted tracking-wide-6 mb-2.5 font-semibold uppercase">
        {label}
      </p>
      <div
        className="no-last-border bg-surface border-border-light overflow-hidden rounded border"
        style={{ padding: cardPadding }}
      >
        {children}
      </div>
    </div>
  );
}
