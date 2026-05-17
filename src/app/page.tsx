'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { getMembershipLabel, fullName } from '@/lib/utils';
import { type Person, type AppRole } from '@/lib/types';
import {
  Plus,
  UsersThree,
  PaperPlaneTilt,
  MagnifyingGlass,
  Funnel,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import FamilyRow from '@/components/people/FamilyRow';
import IndividualRow from '@/components/people/IndividualRow';
import PeopleTable from '@/components/people/PeopleTable';
import PageContainer from '@/components/PageContainer';
import { usePeopleRows } from '@/lib/usePeopleRows';
const AddPersonModal = React.lazy(() => import('@/components/AddPersonModal'));
const AddFamilyModal = React.lazy(() => import('@/components/AddFamilyModal'));
const InviteSheet = React.lazy(() => import('@/components/InviteSheet'));
const FilterPanel = React.lazy(() => import('@/components/FilterPanel'));
const SortControls = React.lazy(() => import('@/components/SortControls'));
const SearchBar = React.lazy(() => import('@/components/SearchBar'));
import HeaderInlineSearch from '@/components/HeaderInlineSearch';
const InvitePersonPickerSheet = React.lazy(() =>
  import('@/components/PersonPickerSheets').then((m) => ({ default: m.InvitePersonPickerSheet }))
);

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

export default function PeoplePage() {
  const {
    data,
    currentPersona,
    homeFilters: filters,
    setHomeFilters: setFilters,
    setFullPageModalOpen,
  } = useApp();
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const isSearchPending = search !== deferredSearch;
  const [showSearch, setShowSearch] = React.useState(false);
  const [showFilter, setShowFilter] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = React.useRef<HTMLInputElement>(null);
  const addBtnRef = React.useRef<HTMLDivElement>(null);
  const [showAddChoice, setShowAddChoice] = React.useState(false);
  const [showAddPerson, setShowAddPerson] = React.useState(false);
  const [showAddFamily, setShowAddFamily] = React.useState(false);
  const [showInvitePicker, setShowInvitePicker] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);
  const [invitePerson, setInvitePerson] = React.useState<Person | null>(null);
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

  const entries = usePeopleRows(deferredSearch);

  const activeFilterCount =
    filters.shepherds.length +
    filters.memberships.length +
    filters.attendances.length +
    filters.groups.length +
    (filters.archiveFilter !== 'include' ? 1 : 0) +
    filters.discipleship.length +
    filters.appRoles.length +
    filters.positions.length +
    filters.languages.length;

  const chips: { key: string; label: string; clear: () => void }[] = [];
  filters.shepherds.forEach((sid) => {
    const label =
      sid === 'mine'
        ? 'My Sheep'
        : sid === 'none'
          ? 'No shepherd'
          : (data.personas.find((p) => p.id === sid)?.name ?? sid);
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
      label: gid === 'none' ? 'No group' : (g?.name ?? gid),
      clear: () => setFilters((f) => ({ ...f, groups: f.groups.filter((g) => g !== gid) })),
    });
  });
  if (filters.archiveFilter !== 'include') {
    const archiveLabel = filters.archiveFilter === 'only' ? 'Only archived' : 'Hiding archived';
    chips.push({
      key: 'archive-filter',
      label: archiveLabel,
      clear: () => setFilters((f) => ({ ...f, archiveFilter: 'include' })),
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
    shepherd: 'User',
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
      label: pos === 'none' ? 'No church position' : pos,
      clear: () => setFilters((f) => ({ ...f, positions: f.positions.filter((x) => x !== pos) })),
    });
  });
  filters.languages.forEach((lang) => {
    chips.push({
      key: `lang-${lang}`,
      label: lang,
      clear: () => setFilters((f) => ({ ...f, languages: f.languages.filter((x) => x !== lang) })),
    });
  });

  const familyCount = entries.filter((e) => e.type === 'family').length;
  const individualCount = entries.filter(
    (e) => e.type === 'individual' && !e.fromFamilySearch
  ).length;
  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 13 : 14;
  const btnPad = scrolled ? '0 0.75rem' : '0 0.875rem';

  const searchActive = showSearch || !!search;
  const filterActive = activeFilterCount > 0;

  const actionButtons = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Search button — hidden on desktop when search is expanded */}
      <div className={showSearch ? 'lg:hidden' : undefined}>
        <Button
          variant="ghost"
          aria-label={searchActive ? 'Close search' : 'Search'}
          onClick={() => {
            if (showSearch) {
              setShowSearch(false);
              setSearch('');
            } else {
              setShowSearch(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                searchInputRef.current?.focus();
                desktopSearchInputRef.current?.focus();
              }, 50);
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
            transition: 'width 0.25s ease, height 0.25s ease',
          }}
        >
          <MagnifyingGlass size={14} />
        </Button>
      </div>
      <HeaderInlineSearch
        search={search}
        setSearch={setSearch}
        show={showSearch}
        inputRef={desktopSearchInputRef}
        placeholder="Search by name…"
        ariaLabel="Search people by name"
        height={btnSize}
        onClose={() => setShowSearch(false)}
      />
      {/* Filter button */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Button
          variant="ghost"
          aria-label="Filter people"
          onClick={() => {
            setShowFilter(true);
            setFullPageModalOpen(true);
          }}
          style={{
            width: btnSize,
            height: btnSize,
            background: filterActive ? 'var(--sage-light)' : 'transparent',
            border: filterActive ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
            color: filterActive ? 'var(--sage)' : 'var(--text-secondary)',
            padding: 0,
            transition: 'width 0.25s ease, height 0.25s ease',
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
          style={{ height: btnSize, padding: btnPad, fontSize: btnFont, transition: 'height 0.25s ease, padding 0.25s ease, font-size 0.25s ease' }}
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
            {(() => {
              const individualBtn = (
                <button
                  key="individual"
                  onClick={() => {
                    setShowAddChoice(false);
                    setShowAddPerson(true);
                  }}
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
              );
              const familyBtn = (
                <button
                  key="family"
                  onClick={() => {
                    setShowAddChoice(false);
                    setShowAddFamily(true);
                  }}
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
              );
              const inviteBtn = (
                <button
                  key="invite"
                  onClick={() => {
                    setShowAddChoice(false);
                    setShowInvitePicker(true);
                  }}
                  style={addMenuItemStyle}
                >
                  <div style={addMenuIconStyle}>
                    <PaperPlaneTilt size={16} color="var(--sage)" />
                  </div>
                  <div>
                    <p style={addMenuLabelStyle}>Invite to app</p>
                    <p style={addMenuDescStyle}>Give someone access</p>
                  </div>
                </button>
              );
              const items = [individualBtn, familyBtn, inviteBtn];
              return items.map((item, i) =>
                i === items.length - 1
                  ? React.cloneElement(item, {
                      style: { ...addMenuItemStyle, borderBottom: 'none' },
                    })
                  : item
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageContainer>
      <div style={{ paddingBottom: 32 }}>
        {/* ── Sticky collapsing header ─────────── */}
        <header
          className="-mx-4 px-4 lg:mx-0 lg:px-0"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-sticky)',
            background: 'var(--bg)',
            borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
          }}
        >
          <div
            style={{
              height: scrolled ? '2.75rem' : '4.125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'height 0.25s ease',
            }}
          >
            <span
              style={{
                fontSize: scrolled ? '1.0625rem' : '2rem',
                fontWeight: scrolled ? 600 : 800,
                color: 'var(--text-primary)',
                letterSpacing: scrolled ? '-0.01em' : '-0.03em',
                lineHeight: 1,
                transition: 'font-size 0.25s ease, letter-spacing 0.25s ease',
              }}
            >
              People
            </span>
            {actionButtons}
          </div>
        </header>

        <main>
          {/* ── Search (expandable) ─────────────── */}
          <div className="lg:hidden">
            <React.Suspense fallback={null}>
              <SearchBar
                search={search}
                setSearch={setSearch}
                show={showSearch}
                inputRef={searchInputRef}
              />
            </React.Suspense>
          </div>

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

          {/* ── Count + Sort ──────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
              {familyCount > 0
                ? `${familyCount} ${familyCount === 1 ? 'family' : 'families'}`
                : `${individualCount} people`}
              {individualCount > 0 && familyCount > 0
                ? ` + ${individualCount} individual${individualCount !== 1 ? 's' : ''}`
                : ''}
            </span>

            <div className="lg:hidden">
              <React.Suspense fallback={null}>
                <SortControls />
              </React.Suspense>
            </div>
          </div>

          {/* ── List ──────────────────────────── */}
          <div
            className="no-last-border lg:hidden"
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
                  key={entry.fromFamilySearch ? `${entry.person.id}-search` : entry.person.id}
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

          <div
            className="hidden lg:block"
            style={{
              opacity: isSearchPending ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <PeopleTable entries={entries} />
          </div>

          <React.Suspense fallback={null}>
            {showAddPerson && <AddPersonModal onClose={() => setShowAddPerson(false)} />}
            {showAddFamily && <AddFamilyModal onClose={() => setShowAddFamily(false)} />}
            {showInvitePicker && (
              <InvitePersonPickerSheet
                people={data.people}
                onSelect={(p) => {
                  setInvitePerson(data.people.find((x) => x.id === p.id) ?? null);
                  setShowInvitePicker(false);
                  setShowInvite(true);
                }}
                onBack={() => setShowInvitePicker(false)}
              />
            )}
            {showInvite && invitePerson && (
              <InviteSheet
                onClose={() => {
                  setShowInvite(false);
                  setInvitePerson(null);
                }}
                onChangePerson={() => {
                  setShowInvite(false);
                  setInvitePerson(null);
                  setShowInvitePicker(true);
                }}
                initialEmail={invitePerson.email ?? ''}
                initialRole="shepherd"
                personName={fullName(invitePerson)}
                personId={invitePerson.id}
              />
            )}
          </React.Suspense>

          {/* ── Filter panel (bottom sheet) ────── */}
          <React.Suspense fallback={null}>
            <FilterPanel
              show={showFilter}
              onClose={() => {
                setShowFilter(false);
                setFullPageModalOpen(false);
              }}
            />
          </React.Suspense>
        </main>
      </div>
    </PageContainer>
  );
}
