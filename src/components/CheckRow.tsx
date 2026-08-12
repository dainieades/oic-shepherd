'use client';

import React from 'react';
import { Check } from '@phosphor-icons/react';

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center transition-[background] duration-150 ${checked ? 'bg-sage border-0' : 'bg-transparent'}`}
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        border: checked ? 'none' : '0.09375rem solid var(--border)',
      }}
    >
      {checked && <Check size={11} color="var(--on-sage)" weight="bold" />}
    </div>
  );
}

export function CheckRow({ checked, onToggle, children }: CheckRowProps) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent text-left"
      style={{ padding: '0.4375rem 0.125rem' }}
    >
      <div
        className={`flex shrink-0 items-center justify-center ${checked ? 'bg-sage border-0' : 'bg-transparent'}`}
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: checked ? 'none' : '0.09375rem solid var(--text-secondary)',
        }}
      >
        {checked && <Check size={10} color="var(--on-sage)" weight="bold" />}
      </div>
      <span className={`text-14 text-text-primary ${checked ? 'font-medium' : 'font-normal'}`}>
        {children}
      </span>
    </button>
  );
}
