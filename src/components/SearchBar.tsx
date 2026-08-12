'use client';

import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  show: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SearchBar({ search, setSearch, show, inputRef }: SearchBarProps) {
  if (!show && !search) return null;

  return (
    <div className="relative mt-2 mb-2.5">
      <MagnifyingGlass
        size={14}
        color="var(--text-muted)"
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
      />
      <input
        ref={inputRef}
        type="text"
        aria-label="Search people by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        className="bg-surface border-border text-14 text-text-primary w-full rounded-sm border py-2 pr-3 pl-8 outline-none"
      />
    </div>
  );
}
