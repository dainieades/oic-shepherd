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
      className="text-11 rounded-pill shrink-0 font-medium"
      style={{
        padding: '0.0625rem 0.4375rem',
        background: bg,
        color,
        border,
      }}
    >
      {label}
    </span>
  );
}
