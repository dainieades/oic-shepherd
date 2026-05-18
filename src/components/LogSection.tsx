'use client';

import React from 'react';
import { CaretDown } from '@phosphor-icons/react';

export function LogSection({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 py-1 px-0 bg-transparent border-none cursor-pointer text-10 font-semibold text-text-muted uppercase tracking-wide-6 ${open ? 'mb-2' : ''}`}
      >
        {label} · {count}
        <CaretDown
          size={10}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {open && children}
    </div>
  );
}
