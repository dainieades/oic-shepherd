'use client';

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 border-0 p-0 transition-[background] duration-200"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: checked ? 'var(--sage)' : 'var(--border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="absolute block rounded-full bg-white"
        style={{
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}
