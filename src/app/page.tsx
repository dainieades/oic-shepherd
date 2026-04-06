'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  getPriorityScore, getTimeAgo,
  searchFamiliesAndPeople, getFamilyLastContact, getFamilyPriorityScore,
  getMembershipLabel,
} from '@/lib/utils';
import { Family, Person, MembershipStatus, AppRole } from '@/lib/types';
import { HandHeart, UserPlus, UsersThree, PaperPlaneTilt } from '@phosphor-icons/react';
import AddPersonModal from '@/components/AddPersonModal';
import AddFamilyModal from '@/components/AddFamilyModal';
import InviteSheet from '@/components/InviteSheet';

type SortKey = 'last-contacted' | 'last-contacted-recent' | 'name' | 'group';

// Multi-select filter model. Empty array = no restriction ("all").
// shepherds: 'mine' is a special value meaning the current persona's assigned people.
// showArchived is a separate dimension — archive status is hidden by default.
interface Filters {
  shepherds: string[];      // 'mine' | shepherdId[]
  memberships: MembershipStatus[];
  groups: string[];
  showArchived: boolean;
  discipleship: ('in' | 'not-in')[];
  appRoles: AppRole[];
}

const DEFAULT_FILTERS: Filters = { shepherds: ['mine'], memberships: [], groups: [], showArchived: false, discipleship: [], appRoles: [] };

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'last-contacted',        label: 'Logged longest ago' },
  { key: 'last-contacted-recent', label: 'Logged most recently' },
  { key: 'name',                  label: 'Name A → Z' },
  { key: 'group',                 label: 'Group A → Z' },
];

export default function PeoplePage() {
  const { data, currentPersona } = useApp();
  const [search, setSearch]        = useState('');
  const [sortKey, setSortKey]      = useState<SortKey>('last-contacted');
  const startFilters = currentPersona.role === 'welcome-team'
    ? { ...DEFAULT_FILTERS, shepherds: [] }
    : DEFAULT_FILTERS;
  const [filters, setFilters]      = useState<Filters>(startFilters);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter]= useState(false);
  const [showSort, setShowSort]    = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft]          = useState<Filters>(startFilters);
  const [draftSort, setDraftSort]  = useState<SortKey>('last-contacted');
  const [activeCategory, setActiveCategory] = useState<'sort' | 'shepherd' | 'membership' | 'discipleship' | 'group' | 'app-role'>('shepherd');
  const [shepherdSearch, setShepherdSearch] = useState('');
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentPersona.role === 'admin';

  useEffect(() => {
    const resetFilters = currentPersona.role === 'welcome-team'
      ? { ...DEFAULT_FILTERS, shepherds: [] }
      : DEFAULT_FILTERS;
    setFilters(resetFilters);
    setDraft(resetFilters);
  }, [currentPersona.id]);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openFilter  = () => { setDraft(filters); setDraftSort(sortKey); setActiveCategory('shepherd'); setShepherdSearch(''); setShowFilter(true); };
  const applyFilter = () => { setFilters(draft); setSortKey(draftSort); setShowFilter(false); };
  const clearFilter = () => { setDraft(DEFAULT_FILTERS); setDraftSort('last-contacted'); setShepherdSearch(''); };

  // Build the list: families + solo individuals
  const entries = useMemo(() => {
    const { families: matchedFamilies, individuals } = searchFamiliesAndPeople(search, data.families, data.people);

    type Entry = { type: 'family'; family: Family; members: Person[] } | { type: 'individual'; person: Person };
    const entries: Entry[] = [];

    const includesMine = filters.shepherds.includes('mine');
    const specificShepherdIds = filters.shepherds.filter((s) => s !== 'mine');

    // Pre-compute last note timestamp per person (for sort)
    const lastNoteTime: Record<string, number> = {};
    for (const note of data.notes) {
      const pids: string[] = note.personId
        ? [note.personId]
        : note.familyId
        ? (data.families.find((f) => f.id === note.familyId)?.memberIds ?? [])
        : [];
      const t = new Date(note.createdAt).getTime();
      for (const pid of pids) {
        if (!lastNoteTime[pid] || t > lastNoteTime[pid]) lastNoteTime[pid] = t;
      }
    }

    for (const f of matchedFamilies) {
      const members = data.people.filter((p) => f.memberIds.includes(p.id));

      // Shepherd filter (OR across selected options)
      if (filters.shepherds.length > 0) {
        const matchesMine = includesMine && members.some((m) => currentPersona.assignedPeopleIds.includes(m.id));
        const matchesSpecific = specificShepherdIds.some((sid) => members.some((m) => m.assignedShepherdIds.includes(sid)));
        if (!matchesMine && !matchesSpecific) continue;
      }
      // Archive gate — skip fully-archived families unless showArchived is on
      if (!filters.showArchived && members.every((m) => m.membershipStatus === 'archive')) continue;
      // Membership filter (OR across selected)
      if (filters.memberships.length > 0 && !members.some((m) => filters.memberships.includes(m.membershipStatus))) continue;
      // Group filter (OR across selected)
      if (filters.groups.length > 0 && !members.some((m) => filters.groups.some((gid) => m.groupIds.includes(gid)))) continue;
      // Discipleship filter — OR logic: family passes if any member matches at least one selected state
      if (filters.discipleship.length > 0) {
        const passes = members.some((m) =>
          (filters.discipleship.includes('in') && m.isBeingDiscipled) ||
          (filters.discipleship.includes('not-in') && !m.isBeingDiscipled)
        );
        if (!passes) continue;
      }
      // App role filter
      if (filters.appRoles.length > 0 && !members.some((m) => filters.appRoles.includes(m.appRole ?? 'no-access'))) continue;

      entries.push({ type: 'family', family: f, members });
    }

    for (const p of individuals) {
      // Shepherd filter
      if (filters.shepherds.length > 0) {
        const matchesMine = includesMine && currentPersona.assignedPeopleIds.includes(p.id);
        const matchesSpecific = specificShepherdIds.some((sid) => p.assignedShepherdIds.includes(sid));
        if (!matchesMine && !matchesSpecific) continue;
      }
      // Archive gate — skip archived individuals unless showArchived is on
      if (!filters.showArchived && p.membershipStatus === 'archive') continue;
      if (filters.memberships.length > 0 && !filters.memberships.includes(p.membershipStatus)) continue;
      if (filters.groups.length > 0 && !filters.groups.some((gid) => p.groupIds.includes(gid))) continue;
      if (filters.discipleship.length > 0) {
        const passes =
          (filters.discipleship.includes('in') && p.isBeingDiscipled) ||
          (filters.discipleship.includes('not-in') && !p.isBeingDiscipled);
        if (!passes) continue;
      }
      if (filters.appRoles.length > 0 && !filters.appRoles.includes(p.appRole ?? 'no-access')) continue;
      entries.push({ type: 'individual', person: p });
    }

    // Sort
    entries.sort((a, b) => {
      const aMembers = a.type === 'family' ? a.members : [a.person];
      const bMembers = b.type === 'family' ? b.members : [b.person];
      const aName = a.type === 'family' ? a.family.label : a.person.englishName;
      const bName = b.type === 'family' ? b.family.label : b.person.englishName;

      switch (sortKey) {
        case 'name':
          return aName.localeCompare(bName);
        case 'last-contacted': {
          // Oldest / never-logged first (needs follow-up most urgently)
          const aTime = Math.max(0, ...aMembers.map((m) => lastNoteTime[m.id] ?? 0));
          const bTime = Math.max(0, ...bMembers.map((m) => lastNoteTime[m.id] ?? 0));
          if (aTime !== bTime) return aTime - bTime;
          return aName.localeCompare(bName);
        }
        case 'last-contacted-recent': {
          // Most recently logged first
          const aTime = Math.max(0, ...aMembers.map((m) => lastNoteTime[m.id] ?? 0));
          const bTime = Math.max(0, ...bMembers.map((m) => lastNoteTime[m.id] ?? 0));
          if (aTime !== bTime) return bTime - aTime;
          return aName.localeCompare(bName);
        }
        case 'group': {
          const aGroup = aMembers.flatMap((m) => m.groupIds).map((id) => data.groups.find((g) => g.id === id)?.name || '').sort()[0] || 'zzz';
          const bGroup = bMembers.flatMap((m) => m.groupIds).map((id) => data.groups.find((g) => g.id === id)?.name || '').sort()[0] || 'zzz';
          return aGroup.localeCompare(bGroup);
        }
        default: // priority
          return getFamilyPriorityScore(bMembers) - getFamilyPriorityScore(aMembers);
      }
    });

    return entries;
  }, [data, search, filters, sortKey, isAdmin, currentPersona]);

  // New people: created in the last 60 days, no notes yet, not archived
  const newPeople = useMemo(() => {
    if (currentPersona.role === 'welcome-team') return [];
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const notedPersonIds = new Set(data.notes.map((n) => n.personId).filter(Boolean) as string[]);
    return data.people
      .filter((p) => {
        if (p.membershipStatus === 'archive') return false;
        if (notedPersonIds.has(p.id)) return false;
        if (new Date(p.createdAt).getTime() < cutoff) return false;
        if (currentPersona.role === 'shepherd') return currentPersona.assignedPeopleIds.includes(p.id);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.people, data.notes, currentPersona]);

  const activeFilterCount =
    filters.shepherds.length + filters.memberships.length + filters.groups.length
    + (filters.showArchived ? 1 : 0) + filters.discipleship.length + filters.appRoles.length;

  const draftTotalCount =
    draft.shepherds.length + draft.memberships.length + draft.groups.length
    + (draft.showArchived ? 1 : 0) + draft.discipleship.length + draft.appRoles.length;
  const FILTER_CATEGORIES = [
    { key: 'shepherd' as const,     label: 'Shepherd by',  count: draft.shepherds.length },
    { key: 'membership' as const,   label: 'Status',       count: draft.memberships.length + (draft.showArchived ? 1 : 0) },
    { key: 'discipleship' as const, label: 'Discipleship', count: draft.discipleship.length },
    { key: 'group' as const,        label: 'Group',        count: draft.groups.length },
    { key: 'app-role' as const,     label: 'App Role',     count: draft.appRoles.length },
    { key: 'sort' as const,         label: 'Sort',         count: 0 },
  ];

  const chips: { key: string; label: string; clear: () => void }[] = [];
  filters.shepherds.forEach((sid) => {
    const label = sid === 'mine' ? 'My Sheep' : (data.personas.find((p) => p.id === sid)?.name ?? sid);
    chips.push({ key: `s-${sid}`, label, clear: () => setFilters((f) => ({ ...f, shepherds: f.shepherds.filter((s) => s !== sid) })) });
  });
  filters.memberships.forEach((ms) => {
    chips.push({ key: `m-${ms}`, label: getMembershipLabel(ms), clear: () => setFilters((f) => ({ ...f, memberships: f.memberships.filter((m) => m !== ms) })) });
  });
  filters.groups.forEach((gid) => {
    const g = data.groups.find((g) => g.id === gid);
    chips.push({ key: `g-${gid}`, label: g?.name ?? gid, clear: () => setFilters((f) => ({ ...f, groups: f.groups.filter((g) => g !== gid) })) });
  });
  if (filters.showArchived) {
    chips.push({ key: 'show-archived', label: 'Archived', clear: () => setFilters((f) => ({ ...f, showArchived: false })) });
  }
  const DISCIPLESHIP_LABELS: Record<'in' | 'not-in', string> = { 'in': 'In discipleship', 'not-in': 'Not in discipleship' };
  filters.discipleship.forEach((d) => {
    chips.push({ key: `d-${d}`, label: DISCIPLESHIP_LABELS[d], clear: () => setFilters((f) => ({ ...f, discipleship: f.discipleship.filter((x) => x !== d) })) });
  });
  const APP_ROLE_LABELS: Record<AppRole, string> = { admin: 'Admin', shepherd: 'Shepherd', 'welcome-team': 'Welcome Team', 'no-access': 'No Access' };
  filters.appRoles.forEach((r) => {
    chips.push({ key: `ar-${r}`, label: APP_ROLE_LABELS[r], clear: () => setFilters((f) => ({ ...f, appRoles: f.appRoles.filter((x) => x !== r) })) });
  });

  const familyCount = entries.filter((e) => e.type === 'family').length;
  const individualCount = entries.filter((e) => e.type === 'individual').length;
  const totalEntries = familyCount + individualCount;
  const currentSort = SORT_OPTIONS.find((s) => s.key === sortKey) ?? SORT_OPTIONS[0];

  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 13 : 14;
  const btnPad  = scrolled ? '0 12px' : '0 14px';

  const ActionButtons = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Search button */}
      <button
        onClick={() => {
          if (showSearch) { setShowSearch(false); setSearch(''); }
          else { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }
        }}
        style={{
          width: btnSize, height: btnSize, borderRadius: 8,
          background: (showSearch || search) ? 'var(--sage-light)' : 'transparent',
          border: (showSearch || search) ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
          color: (showSearch || search) ? 'var(--sage)' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>
      {/* Filter button */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={openFilter}
          style={{
            width: btnSize, height: btnSize, borderRadius: 8,
            background: activeFilterCount > 0 ? 'var(--sage-light)' : 'transparent',
            border: activeFilterCount > 0 ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
            color: activeFilterCount > 0 ? 'var(--sage)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
        </button>
        {activeFilterCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            width: 15, height: 15, borderRadius: '50%',
            background: 'var(--sage)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {activeFilterCount}
          </span>
        )}
      </div>
      {/* Add button */}
      <button
        onClick={() => setShowAddChoice(true)}
        style={{ height: btnSize, padding: btnPad, borderRadius: 8, background: 'var(--sage)', color: '#fff', fontSize: btnFont, fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        + Add
      </button>
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── Sticky collapsing header ─────────── */}
      <div style={{
        position: 'sticky', top: 36, zIndex: 20,
        background: 'var(--bg)',
        marginLeft: -16, marginRight: -16,
        paddingLeft: 16, paddingRight: 16,
        borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
      }}>
        {scrolled ? (
          <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>People</span>
            <ActionButtons />
          </div>
        ) : (
          <div style={{ paddingTop: 20, paddingBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>People</h1>
            <ActionButtons />
          </div>
        )}
      </div>

      {/* ── Search (expandable) ─────────────── */}
      {(showSearch || search) && (
        <div style={{ position: 'relative', marginBottom: 10, marginTop: 8 }}>
          <svg
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.8}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or 中文…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
      )}

      {/* ── Active filter chips ────────────── */}
      {chips.length > 0 && (
        <div className="flex gap-1.5 mb-2.5 overflow-x-auto no-scrollbar" style={{ paddingBottom: 2 }}>
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: '999px',
                background: 'var(--sage-light)', border: '1px solid var(--sage-mid)',
                color: 'var(--sage-dark)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {chip.label}
              <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* ── New people alert ──────────────── */}
      {newPeople.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              New · needs first contact
            </span>
            <span style={{
              minWidth: 16, height: 16, borderRadius: '999px',
              background: '#fef3c7', border: '1px solid #fcd34d',
              color: '#92400e', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>
              {newPeople.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {newPeople.map((p) => {
              const initials = p.englishName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              const ms = Date.now() - new Date(p.createdAt).getTime();
              const hoursAgo = Math.floor(ms / 3600000);
              const daysAgo = Math.floor(ms / 86400000);
              const timeLabel = hoursAgo < 24 ? `${hoursAgo}h` : daysAgo < 14 ? `${daysAgo}d` : `${Math.floor(daysAgo / 7)}w`;
              return (
                <Link
                  key={p.id}
                  href={`/person/${p.id}`}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', width: 64 }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#fef3c7', border: '2px solid #fcd34d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#92400e',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {p.photo
                      ? <img src={p.photo} alt={p.englishName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.englishName.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: 9, color: '#b45309', fontWeight: 500, marginTop: -2 }}>{timeLabel} ago</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Count + Sort ──────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
          {totalEntries} {familyCount > 0 ? `families` : 'people'}
          {individualCount > 0 && familyCount > 0 ? ` + ${individualCount} individual${individualCount !== 1 ? 's' : ''}` : ''}
        </span>

        <div ref={sortRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSort(!showSort)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', background: 'transparent', border: 'none',
              fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500,
            }}
          >
            {currentSort.label}
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </button>

          {showSort && (
            <div
              className="animate-pop-in"
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: 'var(--shadow-elevated)',
                zIndex: 30, minWidth: 160, padding: '4px 0',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortKey(opt.key); setShowSort(false); }}
                  style={{
                    width: '100%', padding: '8px 14px', textAlign: 'left',
                    fontSize: 13, fontWeight: sortKey === opt.key ? 600 : 400,
                    color: sortKey === opt.key ? 'var(--sage)' : 'var(--text-primary)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── List ──────────────────────────── */}
      <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {entries.map((entry) =>
          entry.type === 'family'
            ? <FamilyRow key={entry.family.id} family={entry.family} members={entry.members} />
            : <IndividualRow key={entry.person.id} person={entry.person} />
        )}
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 48, color: 'var(--text-muted)', fontSize: 14 }}>
            {filters.shepherds.length > 0 && !isAdmin && filters.shepherds.every((s) => s === 'mine')
              ? 'No one assigned to you yet.'
              : 'No people found.'}
          </div>
        )}
      </div>

      {showAddPerson && <AddPersonModal onClose={() => setShowAddPerson(false)} />}
      {showAddFamily && <AddFamilyModal onClose={() => setShowAddFamily(false)} />}
      {showInvite && <InviteSheet onClose={() => setShowInvite(false)} />}

      {/* ── Add type choice sheet ── */}
      {showAddChoice && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddChoice(false); }}
        >
          <div
            className="animate-slide-up"
            style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
          >
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 10px' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>Add</p>
            <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setShowAddChoice(false); setShowAddPerson(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={20} color="var(--sage)" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Individual</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Add a single person to the directory</p>
                </div>
              </button>
              <button
                onClick={() => { setShowAddChoice(false); setShowAddFamily(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UsersThree size={20} color="var(--sage)" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Family</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Group existing individuals into a family</p>
                </div>
              </button>
              <button
                onClick={() => { setShowAddChoice(false); setShowInvite(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PaperPlaneTilt size={20} color="var(--sage)" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Invite to app</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Give someone access to sign in</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter panel (bottom sheet) ────── */}
      {showFilter && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowFilter(false); }}
          >
            <div
              className="animate-slide-up"
              style={{
                background: 'var(--surface)', borderRadius: '20px 20px 0 0',
                width: '100%', maxWidth: 430,
                height: 'calc(100dvh - 48px)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 0', flexShrink: 0 }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Filter</h2>
                  {draftTotalCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'var(--sage)', color: '#fff' }}>
                      {draftTotalCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilter(false)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Two-column body */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Left: category nav */}
                <div style={{ width: 120, background: 'var(--bg)', borderRight: '1px solid var(--border-light)', overflowY: 'auto', flexShrink: 0 }}>
                  {FILTER_CATEGORIES.map(({ key, label, count }) => {
                    const isActive = activeCategory === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        style={{
                          width: '100%', padding: '14px 16px',
                          textAlign: 'left', background: isActive ? 'var(--surface)' : 'none',
                          border: 'none', borderLeft: isActive ? '3px solid var(--sage)' : '3px solid transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--sage)' : 'var(--text-primary)' }}>{label}</span>
                        {count > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            minWidth: 18, height: 18, borderRadius: '999px',
                            padding: '0 4px',
                            background: 'var(--sage)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right: options */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

                  {activeCategory === 'sort' && (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Sort by</p>
                      {SORT_OPTIONS.map((opt) => (
                        <RadioRow key={opt.key} selected={draftSort === opt.key} onSelect={() => setDraftSort(opt.key)}>
                          {opt.label}
                        </RadioRow>
                      ))}
                    </>
                  )}

                  {activeCategory === 'shepherd' && (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Shepherd by</p>
                      <div style={{ position: 'relative', marginBottom: 10 }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}
                          style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                          type="text"
                          value={shepherdSearch}
                          onChange={(e) => setShepherdSearch(e.target.value)}
                          placeholder="Search…"
                          style={{
                            width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                            background: 'var(--bg)', border: '1px solid var(--border)',
                            borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      {(currentPersona.role === 'admin' || currentPersona.role === 'shepherd') && 'my sheep'.includes(shepherdSearch.toLowerCase()) && (
                        <CheckRow
                          checked={draft.shepherds.includes('mine')}
                          onToggle={() => setDraft((d) => ({ ...d, shepherds: d.shepherds.includes('mine') ? d.shepherds.filter((s) => s !== 'mine') : [...d.shepherds, 'mine'] }))}
                        >My Sheep</CheckRow>
                      )}
                      {(() => {
                        const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
                        const shepherdEntries: { id: string; name: string }[] = [
                          ...data.personas
                            .filter((p) => p.role === 'shepherd' || p.role === 'admin')
                            .map((p) => ({ id: p.id, name: p.name })),
                          ...data.people
                            .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
                            .map((p) => ({ id: p.id, name: p.englishName })),
                        ];
                        return shepherdEntries
                          .filter((e) => shepherdSearch === '' || e.name.toLowerCase().includes(shepherdSearch.toLowerCase()))
                          .map((e) => (
                            <CheckRow
                              key={e.id}
                              checked={draft.shepherds.includes(e.id)}
                              onToggle={() => setDraft((d) => ({ ...d, shepherds: d.shepherds.includes(e.id) ? d.shepherds.filter((s) => s !== e.id) : [...d.shepherds, e.id] }))}
                            >{e.name}</CheckRow>
                          ));
                      })()}
                    </>
                  )}

                  {activeCategory === 'membership' && (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Status</p>
                      {(['member', 'sunday-attendee', 'fellowship-attendee', 'membership-class'] as const).map((val) => (
                        <CheckRow
                          key={val}
                          checked={draft.memberships.includes(val)}
                          onToggle={() => setDraft((d) => ({ ...d, memberships: d.memberships.includes(val) ? d.memberships.filter((m) => m !== val) : [...d.memberships, val] }))}
                        >{getMembershipLabel(val)}</CheckRow>
                      ))}
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                        <CheckRow
                          checked={draft.showArchived}
                          onToggle={() => setDraft((d) => ({ ...d, showArchived: !d.showArchived }))}
                        >Show archived</CheckRow>
                      </div>
                    </>
                  )}

                  {activeCategory === 'discipleship' && (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Discipleship</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>Filter by whether someone is currently in a discipleship relationship.</p>
                      <CheckRow
                        checked={draft.discipleship.includes('in')}
                        onToggle={() => setDraft((d) => ({ ...d, discipleship: d.discipleship.includes('in') ? d.discipleship.filter((x) => x !== 'in') : [...d.discipleship, 'in'] }))}
                      >In discipleship</CheckRow>
                      <CheckRow
                        checked={draft.discipleship.includes('not-in')}
                        onToggle={() => setDraft((d) => ({ ...d, discipleship: d.discipleship.includes('not-in') ? d.discipleship.filter((x) => x !== 'not-in') : [...d.discipleship, 'not-in'] }))}
                      >Not in discipleship</CheckRow>
                    </>
                  )}

                  {activeCategory === 'group' && (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Group</p>
                      {data.groups.map((g) => (
                        <CheckRow
                          key={g.id}
                          checked={draft.groups.includes(g.id)}
                          onToggle={() => setDraft((d) => ({ ...d, groups: d.groups.includes(g.id) ? d.groups.filter((id) => id !== g.id) : [...d.groups, g.id] }))}
                        >{g.name}</CheckRow>
                      ))}
                    </>
                  )}

                  {activeCategory === 'app-role' && (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>App Role</p>
                      {(['admin', 'shepherd', 'welcome-team', 'no-access'] as AppRole[]).map((role) => {
                        const labels: Record<AppRole, string> = { admin: 'Admin', shepherd: 'Shepherd', 'welcome-team': 'Welcome Team', 'no-access': 'No Access' };
                        return (
                          <CheckRow
                            key={role}
                            checked={draft.appRoles.includes(role)}
                            onToggle={() => setDraft((d) => ({ ...d, appRoles: d.appRoles.includes(role) ? d.appRoles.filter((r) => r !== role) : [...d.appRoles, role] }))}
                          >{labels[role]}</CheckRow>
                        );
                      })}
                    </>
                  )}

                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 20px 16px', flexShrink: 0, borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={clearFilter}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', padding: '12px 0' }}
                >
                  Clear filters
                </button>
                <button
                  onClick={applyFilter}
                  style={{ flex: 2, background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
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

/* ── Row components ────────────────────────── */

const avatarPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];

function FamilyRow({ family, members }: { family: Family; members: Person[] }) {
  const lastContact = getFamilyLastContact(members);
  const groupTag = members.flatMap((m) => m.groupIds)[0];
  const { data } = useApp();
  const group = groupTag ? data.groups.find((g) => g.id === groupTag) : null;
  return (
    <Link href={`/family/${family.id}`} className="row-hover" style={{ borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
        {/* Family avatar — single circle with photo or house icon */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {family.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={family.photo} alt={family.label} style={{ width: 44, height: 44, objectFit: 'cover' }} />
          ) : (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {family.label}
            </span>
            {group && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: '999px', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600, flexShrink: 0 }}>
                {group.name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {members.map((m, i) => (
              <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-muted)' }}>
                {i > 0 && <span>,&nbsp;</span>}
                {m.isShepherd && <HandHeart size={11} color="var(--sage)" style={{ flexShrink: 0 }} />}
                {m.englishName.split(' ')[0]}
              </span>
            ))}
            {family.childCount && family.childCount > 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>, +{family.childCount} kid{family.childCount !== 1 ? 's' : ''}</span>
            ) : null}
            {lastContact && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· Logged {new Date(lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function IndividualRow({ person }: { person: Person }) {
  const palette = avatarPalette[person.englishName.charCodeAt(0) % avatarPalette.length];
  const initials = person.englishName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const { data } = useApp();
  const group = person.groupIds[0] ? data.groups.find((g) => g.id === person.groupIds[0]) : null;

  return (
    <Link href={`/person/${person.id}`} className="row-hover" style={{ borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: palette.bg, color: palette.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, overflow: 'hidden' }}>
              {person.isShepherd && (
                <HandHeart size={14} color="var(--sage)" style={{ flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
                {person.englishName}
              </span>
              {person.chineseName && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{person.chineseName}</span>
              )}
            </div>
            {group && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: '999px', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600, flexShrink: 0 }}>
                {group.name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getMembershipLabel(person.membershipStatus)}</span>
            {person.lastContactDate && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· Logged {new Date(person.lastContactDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Filter helpers ────────────────────────── */

function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onToggle}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 2px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: checked ? 'none' : '1.5px solid var(--border)',
        background: checked ? 'var(--sage)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: checked ? 500 : 400 }}>{children}</span>
    </button>
  );
}

function RadioRow({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onSelect}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: selected ? '2px solid var(--sage)' : '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />}
      </div>
      <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: 'var(--text-primary)' }}>{children}</span>
    </button>
  );
}
