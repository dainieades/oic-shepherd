'use client';

import { compareDesc, parseISO } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { type Note } from '@/lib/types';
import { getTimeAgo, getNoteTypeLabel, groupByMonth } from '@/lib/utils';
import { MagnifyingGlass, Funnel, X, Check, CaretDown, Plus } from '@phosphor-icons/react';
import AddLogModal from '@/components/AddLogModal';

const noteTypeColors: Record<string, { bg: string; color: string }> = {
  'check-in': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'prayer-request': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  event: { bg: 'var(--sage-light)', color: 'var(--sage)' },
  general: { bg: 'var(--sage-light)', color: 'var(--sage)' },
};

export default function LogsPage() {
  const {
    data,
    currentPersona,
    canViewNote,
    logsShepherdFilter: shepherdFilter,
    setLogsShepherdFilter: setShepherdFilter,
  } = useApp();
  const [showAddLog, setShowAddLog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = currentPersona.role === 'admin';

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shepherd filter (admin only): array of selected values, 'mine' = current persona's sheep
  const [showFilter, setShowFilter] = useState(false);
  const [draftFilter, setDraftFilter] = useState<string[]>(['mine']);
  const [shepherdSearch, setShepherdSearch] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset search when persona changes (filter reset is handled by context)
  useEffect(() => {
    setSearch('');
    setShowSearch(false);
  }, [currentPersona.id]);

  const openFilter = () => {
    setDraftFilter(shepherdFilter);
    setShepherdSearch('');
    setShowFilter(true);
  };
  const applyFilter = () => {
    setShepherdFilter(draftFilter);
    setShowFilter(false);
  };
  const clearFilter = () => {
    setDraftFilter([]);
  };

  // People accessible to each shepherd
  const shepherdPeopleIds = (shepherdId: string): string[] => {
    const persona = data.personas.find((p) => p.id === shepherdId);
    return persona?.assignedPeopleIds ?? [];
  };

  const noteMatchesShepherdFilter = (n: Note): boolean => {
    if (shepherdFilter.length === 0) return true; // no filter = show all
    return shepherdFilter.some((sid) => {
      const ids = sid === 'mine' ? currentPersona.assignedPeopleIds : shepherdPeopleIds(sid);
      if (n.personId) return ids.includes(n.personId);
      if (n.familyId) {
        const family = data.families.find((f) => f.id === n.familyId);
        return family ? family.memberIds.some((mid) => ids.includes(mid)) : false;
      }
      return n.createdBy === currentPersona.id; // unattached notes by self
    });
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
      if (isAdmin) return noteMatchesShepherdFilter(n) && noteMatchesSearch(n);
      // Shepherds: only their scope
      const inScope = (() => {
        if (n.personId && currentPersona.assignedPeopleIds.includes(n.personId)) return true;
        if (n.familyId) {
          const family = data.families.find((f) => f.id === n.familyId);
          if (
            family &&
            family.memberIds.some((mid) => currentPersona.assignedPeopleIds.includes(mid))
          )
            return true;
        }
        return false;
      })();
      return inScope && noteMatchesSearch(n);
    })
    .sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));

  const grouped = groupByMonth(visibleNotes);

  const activeFilterCount = shepherdFilter.length;
  const filterActive = isAdmin && activeFilterCount > 0;

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
      {/* Filter (admin only) */}
      {isAdmin && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={openFilter}
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
                color: '#fff',
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
      )}
      {/* Add log */}
      <button
        onClick={() => setShowAddLog(true)}
        style={{
          height: btnSize,
          padding: btnPad,
          borderRadius: 8,
          background: 'var(--sage)',
          color: '#fff',
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

      {/* Active filter chips (admin only) */}
      {isAdmin && shepherdFilter.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {shepherdFilter.map((sid) => {
            const label =
              sid === 'mine' ? 'My Sheep' : (data.personas.find((p) => p.id === sid)?.name ?? sid);
            return (
              <button
                key={sid}
                onClick={() => setShepherdFilter((f) => f.filter((s) => s !== sid))}
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
                {label}
                <X size={9} />
              </button>
            );
          })}
        </div>
      )}

      {visibleNotes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 32px 32px' }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            No logs yet
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: 260,
              margin: '0 auto',
            }}
          >
            Logs capture past interactions — a conversation, a check-in, a prayer request, or a
            moment you shared together.
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              maxWidth: 260,
              margin: '10px auto 0',
              fontWeight: 600,
            }}
          >
            Only assigned shepherds and pastors can see these.
          </p>
        </div>
      )}

      {grouped.map((group) => {
        const rows = group.items.map((note) => {
          const typeStyle = noteTypeColors[note.type] || noteTypeColors.general;
          const creator = data.personas.find((p) => p.id === note.createdBy);
          const person = note.personId ? data.people.find((p) => p.id === note.personId) : null;
          const family = note.familyId ? data.families.find((f) => f.id === note.familyId) : null;
          const targetChips = [family?.label, person?.englishName].filter(Boolean) as string[];
          return (
            <button
              key={note.id}
              className="row-card-hover"
              onClick={() => setEditingNote(note)}
              style={{
                paddingTop: 10,
                paddingBottom: 10,
                borderBottom: '1px solid var(--border-light)',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: 1,
                borderBottomColor: 'var(--border-light)',
                cursor: 'pointer',
                textAlign: 'left' as const,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      flexShrink: 0,
                    }}
                  >
                    {getNoteTypeLabel(note.type).toUpperCase()}
                  </span>
                  {targetChips.length > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--blue)',
                        fontWeight: 500,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'var(--blue-light)',
                        flexShrink: 0,
                      }}
                    >
                      {targetChips[0]}
                    </span>
                  )}
                  {targetChips.length > 1 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--blue)',
                        fontWeight: 500,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'var(--blue-light)',
                        flexShrink: 0,
                      }}
                    >
                      +{targetChips.length - 1}
                    </span>
                  )}
                </div>
                <span
                  style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}
                >
                  {getTimeAgo(note.createdAt)}
                </span>
              </div>
              {note.content && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {note.content}
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                by {creator?.name ?? 'Unknown'}
              </p>
            </button>
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

      {/* Filter bottom sheet (admin only) */}
      {showFilter && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30,26,24,0.45)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFilter(false);
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              background: 'var(--surface)',
              borderRadius: '20px 20px 0 0',
              width: '100%',
              maxWidth: 430,
              maxHeight: 'calc(100dvh - 80px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
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
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Filter
              </h2>
              <button
                onClick={() => setShowFilter(false)}
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

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Shepherd by
              </p>
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
                  checked={draftFilter.includes('mine')}
                  onToggle={() =>
                    setDraftFilter((d) =>
                      d.includes('mine') ? d.filter((s) => s !== 'mine') : [...d, 'mine']
                    )
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
                    checked={draftFilter.includes(e.id)}
                    onToggle={() =>
                      setDraftFilter((d) =>
                        d.includes(e.id) ? d.filter((s) => s !== e.id) : [...d, e.id]
                      )
                    }
                  >
                    {e.name}
                  </CheckRow>
                ))}
            </div>

            <div
              style={{
                padding: '10px 20px 16px',
                flexShrink: 0,
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
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
                Clear
              </button>
              <button
                onClick={applyFilter}
                style={{
                  flex: 2,
                  background: 'var(--sage)',
                  color: '#fff',
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
      )}
    </div>
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
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 0',
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
          borderRadius: 4,
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
      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{children}</span>
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
