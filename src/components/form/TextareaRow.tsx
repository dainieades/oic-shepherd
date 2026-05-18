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
      className="field-row-hover flex items-start gap-2 pt-3 pb-3 pr-4 border-b border-border-light cursor-text"
      tabIndex={-1}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="w-2 shrink-0" />
      <span className="pt-0.5">{icon}</span>
      <span style={labelStyle} className="pt-0.5">{label}</span>
      <textarea
        ref={inputRef}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: resizable ? 'vertical' : 'none', lineHeight: 'var(--leading-normal)' }}
      />
    </div>
  );
}
