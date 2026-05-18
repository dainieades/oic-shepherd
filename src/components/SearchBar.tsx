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
    <div className="relative mb-2.5 mt-2">
      <MagnifyingGlass
        size={14}
        color="var(--text-muted)"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        aria-label="Search people by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-sm text-14 text-text-primary outline-none"
      />
    </div>
  );
}
