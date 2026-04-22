'use client';

import React from 'react';
import { labelStyle, inputStyle } from './formStyles';

export function TextareaRow({
  icon,
  label,
  inputRef,
  value,
  onChange,
  placeholder,
  rows,
  resizable,
}: {
  icon: React.ReactNode;
  label: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  resizable?: boolean;
}) {
  return (
    <div
      className="field-row-hover"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 16,
        borderBottom: '1px solid var(--border-light)',
        cursor: 'text',
      }}
      tabIndex={-1}
      onClick={() => inputRef.current?.focus()}
    >
      <span style={{ width: 8, flexShrink: 0 }} />
      <span style={{ paddingTop: 2 }}>{icon}</span>
      <span style={{ ...labelStyle, paddingTop: 2 }}>{label}</span>
      <textarea
        ref={inputRef}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: resizable ? 'vertical' : 'none', lineHeight: 1.5 }}
      />
    </div>
  );
}
