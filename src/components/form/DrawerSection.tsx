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
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}
      >
        {label}
      </p>
      <div
        className="no-last-border"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          padding: cardPadding,
        }}
      >
        {children}
      </div>
    </div>
  );
}
