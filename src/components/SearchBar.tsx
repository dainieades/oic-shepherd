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
    <div style={{ position: 'relative', marginBottom: 10, marginTop: 8 }}>
      <MagnifyingGlass
        size={14}
        color="var(--text-muted)"
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        style={{
          width: '100%',
          paddingLeft: 32,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          fontSize: 14,
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
    </div>
  );
}
