'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  value: string | string[];
  multiSelect?: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function PickerMenu({
  anchorRef,
  options,
  value,
  multiSelect = false,
  onSelect,
  onClose,
}: PickerMenuProps) {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  if (!mounted) return null;
  return createPortal(
    <div
      ref={refs.setFloating}
      className="bg-surface rounded-md border border-border-light overflow-y-auto shadow-elevated z-nested"
      style={{
        ...(anchorRef?.current ? floatingStyles : fallbackStyle),
        maxHeight: 300,
      }}
    >
      {showSearch && (
        <div
          className="sticky top-0 border-b border-border-light bg-surface"
          style={{ padding: '0.625rem 0.875rem' }}
        >
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full text-14 text-text-primary outline-none"
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>
      )}
      {filtered.map((opt) => {
        const isSelected = multiSelect
          ? Array.isArray(value) && value.includes(opt.value)
          : opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              onSelect(opt.value);
              if (!multiSelect) onClose();
            }}
            className="w-full flex items-center gap-2.5 text-14 cursor-pointer text-left"
            style={{
              padding: '0.625rem 0.875rem',
              background: isSelected ? 'var(--sage-light)' : 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            {opt.icon && (
              <span
                className="inline-flex items-center shrink-0"
                style={{ color: isSelected ? 'var(--sage)' : 'var(--text-muted)' }}
              >
                {opt.icon}
              </span>
            )}
            <span className="flex-1">
              <span
                className="block"
                style={{
                  fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-normal)',
                  color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                }}
              >
                {opt.label}
              </span>
              {opt.description && (
                <span className="block text-12 text-text-muted" style={{ marginTop: 1 }}>
                  {opt.description}
                </span>
              )}
            </span>
            {multiSelect ? (
              <span
                className="inline-flex items-center justify-center shrink-0"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `0.125rem solid ${isSelected ? 'var(--sage)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--sage)' : 'transparent',
                }}
              >
                {isSelected && <Check size={10} color="var(--on-sage)" weight="bold" />}
              </span>
            ) : (
              isSelected && <Check size={14} color="var(--sage)" weight="bold" />
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
