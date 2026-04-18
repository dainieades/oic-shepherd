'use client';

import React, { useEffect, useState } from 'react';
import { useFloating, autoUpdate, offset, flip, size } from '@floating-ui/react';
import { Check } from '@phosphor-icons/react';

interface PickerOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface PickerMenuProps {
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
  title: string;
  options: PickerOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function PickerMenu({
  anchorRef,
  options,
  value,
  onSelect,
  onClose,
}: PickerMenuProps) {
  const [search, setSearch] = useState('');

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`;
        },
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(anchorRef?.current ?? null);
  }, [anchorRef, refs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const floating = refs.floating.current;
      if (
        floating &&
        !floating.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef, refs.floating]);

  const showSearch = options.length > 10;
  const filtered =
    showSearch && search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

  // Fallback styles when there is no anchor (centered on screen)
  const fallbackStyle: React.CSSProperties = anchorRef?.current
    ? {}
    : {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: Math.min(430, window.innerWidth - 32),
      };

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...(anchorRef?.current ? floatingStyles : fallbackStyle),
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
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-light)',
            position: 'sticky',
            top: 0,
            background: 'var(--surface)',
          }}
        >
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              background: 'transparent',
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
            onClick={() => {
              onSelect(opt.value);
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: isSelected ? 'var(--sage-light)' : 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-light)',
              fontSize: 14,
              cursor: 'pointer',
              textAlign: 'left' as const,
            }}
          >
            {opt.icon && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  color: isSelected ? 'var(--sage)' : 'var(--text-muted)',
                }}
              >
                {opt.icon}
              </span>
            )}
            <span style={{ flex: 1 }}>
              <span
                style={{
                  display: 'block',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                }}
              >
                {opt.label}
              </span>
              {opt.description && (
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 1,
                  }}
                >
                  {opt.description}
                </span>
              )}
            </span>
            {isSelected && <Check size={14} color="var(--sage)" weight="bold" />}
          </button>
        );
      })}
    </div>
  );
}
