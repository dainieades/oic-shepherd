'use client';

import React from 'react';
import { labelStyle, inputStyle } from './formStyles';

export function TextInputRow({
  icon,
  label,
  required,
  inputRef,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div
      className="field-row-hover flex items-center gap-2 pt-3 pb-3 pr-4 border-b border-border-light cursor-text"
      tabIndex={-1}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="w-2 text-14 text-red shrink-0 leading-none">
        {required ? '*' : ''}
      </span>
      {icon}
      <span style={labelStyle}>{label}</span>
      <input
        ref={inputRef}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={inputStyle}
      />
    </div>
  );
}
