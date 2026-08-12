'use client';

import React from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { rowBtnStyle, spacerStyle, labelStyle } from './formStyles';

export const PickerRow = React.forwardRef<
  HTMLButtonElement,
  { icon: React.ReactNode; label: string; value: string; onClick: () => void }
>(function PickerRow({ icon, label, value, onClick }, ref) {
  return (
    <button ref={ref} className="field-row-hover" onClick={onClick} style={rowBtnStyle}>
      <span style={spacerStyle} />
      {icon}
      <span style={labelStyle}>{label}</span>
      <span className="text-14 text-text-primary flex-1 text-left">{value}</span>
      <CaretRight size={14} color="var(--text-muted)" />
    </button>
  );
});
