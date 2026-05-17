import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  marginBottom?: number;
}

export function SectionLabel({ children, marginBottom = 10 }: SectionLabelProps) {
  return (
    <p
      style={{
        fontSize: 'var(--text-10)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide-6)',
        marginBottom,
      }}
    >
      {children}
    </p>
  );
}
