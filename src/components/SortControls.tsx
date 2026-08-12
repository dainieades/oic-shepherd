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
        className="text-12 text-text-muted flex cursor-pointer items-center gap-1 border-0 bg-transparent px-2 py-1 font-medium"
      >
        <ArrowsDownUp size={11} />
        {currentSort.label}
      </button>

      {showSort && (
        <div
          className="animate-pop-in bg-surface border-border z-page shadow-elevated absolute right-0 rounded-sm border py-1"
          style={{
            top: 'calc(100% + 0.25rem)',
            minWidth: '10rem',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setSortKey(opt.key);
                setShowSort(false);
              }}
              className={`text-13 w-full cursor-pointer border-0 bg-transparent text-left ${sortKey === opt.key ? 'text-sage font-semibold' : 'text-text-primary font-normal'}`}
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
