'use client';

import React from 'react';
import { useApp, type HomeFilters, type HomeSortKey, HOME_DEFAULT_FILTERS } from '@/lib/context';
import { getMembershipLabel } from '@/lib/utils';
import { type MembershipStatus, type ChurchAttendance, type AppRole } from '@/lib/types';
import { MagnifyingGlass, X, ArrowsDownUp, Check } from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS, SORT_OPTIONS } from '@/lib/constants';

type FilterCategory = 'sort' | 'shepherd' | 'membership' | 'discipleship' | 'group' | 'app-role' | 'archive';

export default function FilterPanel({ show, onClose }: { show: boolean; onClose: () => void }): React.ReactNode {
  const {
    data,
    currentPersona,
    homeFilters: filters,
    setHomeFilters: setFilters,
    homeSortKey: sortKey,
    setHomeSortKey: setSortKey,
  } = useApp();

  const [, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<HomeFilters>(filters);
  const [draftSort, setDraftSort] = React.useState<HomeSortKey>(sortKey);
  const [activeCategory, setActiveCategory] = React.useState<FilterCategory>('shepherd');
  const [shepherdSearch, setShepherdSearch] = React.useState('');

  React.useEffect(() => {
    if (show) {
      setDraft(filters);
      setDraftSort(sortKey);
      setActiveCategory('shepherd');
      setShepherdSearch('');
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = (): void => {
    onClose();
    startTransition(() => {
      setFilters(draft);
      setSortKey(draftSort);
    });
  };

  const clearFilter = (): void => {
    setDraft({ ...HOME_DEFAULT_FILTERS, attendances: [] });
    setDraftSort('last-contacted');
    setShepherdSearch('');
  };

  const draftTotalCount =
    draft.shepherds.length +
    draft.memberships.length +
    draft.attendances.length +
    draft.groups.length +
    (draft.archiveFilter !== 'hide' ? 1 : 0) +
    draft.discipleship.length +
    draft.appRoles.length;

  const FILTER_CATEGORIES: Array<{ key: FilterCategory; label: string; count: number }> = [
    { key: 'shepherd', label: 'Shepherd by', count: draft.shepherds.length },
    { key: 'membership', label: 'Status', count: draft.memberships.length + draft.attendances.length },
    { key: 'archive', label: 'Archive', count: draft.archiveFilter !== 'hide' ? 1 : 0 },
    { key: 'discipleship', label: 'Discipleship', count: draft.discipleship.length },
    { key: 'group', label: 'Group', count: draft.groups.length },
    { key: 'app-role', label: 'App Role', count: draft.appRoles.length },
    { key: 'sort', label: 'Sort', count: 0 },
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Filter and Sort
            </h2>
            {draftTotalCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--sage)',
                  color: '#fff',
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
            {FILTER_CATEGORIES.map(({ key, label, count }) => {
              const isActive = activeCategory === key;
              return (
                <div key={key}>
                  {key === 'sort' && (
                    <div
                      style={{ height: 1, background: 'var(--border-light)', margin: '0 12px' }}
                    />
                  )}
                  <button
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      {key === 'sort' && <ArrowsDownUp size={13} style={{ flexShrink: 0 }} />}
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
                          color: '#fff',
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
                </div>
              );
            })}
          </div>

          {/* Right: options */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {activeCategory === 'sort' && (
              <>
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
                  Sort by
                </p>
                {SORT_OPTIONS.map((opt) => (
                  <RadioRow
                    key={opt.key}
                    selected={draftSort === opt.key}
                    onSelect={() => setDraftSort(opt.key)}
                  >
                    {opt.label}
                  </RadioRow>
                ))}
              </>
            )}

            {activeCategory === 'shepherd' && (
              <>
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
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {(currentPersona.role === 'admin' || currentPersona.role === 'shepherd') &&
                  'my sheep'.includes(shepherdSearch.toLowerCase()) && (
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
                {(() => {
                  const personaPersonIds = new Set(
                    data.personas.map((p) => p.personId).filter(Boolean)
                  );
                  const shepherdEntries: Array<{ id: string; name: string }> = [
                    ...data.personas
                      .filter((p) => p.role === 'shepherd' || p.role === 'admin')
                      .map((p) => ({ id: p.id, name: p.name })),
                    ...data.people
                      .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
                      .map((p) => ({ id: p.id, name: p.englishName })),
                  ];
                  return shepherdEntries
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
                    ));
                })()}
              </>
            )}

            {activeCategory === 'membership' && (
              <>
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
                  Membership
                </p>
                {(['member', 'non-member', 'membership-track'] as MembershipStatus[]).map((val) => (
                  <CheckRow
                    key={val}
                    checked={draft.memberships.includes(val)}
                    onToggle={() =>
                      setDraft((d) => ({
                        ...d,
                        memberships: d.memberships.includes(val)
                          ? d.memberships.filter((m) => m !== val)
                          : [...d.memberships, val],
                      }))
                    }
                  >
                    {getMembershipLabel(val)}
                  </CheckRow>
                ))}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
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
                    Attendance
                  </p>
                  {(
                    [
                      'first-time-visitor',
                      'regular',
                      'on-leave',
                      'fellowship-group-only',
                    ] as ChurchAttendance[]
                  ).map((val) => {
                    const ATTENDANCE_LABELS: Record<string, string> = {
                      'first-time-visitor': 'First-Time Visitor',
                      regular: 'Regular Attendee',
                      'on-leave': 'On Leave',
                      'fellowship-group-only': 'Fellowship Group Only',
                    };
                    return (
                      <CheckRow
                        key={val}
                        checked={draft.attendances.includes(val)}
                        onToggle={() =>
                          setDraft((d) => ({
                            ...d,
                            attendances: d.attendances.includes(val)
                              ? d.attendances.filter((a) => a !== val)
                              : [...d.attendances, val],
                          }))
                        }
                      >
                        {ATTENDANCE_LABELS[val]}
                      </CheckRow>
                    );
                  })}
                </div>
              </>
            )}

            {activeCategory === 'archive' && (
              <>
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
                  Archive
                </p>
                <RadioRow
                  selected={draft.archiveFilter === 'hide'}
                  onSelect={() => setDraft((d) => ({ ...d, archiveFilter: 'hide' }))}
                >
                  Hide archived
                </RadioRow>
                <RadioRow
                  selected={draft.archiveFilter === 'include'}
                  onSelect={() => setDraft((d) => ({ ...d, archiveFilter: 'include' }))}
                >
                  Include archived
                </RadioRow>
                <RadioRow
                  selected={draft.archiveFilter === 'only'}
                  onSelect={() => setDraft((d) => ({ ...d, archiveFilter: 'only' }))}
                >
                  Only archived
                </RadioRow>
              </>
            )}

            {activeCategory === 'discipleship' && (
              <>
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
                  Discipleship
                </p>
                <CheckRow
                  checked={draft.discipleship.includes('in')}
                  onToggle={() =>
                    setDraft((d) => ({
                      ...d,
                      discipleship: d.discipleship.includes('in')
                        ? d.discipleship.filter((x) => x !== 'in')
                        : [...d.discipleship, 'in'],
                    }))
                  }
                >
                  In discipleship
                </CheckRow>
                <CheckRow
                  checked={draft.discipleship.includes('not-in')}
                  onToggle={() =>
                    setDraft((d) => ({
                      ...d,
                      discipleship: d.discipleship.includes('not-in')
                        ? d.discipleship.filter((x) => x !== 'not-in')
                        : [...d.discipleship, 'not-in'],
                    }))
                  }
                >
                  Not in discipleship
                </CheckRow>
              </>
            )}

            {activeCategory === 'group' && (
              <>
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
                  Group
                </p>
                {data.groups.map((g) => (
                  <CheckRow
                    key={g.id}
                    checked={draft.groups.includes(g.id)}
                    onToggle={() =>
                      setDraft((d) => ({
                        ...d,
                        groups: d.groups.includes(g.id)
                          ? d.groups.filter((id) => id !== g.id)
                          : [...d.groups, g.id],
                      }))
                    }
                  >
                    {g.name}
                  </CheckRow>
                ))}
              </>
            )}

            {activeCategory === 'app-role' && (
              <>
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
                  App Role
                </p>
                {(['admin', 'shepherd', 'welcome-team', 'no-access'] as AppRole[]).map((role) => {
                  const labels: Record<AppRole, string> = {
                    admin: 'Admin',
                    shepherd: 'Shepherd',
                    'welcome-team': 'Welcome Team',
                    'no-access': 'No Access',
                  };
                  return (
                    <CheckRow
                      key={role}
                      checked={draft.appRoles.includes(role)}
                      onToggle={() =>
                        setDraft((d) => ({
                          ...d,
                          appRoles: d.appRoles.includes(role)
                            ? d.appRoles.filter((r) => r !== role)
                            : [...d.appRoles, role],
                        }))
                      }
                    >
                      {labels[role]}
                    </CheckRow>
                  );
                })}
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
