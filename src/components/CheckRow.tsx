'use client';

import React from 'react';
import { Check } from '@phosphor-icons/react';

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CheckRow({ checked, onToggle, children }: CheckRowProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 2px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          flexShrink: 0,
          border: checked ? 'none' : '1.5px solid var(--border)',
          background: checked ? 'var(--sage)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={10} color="#fff" weight="bold" />}
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: checked ? 500 : 400 }}>
        {children}
      </span>
    </button>
  );
}
