'use client';

import { differenceInCalendarDays, differenceInHours, subDays, parseISO, isBefore, compareDesc, format } from 'date-fns';
import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  searchFamiliesAndPeople,
  getFamilyPriorityScore,
  getMembershipLabel,
  getChurchAttendanceLabel,
} from '@/lib/utils';
import {
  type Family,
  type Person,
  type Group,
  type MembershipStatus,
  type ChurchAttendance,
  type AppRole,
} from '@/lib/types';
import {
  HandHeart,
  Plus,
  UsersThree,
  PaperPlaneTilt,
  MagnifyingGlass,
  Funnel,
  X,
  House,
} from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { AvatarBadge } from '@/components/AvatarBadge';
import { StatusBadge } from '@/components/StatusBadge';
const AddPersonModal = React.lazy(() => import('@/components/AddPersonModal'));
const AddFamilyModal = React.lazy(() => import('@/components/AddFamilyModal'));
const InviteSheet = React.lazy(() => import('@/components/InviteSheet'));
const FilterPanel = React.lazy(() => import('@/components/FilterPanel'));
const SortControls = React.lazy(() => import('@/components/SortControls'));
const SearchBar = React.lazy(() => import('@/components/SearchBar'));

export default function PeoplePage() {
  const {
    data,
    currentPersona,
    homeFilters: filters,
    setHomeFilters: setFilters,
    homeSortKey: sortKey,
  } = useApp();
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const isSearchPending = search !== deferredSearch;
const [showSearch, setShowSearch] = React.useState(false);
  const [showFilter, setShowFilter] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const addBtnRef = React.useRef<HTMLDivElement>(null);
  const [showAddChoice, setShowAddChoice] = React.useState(false);
  const [showAddPerson, setShowAddPerson] = React.useState(false);
  const [showAddFamily, setShowAddFamily] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const isAdmin = currentPersona.role === 'admin';

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (!showAddChoice) return;
    const handler = (e: MouseEvent) => {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target as Node)) {
        setShowAddChoice(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddChoice]);


  // Build the list: families + solo individuals
  const entries = React.useMemo(() => {
    const { families: matchedFamilies, individuals } = searchFamiliesAndPeople(
      deferredSearch,
      data.families,
      data.people
    );

    type Entry =
      | { type: 'family'; family: Family; members: Person[]; lastNoteTs: number | null; group: Group | null }
      | { type: 'individual'; person: Person; lastNoteTs: number | null; group: Group | null };
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
        const matchesMine =
          includesMine && members.some((m) => currentPersona.assignedPeopleIds.includes(m.id));
        const matchesSpecific = specificShepherdIds.some((sid) =>
          members.some((m) => m.assignedShepherdIds.includes(sid))
        );
        if (!matchesMine && !matchesSpecific) continue;
      }
      if (
        filters.archiveFilter === 'hide' &&
        members.every((m) => m.churchAttendance === 'archived')
      )
        continue;
      if (
        filters.archiveFilter === 'only' &&
        !members.every((m) => m.churchAttendance === 'archived')
      )
        continue;
      // Membership filter (OR across selected)
      if (
        filters.memberships.length > 0 &&
        !members.some((m) => filters.memberships.includes(m.membershipStatus))
      )
        continue;
      // Attendance filter (OR across selected)
      if (
        filters.attendances.length > 0 &&
        !members.some((m) => filters.attendances.includes(m.churchAttendance))
      )
        continue;
      // Group filter (OR across selected)
      if (
        filters.groups.length > 0 &&
        !members.some((m) => filters.groups.some((gid) => m.groupIds.includes(gid)))
      )
        continue;
      // Discipleship filter — OR logic: family passes if any member matches at least one selected state
      if (filters.discipleship.length > 0) {
        const passes = members.some(
          (m) =>
            (filters.discipleship.includes('in') && m.isBeingDiscipled) ||
            (filters.discipleship.includes('not-in') && !m.isBeingDiscipled)
        );
        if (!passes) continue;
      }
      // App role filter
      if (
        filters.appRoles.length > 0 &&
        !members.some((m) => filters.appRoles.includes(m.appRole ?? 'no-access'))
      )
        continue;
      // Position filter (OR across selected)
      if (
        filters.positions.length > 0 &&
        !members.some((m) =>
          filters.positions.some((pos) => (m.churchPositions ?? []).includes(pos))
        )
      )
        continue;
      // Language filter (OR across selected)
      if (
        filters.languages.length > 0 &&
        !members.some((m) => filters.languages.some((lang) => m.language.includes(lang)))
      )
        continue;

      const familyLastNoteTs = members.reduce((max, m) => {
        const t = lastNoteTime[m.id] ?? 0;
        return t > max ? t : max;
      }, 0) || null;
      const firstGroupId = members.flatMap((m) => m.groupIds)[0];
      const familyGroup = firstGroupId ? (data.groups.find((g) => g.id === firstGroupId) ?? null) : null;
      entries.push({ type: 'family', family: f, members, lastNoteTs: familyLastNoteTs, group: familyGroup });
    }

    for (const p of individuals) {
      // Shepherd filter
      if (filters.shepherds.length > 0) {
        const matchesMine = includesMine && currentPersona.assignedPeopleIds.includes(p.id);
        const matchesSpecific = specificShepherdIds.some((sid) =>
          p.assignedShepherdIds.includes(sid)
        );
        if (!matchesMine && !matchesSpecific) continue;
      }
      if (filters.archiveFilter === 'hide' && p.churchAttendance === 'archived') continue;
      if (filters.archiveFilter === 'only' && p.churchAttendance !== 'archived') continue;
      if (filters.memberships.length > 0 && !filters.memberships.includes(p.membershipStatus))
        continue;
      if (filters.attendances.length > 0 && !filters.attendances.includes(p.churchAttendance))
        continue;
      if (filters.groups.length > 0 && !filters.groups.some((gid) => p.groupIds.includes(gid)))
        continue;
      if (filters.discipleship.length > 0) {
        const passes =
          (filters.discipleship.includes('in') && p.isBeingDiscipled) ||
          (filters.discipleship.includes('not-in') && !p.isBeingDiscipled);
        if (!passes) continue;
      }
      if (filters.appRoles.length > 0 && !filters.appRoles.includes(p.appRole ?? 'no-access'))
        continue;
      if (
        filters.positions.length > 0 &&
        !filters.positions.some((pos) => (p.churchPositions ?? []).includes(pos))
      )
        continue;
      if (
        filters.languages.length > 0 &&
        !filters.languages.some((lang) => p.language.includes(lang))
      )
        continue;
      const personLastNoteTs = lastNoteTime[p.id] ?? null;
      const personGroup = p.groupIds[0] ? (data.groups.find((g) => g.id === p.groupIds[0]) ?? null) : null;
      entries.push({ type: 'individual', person: p, lastNoteTs: personLastNoteTs, group: personGroup });
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
        case 'name-desc':
          return bName.localeCompare(aName);
        default: // priority
          return getFamilyPriorityScore(bMembers) - getFamilyPriorityScore(aMembers);
      }
    });

    return entries;
  }, [data, deferredSearch, filters, sortKey, isAdmin, currentPersona]);

  // New people: created in the last 60 days, no notes yet, not archived
  const newPeople = React.useMemo(() => {
    if (currentPersona.role === 'welcome-team') return [];
    const cutoff = subDays(new Date(), 60);
    const notedPersonIds = new Set(data.notes.map((n) => n.personId).filter(Boolean) as string[]);
    return data.people
      .filter((p) => {
        if (p.churchAttendance === 'archived') return false;
        if (notedPersonIds.has(p.id)) return false;
        if (isBefore(parseISO(p.createdAt), cutoff)) return false;
        if (currentPersona.role === 'shepherd')
          return currentPersona.assignedPeopleIds.includes(p.id);
        return true;
      })
      .sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));
  }, [data.people, data.notes, currentPersona]);

  const activeFilterCount =
    filters.shepherds.length +
    filters.memberships.length +
    filters.attendances.length +
    filters.groups.length +
    (filters.archiveFilter !== 'hide' ? 1 : 0) +
    filters.discipleship.length +
    filters.appRoles.length +
    filters.positions.length +
    filters.languages.length;

  const chips: { key: string; label: string; clear: () => void }[] = [];
  filters.shepherds.forEach((sid) => {
    const label =
      sid === 'mine' ? 'My Sheep' : (data.personas.find((p) => p.id === sid)?.name ?? sid);
    chips.push({
      key: `s-${sid}`,
      label,
      clear: () => setFilters((f) => ({ ...f, shepherds: f.shepherds.filter((s) => s !== sid) })),
    });
  });
  filters.memberships.forEach((ms) => {
    chips.push({
      key: `m-${ms}`,
      label: getMembershipLabel(ms),
      clear: () =>
        setFilters((f) => ({ ...f, memberships: f.memberships.filter((m) => m !== ms) })),
    });
  });
  filters.attendances.forEach((at) => {
    chips.push({
      key: `at-${at}`,
      label: at,
      clear: () =>
        setFilters((f) => ({ ...f, attendances: f.attendances.filter((a) => a !== at) })),
    });
  });
  filters.groups.forEach((gid) => {
    const g = data.groups.find((g) => g.id === gid);
    chips.push({
      key: `g-${gid}`,
      label: g?.name ?? gid,
      clear: () => setFilters((f) => ({ ...f, groups: f.groups.filter((g) => g !== gid) })),
    });
  });
  if (filters.archiveFilter !== 'hide') {
    const archiveLabel = filters.archiveFilter === 'only' ? 'Only archived' : 'Include archived';
    chips.push({
      key: 'archive-filter',
      label: archiveLabel,
      clear: () => setFilters((f) => ({ ...f, archiveFilter: 'hide' })),
    });
  }
  const DISCIPLESHIP_LABELS: Record<'in' | 'not-in', string> = {
    in: 'In discipleship',
    'not-in': 'Not in discipleship',
  };
  filters.discipleship.forEach((d) => {
    chips.push({
      key: `d-${d}`,
      label: DISCIPLESHIP_LABELS[d],
      clear: () =>
        setFilters((f) => ({ ...f, discipleship: f.discipleship.filter((x) => x !== d) })),
    });
  });
  const APP_ROLE_LABELS: Record<AppRole, string> = {
    admin: 'Admin',
    shepherd: 'Shepherd',
    'welcome-team': 'Welcome Team',
    'no-access': 'No Access',
  };
  filters.appRoles.forEach((r) => {
    chips.push({
      key: `ar-${r}`,
      label: APP_ROLE_LABELS[r],
      clear: () => setFilters((f) => ({ ...f, appRoles: f.appRoles.filter((x) => x !== r) })),
    });
  });
  filters.positions.forEach((pos) => {
    chips.push({
      key: `pos-${pos}`,
      label: pos,
      clear: () =>
        setFilters((f) => ({ ...f, positions: f.positions.filter((x) => x !== pos) })),
    });
  });
  filters.languages.forEach((lang) => {
    chips.push({
      key: `lang-${lang}`,
      label: lang,
      clear: () =>
        setFilters((f) => ({ ...f, languages: f.languages.filter((x) => x !== lang) })),
    });
  });

  const familyCount = entries.filter((e) => e.type === 'family').length;
  const individualCount = entries.filter((e) => e.type === 'individual').length;
  const totalEntries = familyCount + individualCount;
  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 13 : 14;
  const btnPad = scrolled ? '0 0.75rem' : '0 0.875rem';

  const searchActive = showSearch || !!search;
  const filterActive = activeFilterCount > 0;

  const ActionButtons = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Search button */}
      <Button
        variant="ghost"
        aria-label={searchActive ? 'Close search' : 'Search'}
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
          background: searchActive ? 'var(--sage-light)' : 'transparent',
          border: searchActive ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
          color: searchActive ? 'var(--sage)' : 'var(--text-secondary)',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <MagnifyingGlass size={14} />
      </Button>
      {/* Filter button */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Button
          variant="ghost"
          aria-label="Filter people"
          onClick={() => setShowFilter(true)}
          style={{
            width: btnSize,
            height: btnSize,
            background: filterActive ? 'var(--sage-light)' : 'transparent',
            border: filterActive ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
            color: filterActive ? 'var(--sage)' : 'var(--text-secondary)',
            padding: 0,
          }}
        >
          <Funnel size={14} />
        </Button>
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
      {/* Add button + dropdown */}
      <div ref={addBtnRef} style={{ position: 'relative' }}>
        <Button
          variant="primary"
          onClick={() => setShowAddChoice((v) => !v)}
          style={{ height: btnSize, padding: btnPad, fontSize: btnFont }}
        >
          <Plus size={16} weight="bold" />
          People
        </Button>
        {showAddChoice && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.375rem)',
              right: 0,
              zIndex: 'var(--z-dropdown)' as unknown as number,
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--border-light)',
              width: 220,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => { setShowAddChoice(false); setShowAddPerson(true); }}
              style={addMenuItemStyle}
            >
              <div style={addMenuIconStyle}>
                <Plus size={16} color="var(--sage)" weight="bold" />
              </div>
              <div>
                <p style={addMenuLabelStyle}>Individual</p>
                <p style={addMenuDescStyle}>Add a single person</p>
              </div>
            </button>
            <button
              onClick={() => { setShowAddChoice(false); setShowAddFamily(true); }}
              style={addMenuItemStyle}
            >
              <div style={addMenuIconStyle}>
                <UsersThree size={16} color="var(--sage)" />
              </div>
              <div>
                <p style={addMenuLabelStyle}>Family</p>
                <p style={addMenuDescStyle}>Group people into a family</p>
              </div>
            </button>
            <button
              onClick={() => { setShowAddChoice(false); setShowInvite(true); }}
              style={{ ...addMenuItemStyle, borderBottom: 'none' }}
            >
              <div style={addMenuIconStyle}>
                <PaperPlaneTilt size={16} color="var(--sage)" />
              </div>
              <div>
                <p style={addMenuLabelStyle}>Invite to app</p>
                <p style={addMenuDescStyle}>Give someone access</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── Sticky collapsing header ─────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
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
              People
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
              People
            </h1>
            <ActionButtons />
          </div>
        )}
      </header>

      <main>
      {/* ── Search (expandable) ─────────────── */}
      <React.Suspense fallback={null}>
        <SearchBar
          search={search}
          setSearch={setSearch}
          show={showSearch}
          inputRef={searchInputRef}
        />
      </React.Suspense>

      {/* ── Active filter chips ────────────── */}
      {chips.length > 0 && (
        <div
          className="no-scrollbar mb-2.5 flex gap-1.5 overflow-x-auto"
          style={{ paddingBottom: 2 }}
        >
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              aria-label={`Remove ${chip.label} filter`}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.3125rem 0.625rem',
                minHeight: 28,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--sage-light)',
                border: '1px solid var(--sage-mid)',
                color: 'var(--sage-dark)',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {chip.label}
              <X size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {/* ── New people alert ──────────────── */}
      {newPeople.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--amber)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              New · needs first contact
            </span>
            <span
              style={{
                minWidth: 16,
                height: 16,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--amber-light)',
                border: '1px solid var(--amber-border)',
                color: 'var(--amber)',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 0.25rem',
              }}
            >
              {newPeople.length}
            </span>
          </div>
          <div
            style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}
            className="no-scrollbar"
          >
            {newPeople.map((p) => {
              const createdAt = parseISO(p.createdAt);
              const hoursAgo = differenceInHours(new Date(), createdAt);
              const daysAgo = differenceInCalendarDays(new Date(), createdAt);
              const timeLabel =
                hoursAgo < 24
                  ? `${hoursAgo}h`
                  : daysAgo < 14
                    ? `${daysAgo}d`
                    : `${Math.floor(daysAgo / 7)}w`;
              return (
                <Link
                  key={p.id}
                  href={`/person/${p.id}`}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    width: 64,
                  }}
                >
                  <AvatarBadge
                    name={p.englishName}
                    photo={p.photo}
                    size={44}
                    bg="var(--amber-light)"
                    color="var(--amber)"
                    border="0.125rem solid var(--amber-border)"
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.englishName.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--amber)', fontWeight: 500, marginTop: -2 }}>
                    {timeLabel} ago
                  </span>
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
          {individualCount > 0 && familyCount > 0
            ? ` + ${individualCount} individual${individualCount !== 1 ? 's' : ''}`
            : ''}
        </span>

        <React.Suspense fallback={null}>
          <SortControls />
        </React.Suspense>
      </div>

      {/* ── List ──────────────────────────── */}
      <div
        className="no-last-border"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          opacity: isSearchPending ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {entries.map((entry) =>
          entry.type === 'family' ? (
            <FamilyRow
              key={entry.family.id}
              family={entry.family}
              members={entry.members}
              lastNoteTs={entry.lastNoteTs}
              group={entry.group}
            />
          ) : (
            <IndividualRow
              key={entry.person.id}
              person={entry.person}
              lastNoteTs={entry.lastNoteTs}
              group={entry.group}
            />
          )
        )}
        {entries.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              paddingTop: 48,
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            {filters.shepherds.length > 0 &&
            !isAdmin &&
            filters.shepherds.every((s) => s === 'mine')
              ? 'No one assigned to you yet.'
              : 'No people found.'}
          </div>
        )}
      </div>

      <React.Suspense fallback={null}>
        {showAddPerson && <AddPersonModal onClose={() => setShowAddPerson(false)} />}
        {showAddFamily && <AddFamilyModal onClose={() => setShowAddFamily(false)} />}
        {showInvite && <InviteSheet onClose={() => setShowInvite(false)} />}
      </React.Suspense>

      {/* ── Filter panel (bottom sheet) ────── */}
      <React.Suspense fallback={null}>
        <FilterPanel show={showFilter} onClose={() => setShowFilter(false)} />
      </React.Suspense>
      </main>
    </div>
  );
}

/* ── Row components ────────────────────────── */

function LogStatusTag({
  daysSince,
  lastNoteTs,
}: {
  daysSince: number | null;
  lastNoteTs: number | null;
}) {
  if (lastNoteTs === null) {
    return <StatusBadge label="Never logged" bg="var(--border-light)" color="var(--text-muted)" />;
  }
  if (daysSince !== null && daysSince >= 7) {
    return (
      <StatusBadge
        label={`${daysSince}d ago`}
        bg="var(--amber-light)"
        color="var(--amber)"
        border="1px solid var(--amber-border)"
      />
    );
  }
  return (
    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
      Logged {format(new Date(lastNoteTs!), 'MMM d')}
    </span>
  );
}

const FamilyRow = React.memo(function FamilyRow({
  family,
  members,
  lastNoteTs,
  group,
}: {
  family: Family;
  members: Person[];
  lastNoteTs: number | null;
  group: Group | null;
}) {
  const daysSinceNote =
    lastNoteTs !== null ? differenceInCalendarDays(new Date(), new Date(lastNoteTs)) : null;

  return (
    <Link
      href={`/family/${family.id}`}
      className="row-hover"
      style={{ borderBottom: '1px solid var(--border-light)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.625rem 0' }}>
        {/* Family avatar — single circle with photo or house icon */}
        <AvatarBadge
          name={family.label}
          photo={family.photo}
          size={44}
          bg="var(--sage)"
          color="var(--sage-light)"
          icon={<House size={22} color="var(--sage-light)" />}
        />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {family.label}
            </span>
            <LogStatusTag daysSince={daysSinceNote} lastNoteTs={lastNoteTs} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {members.map((m, i) => (
              <span
                key={m.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                {i > 0 && <span>,&nbsp;</span>}
                {m.isShepherd && (
                  <HandHeart size={11} color="var(--sage)" style={{ flexShrink: 0 }} />
                )}
                {m.englishName.split(' ')[0]}
              </span>
            ))}
            {family.childCount && family.childCount > 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                , +{family.childCount} kid{family.childCount !== 1 ? 's' : ''}
              </span>
            ) : null}
            {group && (() => {
              const allGroupIds = [...new Set(members.flatMap((m) => m.groupIds))];
              const extra = allGroupIds.length - 1;
              return (
                <>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '0.125rem 0.4375rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--blue-light)',
                      color: 'var(--blue)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {group.name}
                  </span>
                  {extra > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '0.125rem 0.375rem',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--blue-light)',
                        color: 'var(--blue)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      +{extra}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </Link>
  );
});

const addMenuItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0.625rem 0.875rem',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid var(--border-light)',
  cursor: 'pointer',
  textAlign: 'left',
};

const addMenuIconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--sage-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const addMenuLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
  margin: 0,
};

const addMenuDescStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  margin: '0.0625rem 0 0',
};

const IndividualRow = React.memo(function IndividualRow({
  person,
  lastNoteTs,
  group,
}: {
  person: Person;
  lastNoteTs: number | null;
  group: Group | null;
}) {
  const daysSinceNote =
    lastNoteTs !== null ? differenceInCalendarDays(new Date(), new Date(lastNoteTs)) : null;

  return (
    <Link
      href={`/person/${person.id}`}
      className="row-hover"
      style={{ borderBottom: '1px solid var(--border-light)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.625rem 0' }}>
        {/* Avatar */}
        <AvatarBadge name={person.englishName} photo={person.photo} size={44} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              {person.isShepherd && (
                <HandHeart size={14} color="var(--sage)" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 1,
                }}
              >
                {person.englishName}
              </span>
              {person.chineseName && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {person.chineseName}
                </span>
              )}
            </div>
            <LogStatusTag daysSince={daysSinceNote} lastNoteTs={lastNoteTs} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {getMembershipLabel(person.membershipStatus)} ·{' '}
              {getChurchAttendanceLabel(person.churchAttendance)}
            </span>
            {group && (() => {
              const extra = person.groupIds.length - 1;
              return (
                <>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '0.125rem 0.4375rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--blue-light)',
                      color: 'var(--blue)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {group.name}
                  </span>
                  {extra > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '0.125rem 0.375rem',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--blue-light)',
                        color: 'var(--blue)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      +{extra}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </Link>
  );
});

