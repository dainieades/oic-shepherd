'use client';

import React from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { fmtDate } from '@/lib/utils';
import { rowBtnStyle, spacerStyle, labelStyle } from './formStyles';

export function DateRow({
  icon,
  label,
  value,
  inputRef,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
}) {
  return (
    <button
      className="field-row-hover"
      onClick={() => inputRef.current?.showPicker()}
      style={{ ...rowBtnStyle, position: 'relative' }}
    >
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span
        className="flex-1 text-14 text-left"
        style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {value ? fmtDate(value) : 'Not set'}
      </span>
      <CaretRight size={14} color="var(--text-muted)" />
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute left-0 top-1/2 w-full opacity-0 pointer-events-none"
        style={{ height: 1 }}
      />
    </button>
  );
}
