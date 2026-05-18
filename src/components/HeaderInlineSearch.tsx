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
      className="hidden lg:block relative w-[20rem]"
    >
      <MagnifyingGlass
        size={14}
        color="var(--text-muted)"
        className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        aria-label={ariaLabel}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-sm text-14 text-text-primary outline-none"
        style={{
          height,
          paddingLeft: '2rem',
          paddingRight: '2.25rem',
        }}
      />
      <button
        type="button"
        aria-label="Clear and close search"
        onClick={() => {
          setSearch('');
          onClose();
        }}
        className="absolute right-[0.375rem] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-transparent border-0 rounded-sm text-text-muted cursor-pointer p-0"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
