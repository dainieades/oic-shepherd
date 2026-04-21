'use client';

import React from 'react';
import { X, MagnifyingGlass, Check, ArrowsDownUp } from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';
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
}

export default function LogsFilterPanel({
  show,
  onClose,
  filters,
  onApply,
  isAdmin,
  shepherdEntries,
  currentPersonaId,
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

  React.useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [show]);

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
    ...(isAdmin ? [{ key: 'shepherd' as FilterCategory, label: 'Shepherd', count: shepherdCount, adminOnly: true }] : []),
  ];

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: BACKDROP_COLOR,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Filter</h2>
            {draftTotalCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--sage)',
                  color: 'var(--on-sage)',
                }}
              >
                {draftTotalCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--bg)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Two-column body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: category nav */}
          <div
            style={{
              width: 120,
              background: 'var(--bg)',
              borderRight: '1px solid var(--border-light)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {CATEGORIES.map(({ key, label, count }) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    textAlign: 'left',
                    background: isActive ? 'var(--surface)' : 'none',
                    border: 'none',
                    borderLeft: isActive ? '3px solid var(--sage)' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--sage)' : 'var(--text-primary)',
                    }}
                  >
                    {label}
                  </span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                        borderRadius: '999px',
                        padding: '0 4px',
                        background: 'var(--sage)',
                        color: 'var(--on-sage)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: options */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
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
                        types: d.types.includes(t)
                          ? d.types.filter((x) => x !== t)
                          : [...d.types, t],
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
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginBottom: 4,
                          fontWeight: 500,
                        }}
                      >
                        From
                      </p>
                      <input
                        type="date"
                        value={draft.dateFrom}
                        onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box' as const,
                        }}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginBottom: 4,
                          fontWeight: 500,
                        }}
                      >
                        To
                      </p>
                      <input
                        type="date"
                        value={draft.dateTo}
                        onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box' as const,
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeCategory === 'shepherd' && isAdmin && (
              <>
                <SectionLabel>Shepherd</SectionLabel>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <MagnifyingGlass
                    size={13}
                    color="var(--text-muted)"
                    style={{
                      position: 'absolute',
                      left: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={shepherdSearch}
                    onChange={(e) => setShepherdSearch(e.target.value)}
                    placeholder="Search…"
                    style={{
                      width: '100%',
                      paddingLeft: 28,
                      paddingRight: 10,
                      paddingTop: 7,
                      paddingBottom: 7,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                </div>
                {'my sheep'.includes(shepherdSearch.toLowerCase()) && (
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
                    My Sheep
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
          style={{
            padding: '10px 20px 16px',
            flexShrink: 0,
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={clearFilter}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '12px 0',
            }}
          >
            Clear filters
          </button>
          <button
            onClick={applyFilter}
            style={{
              flex: 2,
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '12px 0',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 2px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          flexShrink: 0,
          border: checked ? 'none' : '1.5px solid var(--border)',
          background: checked ? 'var(--sage)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={10} color="#fff" weight="bold" />}
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: checked ? 500 : 400 }}>
        {children}
      </span>
    </button>
  );
}

function RadioRow({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          flexShrink: 0,
          border: selected ? '2px solid var(--sage)' : '1.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />
        )}
      </div>
      <span
        style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: 'var(--text-primary)' }}
      >
        {children}
      </span>
    </button>
  );
}
