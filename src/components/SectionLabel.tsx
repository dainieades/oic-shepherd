import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  marginBottom?: number;
}

export function SectionLabel({ children, marginBottom = 10 }: SectionLabelProps) {
  return (
    <p
      className="text-10 text-text-muted tracking-wide-6 font-semibold uppercase"
      style={{ marginBottom }}
    >
      {children}
    </p>
  );
}
