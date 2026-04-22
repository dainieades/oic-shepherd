import React from 'react';

export const rowBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingTop: 12,
  paddingBottom: 12,
  paddingRight: 16,
  border: 'none',
  borderBottom: '1px solid var(--border-light)',
  background: 'none',
  cursor: 'pointer',
  textAlign: 'left' as const,
};

export const spacerStyle: React.CSSProperties = { width: 8, flexShrink: 0 };

export const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  width: 76,
  flexShrink: 0,
};

export const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  color: 'var(--text-primary)',
};
