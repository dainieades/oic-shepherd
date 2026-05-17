'use client';

import React from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface HeaderInlineSearchProps {
  search: string;
  setSearch: (value: string) => void;
  show: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  ariaLabel: string;
  height: number;
  onClose: () => void;
}

export default function HeaderInlineSearch({
  search,
  setSearch,
  show,
  inputRef,
  placeholder,
  ariaLabel,
  height,
  onClose,
}: HeaderInlineSearchProps) {
  if (!show && !search) return null;

  return (
    <div
      className="hidden lg:block"
      style={{ position: 'relative', width: '20rem' }}
    >
      <MagnifyingGlass
        size={14}
        color="var(--text-muted)"
        style={{
          position: 'absolute',
          left: '0.625rem',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={inputRef}
        type="text"
        aria-label={ariaLabel}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height,
          paddingLeft: '2rem',
          paddingRight: '2.25rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-14)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
      <button
        type="button"
        aria-label="Clear and close search"
        onClick={() => {
          setSearch('');
          onClose();
        }}
        style={{
          position: 'absolute',
          right: '0.375rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1.5rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
