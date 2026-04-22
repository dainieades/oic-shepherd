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
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '11px 16px',
        borderBottom: '1px solid var(--border-light)',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 1 }}>
        {icon && (
          <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
        )}
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: 13,
          color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
          fontWeight: muted ? 400 : 500,
          textAlign: 'right',
          lineHeight: 1.5,
        }}
      >
        {value}
      </span>
    </div>
  );
}
