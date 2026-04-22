'use client';

import React from 'react';

interface RadioRowProps {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

export function RadioRow({ selected, onSelect, children }: RadioRowProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0.625rem 0',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          flexShrink: 0,
          border: selected ? '0.125rem solid var(--sage)' : '0.09375rem solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />
        )}
      </div>
      <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: 'var(--text-primary)' }}>
        {children}
      </span>
    </button>
  );
}
