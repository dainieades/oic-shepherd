'use client';

import React from 'react';
import { X } from '@phosphor-icons/react';
import { BottomSheet } from './BottomSheet';

export interface FilterCategory<TKey extends string> {
  key: TKey;
  label: string;
  count: number;
  icon?: React.ReactNode;
  hasDividerBefore?: boolean;
}

interface Props<TKey extends string> {
  show: boolean;
  onClose: () => void;
  title: string;
  draftTotalCount: number;
  categories: FilterCategory<TKey>[];
  activeCategory: TKey;
  onCategoryChange: (cat: TKey) => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function FilterPanelBase<TKey extends string>({
  show,
  onClose,
  title,
  draftTotalCount,
  categories,
  activeCategory,
  onCategoryChange,
  onApply,
  onClear,
  children,
}: Props<TKey>): React.ReactNode {
  if (!show) return null;

  return (
    <BottomSheet onClose={onClose} zIndex={50} allowBackdropClose>
      <div className="border-border-light flex shrink-0 items-center justify-between border-b px-5 py-[0.875rem] pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-16 text-text-primary font-bold">{title}</h2>
          {draftTotalCount > 0 && (
            <span className="text-11 rounded-pill bg-sage text-on-sage px-2 py-0.5 font-bold">
              {draftTotalCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="bg-bg text-text-muted flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="bg-bg border-border-light w-[120px] shrink-0 overflow-y-auto border-r">
          {categories.map(({ key, label, count, icon, hasDividerBefore }) => {
            const isActive = activeCategory === key;
            return (
              <div key={key}>
                {hasDividerBefore && <div className="mx-3 h-px bg-[var(--border-light)]" />}
                <button
                  onClick={() => onCategoryChange(key)}
                  className="flex w-full cursor-pointer items-center justify-between border-none px-4 py-[0.875rem] text-left"
                  style={{
                    background: isActive ? 'var(--surface)' : 'none',
                    borderLeft: isActive
                      ? '0.1875rem solid var(--sage)'
                      : '0.1875rem solid transparent',
                  }}
                >
                  <span
                    className="text-14 flex items-center gap-[5px]"
                    style={{
                      fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                      color: isActive ? 'var(--sage)' : 'var(--text-primary)',
                    }}
                  >
                    {icon}
                    {label}
                  </span>
                  {count > 0 && (
                    <span className="text-10 rounded-pill bg-sage text-on-sage flex h-[18px] min-w-[18px] shrink-0 items-center justify-center px-1 font-bold">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>

      <div className="border-border-light flex shrink-0 items-center gap-3 border-t px-5 pt-[0.625rem] pb-4">
        <button
          onClick={onClear}
          className="text-14 text-text-secondary flex-1 cursor-pointer border-none bg-transparent py-3 font-semibold"
        >
          Clear filters
        </button>
        <button
          onClick={onApply}
          className="bg-sage text-on-sage text-15 [flex:2] cursor-pointer rounded border-none py-3 font-semibold"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
}
