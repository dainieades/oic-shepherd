'use client';

import React from 'react';
import { X, MagnifyingGlass, ArrowsDownUp } from '@phosphor-icons/react';
import { BottomSheet } from './BottomSheet';
import { CheckRow } from './CheckRow';
import { RadioRow } from './RadioRow';
import { SectionLabel } from './SectionLabel';
import { getNoteTypeLabel } from '@/lib/utils';
import { type NoteType } from '@/lib/types';

export const NOTE_TYPES: NoteType[] = ['check-in', 'prayer-request', 'event', 'general'];

export type DatePreset =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'last-30'
  | 'last-3-months'
  | 'this-year'
  | 'custom'
  | '';

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

export interface LogsFilters {
  types: NoteType[];
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  shepherds: string[];
}

export const LOGS_DEFAULT_FILTERS: LogsFilters = {
  types: [],
  datePreset: '',
  dateFrom: '',
  dateTo: '',
  shepherds: [],
};

type FilterCategory = 'type' | 'date' | 'shepherd';

interface ShepherdEntry {
  id: string;
  name: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  filters: LogsFilters;
  onApply: (filters: LogsFilters) => void;
  isAdmin: boolean;
  shepherdEntries: ShepherdEntry[];
  currentPersonaId: string;
  currentPersonaName: string;
}

export default function LogsFilterPanel({
  show,
  onClose,
  filters,
  onApply,
  isAdmin,
  shepherdEntries,
  currentPersonaId,
  currentPersonaName,
}: Props): React.ReactNode {
  const [draft, setDraft] = React.useState<LogsFilters>(filters);
  const [activeCategory, setActiveCategory] = React.useState<FilterCategory>('type');
  const [shepherdSearch, setShepherdSearch] = React.useState('');

  React.useEffect(() => {
    if (show) {
      setDraft(filters);
      setActiveCategory('type');
      setShepherdSearch('');
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = (): void => {
    onApply(draft);
    onClose();
  };

  const clearFilter = (): void => {
    setDraft(LOGS_DEFAULT_FILTERS);
    setShepherdSearch('');
  };

  const typeCount = draft.types.length;
  const dateCount = draft.datePreset ? 1 : 0;
  const shepherdCount = draft.shepherds.length;
  const draftTotalCount = typeCount + dateCount + shepherdCount;

  type CategoryDef = { key: FilterCategory; label: string; count: number; adminOnly?: boolean };
  const CATEGORIES: CategoryDef[] = [
    { key: 'type', label: 'Log type', count: typeCount },
    { key: 'date', label: 'Date logged', count: dateCount },
    ...(isAdmin
      ? [
          {
            key: 'shepherd' as FilterCategory,
            label: 'Shepherd',
            count: shepherdCount,
            adminOnly: true,
          },
        ]
      : []),
  ];

  if (!show) return null;

  return (
    <BottomSheet onClose={onClose} zIndex={50} allowBackdropClose>
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0 border-b border-border-light"
        style={{ padding: '0.875rem 1.25rem 0.75rem' }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-16 font-bold text-text-primary">Filter</h2>
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

      {/* Two-column body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: category nav */}
        <div className="w-[120px] bg-bg border-r border-border-light overflow-y-auto shrink-0">
          {CATEGORIES.map(({ key, label, count }) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="w-full text-left border-none cursor-pointer flex items-center justify-between py-3.5 px-4"
                style={{
                  background: isActive ? 'var(--surface)' : 'none',
                  borderLeft: isActive
                    ? '0.1875rem solid var(--sage)'
                    : '0.1875rem solid transparent',
                }}
              >
                <span
                  className="text-14"
                  style={{
                    fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isActive ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {label}
                </span>
                {count > 0 && (
                  <span className="text-10 font-bold min-w-[18px] h-[18px] rounded-pill px-1 bg-sage text-on-sage flex items-center justify-center shrink-0">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: options */}
        <div className="flex-1 overflow-y-auto py-4 px-5">
          {activeCategory === 'type' && (
            <>
              <SectionLabel>Log type</SectionLabel>
              {NOTE_TYPES.map((t) => (
                <CheckRow
                  key={t}
                  checked={draft.types.includes(t)}
                  onToggle={() =>
                    setDraft((d) => ({
                      ...d,
                      types: d.types.includes(t) ? d.types.filter((x) => x !== t) : [...d.types, t],
                    }))
                  }
                >
                  {getNoteTypeLabel(t)}
                </CheckRow>
              ))}
            </>
          )}

          {activeCategory === 'date' && (
            <>
              <SectionLabel>Date logged</SectionLabel>
              {DATE_PRESETS.map((preset) => (
                <RadioRow
                  key={preset.value}
                  selected={draft.datePreset === preset.value}
                  onSelect={() =>
                    setDraft((d) => ({
                      ...d,
                      datePreset: d.datePreset === preset.value ? '' : preset.value,
                      dateFrom: d.datePreset === preset.value ? '' : d.dateFrom,
                      dateTo: d.datePreset === preset.value ? '' : d.dateTo,
                    }))
                  }
                >
                  {preset.label}
                </RadioRow>
              ))}
              {draft.datePreset === 'custom' && (
                <div className="mt-4 flex flex-col gap-2.5">
                  <div>
                    <p className="text-11 text-text-muted mb-1 font-medium">
                      From
                    </p>
                    <input
                      type="date"
                      value={draft.dateFrom}
                      onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                      className="w-full bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
                      style={{ padding: '0.4375rem 0.625rem' }}
                    />
                  </div>
                  <div>
                    <p className="text-11 text-text-muted mb-1 font-medium">
                      To
                    </p>
                    <input
                      type="date"
                      value={draft.dateTo}
                      onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                      className="w-full bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
                      style={{ padding: '0.4375rem 0.625rem' }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeCategory === 'shepherd' && isAdmin && (
            <>
              <SectionLabel>Shepherd</SectionLabel>
              <div className="relative mb-2.5">
                <MagnifyingGlass
                  size={13}
                  color="var(--text-muted)"
                  className="absolute left-[9px] top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="text"
                  value={shepherdSearch}
                  onChange={(e) => setShepherdSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
                  style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7 }}
                />
              </div>
              {('my sheep'.includes(shepherdSearch.toLowerCase()) ||
                currentPersonaName.toLowerCase().includes(shepherdSearch.toLowerCase())) && (
                <CheckRow
                  checked={draft.shepherds.includes('mine')}
                  onToggle={() =>
                    setDraft((d) => ({
                      ...d,
                      shepherds: d.shepherds.includes('mine')
                        ? d.shepherds.filter((s) => s !== 'mine')
                        : [...d.shepherds, 'mine'],
                    }))
                  }
                >
                  My Sheep ({currentPersonaName})
                </CheckRow>
              )}
              {shepherdEntries
                .filter(
                  (e) =>
                    shepherdSearch === '' ||
                    e.name.toLowerCase().includes(shepherdSearch.toLowerCase())
                )
                .map((e) => (
                  <CheckRow
                    key={e.id}
                    checked={draft.shepherds.includes(e.id)}
                    onToggle={() =>
                      setDraft((d) => ({
                        ...d,
                        shepherds: d.shepherds.includes(e.id)
                          ? d.shepherds.filter((s) => s !== e.id)
                          : [...d.shepherds, e.id],
                      }))
                    }
                  >
                    {e.name}
                  </CheckRow>
                ))}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="shrink-0 border-t border-border-light flex items-center gap-3"
        style={{ padding: '0.625rem 1.25rem 1rem' }}
      >
        <button
          onClick={clearFilter}
          className="flex-1 bg-transparent border-none text-14 font-semibold text-text-secondary cursor-pointer py-3"
        >
          Clear filters
        </button>
        <button
          onClick={applyFilter}
          className="flex-[2] bg-sage text-on-sage border-none rounded py-3 text-15 font-semibold cursor-pointer"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
}
