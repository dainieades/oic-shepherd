'use client';

import {
  compareDesc,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  isWithinInterval,
} from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { type Note } from '@/lib/types';
import { groupByMonth, getNoteTypeLabel } from '@/lib/utils';
import {
  MagnifyingGlass,
  Funnel,
  X,
  CaretDown,
  Plus,
} from '@phosphor-icons/react';
import AddLogModal from '@/components/AddLogModal';
import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import LogsFilterPanel, {
  type LogsFilters,
  type DatePreset,
  LOGS_DEFAULT_FILTERS,
} from '@/components/LogsFilterPanel';

function getPresetInterval(preset: DatePreset): { start: Date; end: Date } | null {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'this-week':
      return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
    case 'this-month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last-30':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case 'last-3-months':
      return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
    case 'this-year':
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return null;
  }
}

export default function LogsPage() {
  const {
    data,
    currentPersona,
    canViewNote,
    logsShepherdFilter,
    setLogsShepherdFilter,
    setFullPageModalOpen,
  } = useApp();
  const [showAddLog, setShowAddLog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    setFullPageModalOpen(!!(showAddLog || editingNote));
    return () => setFullPageModalOpen(false);
  }, [showAddLog, editingNote, setFullPageModalOpen]);
  const isAdmin = currentPersona.role === 'admin';

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter panel
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<LogsFilters>({
    ...LOGS_DEFAULT_FILTERS,
    shepherds: logsShepherdFilter,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset search when persona changes
  useEffect(() => {
    setSearch('');
    setShowSearch(false);
  }, [currentPersona.id]);

  const handleApplyFilters = (next: LogsFilters) => {
    setFilters(next);
    setLogsShepherdFilter(next.shepherds);
  };

  const removeChip = (update: Partial<LogsFilters>) => {
    const next = { ...filters, ...update };
    setFilters(next);
    setLogsShepherdFilter(next.shepherds);
  };

  // Shepherd filter helpers
  const shepherdPeopleIds = (shepherdId: string): string[] => {
    const persona = data.personas.find((p) => p.id === shepherdId);
    return persona?.assignedPeopleIds ?? [];
  };

  const noteMatchesShepherd = (n: Note): boolean => {
    if (filters.shepherds.length === 0) return true;
    return filters.shepherds.some((sid) => {
      const ids =
        sid === 'mine' ? currentPersona.assignedPeopleIds : shepherdPeopleIds(sid);
      if (n.personId) return ids.includes(n.personId);
      if (n.familyId) {
        const family = data.families.find((f) => f.id === n.familyId);
        return family ? family.memberIds.some((mid) => ids.includes(mid)) : false;
      }
      return n.createdBy === currentPersona.id;
    });
  };

  const noteMatchesType = (n: Note): boolean => {
    if (filters.types.length === 0) return true;
    return filters.types.includes(n.type);
  };

  const noteMatchesDate = (n: Note): boolean => {
    if (!filters.datePreset) return true;
    const date = parseISO(n.createdAt);
    if (filters.datePreset === 'custom') {
      const from = filters.dateFrom ? startOfDay(parseISO(filters.dateFrom)) : null;
      const to = filters.dateTo ? endOfDay(parseISO(filters.dateTo)) : null;
      if (from && to) return isWithinInterval(date, { start: from, end: to });
      if (from) return date >= from;
      if (to) return date <= to;
      return true;
    }
    const interval = getPresetInterval(filters.datePreset);
    return interval ? isWithinInterval(date, interval) : true;
  };

  const noteMatchesSearch = (n: Note): boolean => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (n.content?.toLowerCase().includes(q)) return true;
    if (n.personId) {
      const p = data.people.find((p) => p.id === n.personId);
      if (p?.englishName.toLowerCase().includes(q) || p?.chineseName?.toLowerCase().includes(q))
        return true;
    }
    if (n.familyId) {
      const f = data.families.find((f) => f.id === n.familyId);
      if (f?.label.toLowerCase().includes(q)) return true;
    }
    return false;
  };

  const visibleNotes = data.notes
    .filter((n) => canViewNote(n))
    .filter((n) => {
      if (!noteMatchesType(n) || !noteMatchesDate(n) || !noteMatchesSearch(n)) return false;
      if (isAdmin) return noteMatchesShepherd(n);
      if (n.personId && currentPersona.assignedPeopleIds.includes(n.personId)) return true;
      if (n.familyId) {
        const family = data.families.find((f) => f.id === n.familyId);
        if (family && family.memberIds.some((mid) => currentPersona.assignedPeopleIds.includes(mid)))
          return true;
      }
      return false;
    })
    .sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));

  const grouped = groupByMonth(visibleNotes);

  const activeFilterCount =
    filters.types.length +
    (filters.datePreset ? 1 : 0) +
    (isAdmin ? filters.shepherds.length : 0);
  const filterActive = activeFilterCount > 0;

  const shepherdEntries = (() => {
    const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
    return [
      ...data.personas
        .filter((p) => (p.role === 'shepherd' || p.role === 'admin') && p.id !== currentPersona.id)
        .map((p) => ({ id: p.id, name: p.name })),
      ...data.people
        .filter(
          (p) => p.isShepherd && !personaPersonIds.has(p.id) && p.id !== currentPersona.personId
        )
        .map((p) => ({ id: p.id, name: p.englishName })),
    ];
  })();

  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 13 : 14;
  const btnPad = scrolled ? '0 12px' : '0 14px';

  const ActionButtons = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Search */}
      <button
        onClick={() => {
          if (showSearch) {
            setShowSearch(false);
            setSearch('');
          } else {
            setShowSearch(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
        }}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: 8,
          background: showSearch || search ? 'var(--sage-light)' : 'transparent',
          border: showSearch || search ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
          color: showSearch || search ? 'var(--sage)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <MagnifyingGlass size={14} />
      </button>

      {/* Filter */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowFilter(true)}
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: 8,
            background: filterActive ? 'var(--sage-light)' : 'transparent',
            border: filterActive ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
            color: filterActive ? 'var(--sage)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Funnel size={14} />
        </button>
        {filterActive && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Add log */}
      <button
        onClick={() => setShowAddLog(true)}
        style={{
          height: btnSize,
          padding: btnPad,
          borderRadius: 8,
          background: 'var(--sage)',
          color: 'var(--on-sage)',
          fontSize: btnFont,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Plus size={15} weight="bold" />
        Log
      </button>
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Sticky collapsing header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)',
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        {scrolled ? (
          <div
            style={{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Logs
            </span>
            <ActionButtons />
          </div>
        ) : (
          <div
            style={{
              paddingTop: 20,
              paddingBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Logs
            </h1>
            <ActionButtons />
          </div>
        )}
      </div>

      {/* Search bar */}
      {(showSearch || search) && (
        <div style={{ position: 'relative', marginBottom: 10, marginTop: 8 }}>
          <MagnifyingGlass
            size={14}
            color="var(--text-muted)"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs…"
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Active filter chips */}
      {filterActive && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {filters.types.map((t) => (
            <FilterChip
              key={t}
              onRemove={() => removeChip({ types: filters.types.filter((x) => x !== t) })}
            >
              {getNoteTypeLabel(t)}
            </FilterChip>
          ))}
          {filters.datePreset && (
            <FilterChip onRemove={() => removeChip({ datePreset: '', dateFrom: '', dateTo: '' })}>
              {filters.datePreset === 'custom'
                ? [filters.dateFrom, filters.dateTo].filter(Boolean).join(' – ') || 'Custom'
                : ({ today: 'Today', 'this-week': 'This week', 'this-month': 'This month', 'last-30': 'Last 30 days', 'last-3-months': 'Last 3 months', 'this-year': 'This year' } as Record<string, string>)[filters.datePreset] ?? filters.datePreset}
            </FilterChip>
          )}
          {isAdmin &&
            filters.shepherds.map((sid) => {
              const label =
                sid === 'mine'
                  ? 'My Sheep'
                  : (data.personas.find((p) => p.id === sid)?.name ?? sid);
              return (
                <FilterChip
                  key={sid}
                  onRemove={() =>
                    removeChip({ shepherds: filters.shepherds.filter((s) => s !== sid) })
                  }
                >
                  {label}
                </FilterChip>
              );
            })}
        </div>
      )}

      {visibleNotes.length === 0 && (
        <EmptyState
          title="No logs yet"
          description="Logs capture past interactions — a conversation, a check-in, a prayer request, or a moment you shared together."
          subtext="Only assigned shepherds and pastors can see these."
          padding="64px 32px 32px"
        />
      )}

      {grouped.map((group) => {
        const rows = group.items.map((note) => {
          const creator = data.personas.find((p) => p.id === note.createdBy);
          const person = note.personId ? data.people.find((p) => p.id === note.personId) : null;
          const family = note.familyId ? data.families.find((f) => f.id === note.familyId) : null;
          const targetChips: { label: string; isFamily: boolean }[] = [
            ...(family ? [{ label: family.label, isFamily: true }] : []),
            ...(person ? [{ label: person.englishName, isFamily: false }] : []),
          ];
          return (
            <LogItem
              key={note.id}
              note={note}
              onClick={() => setEditingNote(note)}
              creatorName={creator?.name}
              targetChips={targetChips}
            />
          );
        });
        return (
          <LogSection key={group.label} label={group.label} count={group.items.length}>
            <div
              className="no-last-border"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}
            >
              {rows}
            </div>
          </LogSection>
        );
      })}

      {showAddLog && <AddLogModal onClose={() => setShowAddLog(false)} />}
      {editingNote && <AddLogModal note={editingNote} onClose={() => setEditingNote(null)} />}

      <LogsFilterPanel
        show={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        onApply={handleApplyFilters}
        isAdmin={isAdmin}
        shepherdEntries={shepherdEntries}
        currentPersonaId={currentPersona.id}
      />
    </div>
  );
}

function FilterChip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: '999px',
        background: 'var(--sage-light)',
        border: '1px solid var(--sage-mid)',
        color: 'var(--sage-dark)',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
      <X size={9} />
    </button>
  );
}

function LogSection({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          marginBottom: open ? 8 : 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
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
