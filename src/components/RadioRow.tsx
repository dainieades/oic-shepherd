'use client';

import React from 'react';

interface RadioRowProps {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

export function RadioRow({ selected, onSelect, children }: RadioRowProps) {
  return (
    <button
      onClick={onSelect}
      className="border-border-light flex w-full cursor-pointer items-center gap-3 border-0 border-b bg-transparent px-0 py-2.5 text-left"
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: selected ? '0.125rem solid var(--sage)' : '0.09375rem solid var(--border)',
        }}
      >
        {selected && (
          <div className="bg-sage" style={{ width: 10, height: 10, borderRadius: '50%' }} />
        )}
      </div>
      <span className={`text-14 text-text-primary ${selected ? 'font-semibold' : 'font-normal'}`}>
        {children}
      </span>
    </button>
  );
}
