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
        className={`text-10 text-text-muted tracking-wide-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent px-0 py-1 font-semibold uppercase ${open ? 'mb-2' : ''}`}
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
