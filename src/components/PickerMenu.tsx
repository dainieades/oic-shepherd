'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PickerOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface PickerMenuProps {
  anchorRef?: React.RefObject<HTMLButtonElement>;
  title: string;
  options: PickerOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function PickerMenu({ anchorRef, options, value, onSelect, onClose }: PickerMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  const rect = anchorRef?.current?.getBoundingClientRect();

  const showSearch = options.length > 10;
  const filtered = showSearch && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const rowHeight = 41;
  const searchHeight = showSearch ? 44 : 0;
  const menuHeight = Math.min(300, filtered.length * rowHeight + searchHeight);

  // If no anchor, center horizontally near the middle of the screen
  const left   = rect ? rect.left : (window.innerWidth - Math.min(430, window.innerWidth - 32)) / 2;
  const width  = rect ? rect.width : Math.min(430, window.innerWidth - 32);
  const spaceBelow = rect ? window.innerHeight - rect.bottom - 8 : menuHeight + 1;
  const openAbove  = rect ? spaceBelow < menuHeight && rect.top > spaceBelow : false;
  const top = rect
    ? (openAbove ? rect.top - menuHeight - 4 : rect.bottom + 4)
    : (window.innerHeight - menuHeight) / 2;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top,
        left,
        width,
        background: 'var(--surface)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-light)',
        maxHeight: 300,
        overflowY: 'auto',
        zIndex: 80,
      }}
    >
      {showSearch && (
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-light)',
          position: 'sticky', top: 0,
          background: 'var(--surface)',
        }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              width: '100%', border: 'none', outline: 'none',
              fontSize: 14, background: 'transparent',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      )}
      {filtered.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => { onSelect(opt.value); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: isSelected ? 'var(--sage-light)' : 'none',
              border: 'none', borderBottom: '1px solid var(--border-light)',
              fontSize: 14, cursor: 'pointer', textAlign: 'left' as const,
            }}
          >
            {opt.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opt.icon}</span>
            )}
            <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--sage)' : 'var(--text-primary)' }}>
              {opt.label}
            </span>
            {isSelected && (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
