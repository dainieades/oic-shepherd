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
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div
      className="field-row-hover"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 16,
        borderBottom: '1px solid var(--border-light)',
        cursor: 'text',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span style={{ width: 8, fontSize: 14, color: 'var(--red)', flexShrink: 0, lineHeight: 1 }}>
        {required ? '*' : ''}
      </span>
      {icon}
      <span style={labelStyle}>{label}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}
