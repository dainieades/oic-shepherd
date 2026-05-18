'use client';

import React from 'react';
import { useApp, type HomeFilters, type HomeSortKey, HOME_DEFAULT_FILTERS } from '@/lib/context';
import { getMembershipLabel, fullName } from '@/lib/utils';
import {
  type MembershipStatus,
  type ChurchAttendance,
  type AppRole,
  CHURCH_POSITIONS,
} from '@/lib/types';
import { MagnifyingGlass, ArrowsDownUp } from '@phosphor-icons/react';
import { SORT_OPTIONS } from '@/lib/constants';
import { CheckRow } from './CheckRow';
import { RadioRow } from './RadioRow';
import { FilterPanelBase } from './FilterPanelBase';

type FilterCategory =
  | 'sort'
  | 'shepherd'
  | 'membership'
  | 'discipleship'
  | 'group'
  | 'app-role'
  | 'archive'
  | 'position'
  | 'language';

export default function FilterPanel({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}): React.ReactNode {
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
    (draft.archiveFilter !== 'include' ? 1 : 0) +
    draft.discipleship.length +
    draft.appRoles.length +
    draft.positions.length +
    draft.languages.length;

  const FILTER_CATEGORIES = [
    { key: 'shepherd' as FilterCategory, label: 'Shepherd by', count: draft.shepherds.length },
    {
      key: 'membership' as FilterCategory,
      label: 'Status',
      count: draft.memberships.length + draft.attendances.length,
    },
    { key: 'archive' as FilterCategory, label: 'Archive', count: draft.archiveFilter !== 'include' ? 1 : 0 },
    { key: 'discipleship' as FilterCategory, label: 'Discipleship', count: draft.discipleship.length },
    { key: 'group' as FilterCategory, label: 'Group', count: draft.groups.length },
    { key: 'position' as FilterCategory, label: 'Church Position', count: draft.positions.length },
    { key: 'language' as FilterCategory, label: 'Language', count: draft.languages.length },
    { key: 'app-role' as FilterCategory, label: 'App Role', count: draft.appRoles.length },
    {
      key: 'sort' as FilterCategory,
      label: 'Sort',
      count: 0,
      hasDividerBefore: true,
      icon: <ArrowsDownUp size={13} className="shrink-0" />,
    },
  ];

  return (
    <FilterPanelBase
      show={show}
      onClose={onClose}
      title="Filter and Sort"
      draftTotalCount={draftTotalCount}
      categories={FILTER_CATEGORIES}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      onApply={applyFilter}
      onClear={clearFilter}
    >
      {activeCategory === 'sort' && (
        <>
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2.5">
            Shepherd by
          </p>
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
              className="w-full pl-7 pr-2.5 py-[7px] bg-bg border border-[var(--border)] rounded-xs text-13 text-text-primary outline-none box-border"
            />
          </div>
          {(currentPersona.role === 'admin' || currentPersona.role === 'shepherd') &&
            ('my sheep'.includes(shepherdSearch.toLowerCase()) ||
              currentPersona.name.toLowerCase().includes(shepherdSearch.toLowerCase())) && (
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
                My Sheep ({currentPersona.name})
              </CheckRow>
            )}
          {'no shepherd'.includes(shepherdSearch.toLowerCase()) && (
            <CheckRow
              checked={draft.shepherds.includes('none')}
              onToggle={() =>
                setDraft((d) => ({
                  ...d,
                  shepherds: d.shepherds.includes('none')
                    ? d.shepherds.filter((s) => s !== 'none')
                    : [...d.shepherds, 'none'],
                }))
              }
            >
              No shepherd
            </CheckRow>
          )}
          {(() => {
            const personaPersonIds = new Set(
              data.personas.map((p) => p.personId).filter(Boolean)
            );
            const shepherdEntries: Array<{ id: string; name: string }> = [
              ...data.personas
                .filter(
                  (p) =>
                    (p.role === 'shepherd' || p.role === 'admin') && p.id !== currentPersona.id
                )
                .map((p) => ({ id: p.id, name: p.name })),
              ...data.people
                .filter(
                  (p) =>
                    p.isShepherd &&
                    !personaPersonIds.has(p.id) &&
                    p.id !== currentPersona.personId
                )
                .map((p) => ({ id: p.id, name: fullName(p) })),
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
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
          <div className="mt-4 pt-3 border-t border-border-light">
            <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
              Attendance
            </p>
            {(
              ['visitor', 'regular', 'on-leave', 'fellowship-group-only'] as ChurchAttendance[]
            ).map((val) => {
              const ATTENDANCE_LABELS: Record<string, string> = {
                visitor: 'Visitor',
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
            Group
          </p>
          <CheckRow
            checked={draft.groups.includes('none')}
            onToggle={() =>
              setDraft((d) => ({
                ...d,
                groups: d.groups.includes('none')
                  ? d.groups.filter((id) => id !== 'none')
                  : [...d.groups, 'none'],
              }))
            }
          >
            No group
          </CheckRow>
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
            App Role
          </p>
          {(['admin', 'shepherd', 'no-access'] as AppRole[]).map((role) => {
            const labels: Record<AppRole, string> = {
              admin: 'Admin',
              shepherd: 'User',
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

      {activeCategory === 'position' && (
        <>
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
            Church Position
          </p>
          <CheckRow
            checked={draft.positions.includes('none')}
            onToggle={() =>
              setDraft((d) => ({
                ...d,
                positions: d.positions.includes('none')
                  ? d.positions.filter((x) => x !== 'none')
                  : [...d.positions, 'none'],
              }))
            }
          >
            No church position
          </CheckRow>
          {CHURCH_POSITIONS.map((pos) => (
            <CheckRow
              key={pos}
              checked={draft.positions.includes(pos)}
              onToggle={() =>
                setDraft((d) => ({
                  ...d,
                  positions: d.positions.includes(pos)
                    ? d.positions.filter((x) => x !== pos)
                    : [...d.positions, pos],
                }))
              }
            >
              {pos}
            </CheckRow>
          ))}
        </>
      )}

      {activeCategory === 'language' && (
        <>
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-3">
            Language
          </p>
          {Array.from(new Set(data.people.flatMap((p) => p.language)))
            .sort()
            .map((lang) => (
              <CheckRow
                key={lang}
                checked={draft.languages.includes(lang)}
                onToggle={() =>
                  setDraft((d) => ({
                    ...d,
                    languages: d.languages.includes(lang)
                      ? d.languages.filter((x) => x !== lang)
                      : [...d.languages, lang],
                  }))
                }
              >
                {lang}
              </CheckRow>
            ))}
        </>
      )}
    </FilterPanelBase>
  );
}
