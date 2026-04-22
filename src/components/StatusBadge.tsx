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
        fontSize: 11,
        padding: '1px 7px',
        borderRadius: '999px',
        background: bg,
        color,
        border,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
