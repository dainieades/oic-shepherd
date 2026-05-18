'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { ArrowsDownUp } from '@phosphor-icons/react';
import { SORT_OPTIONS } from '@/lib/constants';

export default function SortControls(): React.ReactNode {
  const { homeSortKey: sortKey, setHomeSortKey: setSortKey } = useApp();
  const [showSort, setShowSort] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function outside(e: MouseEvent): void {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const currentSort = SORT_OPTIONS.find((s) => s.key === sortKey) ?? SORT_OPTIONS[0];

  return (
    <div ref={sortRef} className="relative">
      <button
        onClick={() => setShowSort(!showSort)}
        className="flex items-center gap-1 py-1 px-2 bg-transparent border-0 text-12 text-text-muted cursor-pointer font-medium"
      >
        <ArrowsDownUp size={11} />
        {currentSort.label}
      </button>

      {showSort && (
        <div
          className="animate-pop-in absolute right-0 bg-surface border border-border rounded-sm py-1 z-page shadow-elevated"
          style={{
            top: 'calc(100% + 0.25rem)',
            minWidth: 160,
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setSortKey(opt.key);
                setShowSort(false);
              }}
              className={`w-full text-left text-13 bg-transparent border-0 cursor-pointer ${sortKey === opt.key ? 'font-semibold text-sage' : 'font-normal text-text-primary'}`}
              style={{ padding: '0.5rem 0.875rem' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
