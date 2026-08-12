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
    <div className="relative hidden w-[20rem] lg:block">
      <MagnifyingGlass
        size={14}
        color="var(--text-muted)"
        className="pointer-events-none absolute top-1/2 left-[0.625rem] -translate-y-1/2"
      />
      <input
        ref={inputRef}
        type="text"
        aria-label={ariaLabel}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="bg-surface border-border text-14 text-text-primary w-full rounded-sm border outline-none"
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
        className="text-text-muted absolute top-1/2 right-[0.375rem] flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
