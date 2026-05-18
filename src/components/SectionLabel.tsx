import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  marginBottom?: number;
}

export function SectionLabel({ children, marginBottom = 10 }: SectionLabelProps) {
  return (
    <p
      className="text-10 font-semibold text-text-muted uppercase tracking-wide-6"
      style={{ marginBottom }}
    >
      {children}
    </p>
  );
}
