import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  marginBottom?: number;
}

export function SectionLabel({ children, marginBottom = 10 }: SectionLabelProps) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom,
      }}
    >
      {children}
    </p>
  );
}
