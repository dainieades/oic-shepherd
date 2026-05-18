'use client';

import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { CheckRow } from './CheckRow';
import { RadioRow } from './RadioRow';
import { SectionLabel } from './SectionLabel';
import { FilterPanelBase } from './FilterPanelBase';
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

  const CATEGORIES = [
    { key: 'type' as FilterCategory, label: 'Log type', count: typeCount },
    { key: 'date' as FilterCategory, label: 'Date logged', count: dateCount },
    ...(isAdmin
      ? [{ key: 'shepherd' as FilterCategory, label: 'Shepherd', count: shepherdCount }]
      : []),
  ];

  return (
    <FilterPanelBase
      show={show}
      onClose={onClose}
      title="Filter"
      draftTotalCount={draftTotalCount}
      categories={CATEGORIES}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      onApply={applyFilter}
      onClear={clearFilter}
    >
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
                <p className="text-11 text-text-muted mb-1 font-medium">From</p>
                <input
                  type="date"
                  value={draft.dateFrom}
                  onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                  className="w-full py-[0.4375rem] px-2.5 bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
                />
              </div>
              <div>
                <p className="text-11 text-text-muted mb-1 font-medium">To</p>
                <input
                  type="date"
                  value={draft.dateTo}
                  onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                  className="w-full py-[0.4375rem] px-2.5 bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
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
              className="w-full pl-7 pr-2.5 py-[7px] bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
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
    </FilterPanelBase>
  );
}
