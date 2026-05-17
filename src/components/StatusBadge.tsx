'use client';

import React from 'react';

interface StatusBadgeProps {
  label: string;
  bg: string;
  color: string;
  border?: string;
}

export function StatusBadge({ label, bg, color, border }: StatusBadgeProps) {
  return (
    <span
      style={{
        fontSize: 'var(--text-11)',
        padding: '0.0625rem 0.4375rem',
        borderRadius: 'var(--radius-pill)',
        background: bg,
        color,
        border,
        fontWeight: 'var(--font-medium)',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
