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
      <div className="flex items-center justify-between py-[0.875rem] px-5 pb-3 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2">
          <h2 className="text-16 font-bold text-text-primary">{title}</h2>
          {draftTotalCount > 0 && (
            <span className="text-11 font-bold py-0.5 px-2 rounded-pill bg-sage text-on-sage">
              {draftTotalCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-bg border-none cursor-pointer flex items-center justify-center text-text-muted"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[120px] bg-bg border-r border-border-light overflow-y-auto shrink-0">
          {categories.map(({ key, label, count, icon, hasDividerBefore }) => {
            const isActive = activeCategory === key;
            return (
              <div key={key}>
                {hasDividerBefore && <div className="h-px bg-[var(--border-light)] mx-3" />}
                <button
                  onClick={() => onCategoryChange(key)}
                  className="w-full py-[0.875rem] px-4 text-left border-none cursor-pointer flex items-center justify-between"
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
                    <span className="text-10 font-bold min-w-[18px] h-[18px] rounded-pill px-1 bg-sage text-on-sage flex items-center justify-center shrink-0">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-5">{children}</div>
      </div>

      <div className="pt-[0.625rem] px-5 pb-4 shrink-0 border-t border-border-light flex items-center gap-3">
        <button
          onClick={onClear}
          className="flex-1 bg-transparent border-none text-14 font-semibold text-text-secondary cursor-pointer py-3"
        >
          Clear filters
        </button>
        <button
          onClick={onApply}
          className="[flex:2] bg-sage text-on-sage border-none rounded py-3 text-15 font-semibold cursor-pointer"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
}
