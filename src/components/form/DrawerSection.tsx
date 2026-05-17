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
          fontSize: 'var(--text-10)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide-6)',
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
