'use client';

import React from 'react';

interface PickerOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PickerMenuProps {
  title: string;
  options: PickerOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function PickerMenu({ title, options, value, onSelect, onClose }: PickerMenuProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(30,26,24,0.35)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 430,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '12px auto 0' }} />

        {/* Title */}
        <p style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
          textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '12px 20px 10px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          {title}
        </p>

        {/* Options */}
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); onClose(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '15px 20px',
                background: isSelected ? 'var(--sage-light)' : 'none',
                border: 'none', borderBottom: '1px solid var(--border-light)',
                fontSize: 15,
                color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span>
                {opt.icon && <span style={{ marginRight: 10, display: 'inline-flex', alignItems: 'center' }}>{opt.icon}</span>}
                {opt.label}
              </span>
              {isSelected && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
