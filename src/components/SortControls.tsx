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
    <div ref={sortRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowSort(!showSort)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: 'transparent',
          border: 'none',
          fontSize: 12,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <ArrowsDownUp size={11} />
        {currentSort.label}
      </button>

      {showSort && (
        <div
          className="animate-pop-in"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-elevated)',
            zIndex: 'var(--z-page)',
            minWidth: 160,
            padding: '4px 0',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setSortKey(opt.key);
                setShowSort(false);
              }}
              style={{
                width: '100%',
                padding: '8px 14px',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: sortKey === opt.key ? 600 : 400,
                color: sortKey === opt.key ? 'var(--sage)' : 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
