'use client';

import React from 'react';

interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}

export function InfoRow({ icon, label, value, muted }: InfoRowProps) {
  return (
    <div
      className="border-border-light flex items-start justify-between gap-3 border-b"
      style={{ padding: '0.6875rem 1rem' }}
    >
      <div className="flex shrink-0 items-center gap-2" style={{ paddingTop: 1 }}>
        {icon && <span className="text-text-muted flex shrink-0">{icon}</span>}
        <span className="text-13 text-text-muted">{label}</span>
      </div>
      <span
        className={`text-13 text-right leading-normal ${muted ? 'text-text-muted font-normal' : 'text-text-primary font-medium'}`}
      >
        {value}
      </span>
    </div>
  );
}
