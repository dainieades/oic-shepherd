'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { differenceInCalendarDays } from 'date-fns';
import { CaretUp, CaretDown, CaretUpDown, HandHeart, House } from '@phosphor-icons/react';
import { useApp, type HomeSortKey } from '@/lib/context';
import { AvatarBadge } from '@/components/AvatarBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import LogStatusTag from '@/components/people/LogStatusTag';
import RowActionsCell from '@/components/people/RowActionsCell';
import {
  fullName,
  getMembershipLabel,
  getChurchAttendanceLabel,
  aggregateMembership,
  aggregateAttendance,
} from '@/lib/utils';
import type { PeopleEntry } from '@/lib/usePeopleRows';
import type { Family, Group } from '@/lib/types';

interface PeopleTableProps {
  entries: PeopleEntry[];
}

type SortDirection = 'asc' | 'desc' | null;

const headerCellStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  padding: '0.625rem 0.5rem',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  zIndex: 1,
};

const cellStyle: React.CSSProperties = {
  padding: '0.625rem 0.5rem',
  borderBottom: '1px solid var(--border-light)',
  fontSize: 13,
  color: 'var(--text-primary)',
  verticalAlign: 'middle',
};

interface Counts {
  todos: number;
  logs: number;
  notices: number;
}

function useRowNavigate() {
  const router = useRouter();
  return React.useCallback(
    (href: string) =>
      (e: React.MouseEvent<HTMLTableRowElement>) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const target = e.target as HTMLElement;
        if (target.closest('a, button, input, select, textarea, label')) return;
        router.push(href);
      },
    [router]
  );
}

export default function PeopleTable({ entries }: PeopleTableProps) {
  const { data, homeSortKey, setHomeSortKey } = useApp();
  const onRowClick = useRowNavigate();

  const familiesById = React.useMemo(() => {
    const map = new Map<string, Family>();
    for (const family of data.families) map.set(family.id, family);
    return map;
  }, [data.families]);

  const groupsById = React.useMemo(() => {
    const map = new Map<string, Group>();
    for (const group of data.groups) map.set(group.id, group);
    return map;
  }, [data.groups]);

  const openTodosByPerson = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of data.todos) {
      if (t.completed || !t.personId) continue;
      map.set(t.personId, (map.get(t.personId) ?? 0) + 1);
    }
    return map;
  }, [data.todos]);

  const openTodosByFamily = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of data.todos) {
      if (t.completed || !t.familyId) continue;
      map.set(t.familyId, (map.get(t.familyId) ?? 0) + 1);
    }
    return map;
  }, [data.todos]);

  const logsByPerson = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const n of data.notes) {
      if (!n.personId) continue;
      map.set(n.personId, (map.get(n.personId) ?? 0) + 1);
    }
    return map;
  }, [data.notes]);

  const logsByFamily = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const n of data.notes) {
      if (!n.familyId) continue;
      map.set(n.familyId, (map.get(n.familyId) ?? 0) + 1);
    }
    return map;
  }, [data.notes]);

  const noticesByPerson = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const n of data.notices) {
      if (!n.personId) continue;
      map.set(n.personId, (map.get(n.personId) ?? 0) + 1);
    }
    return map;
  }, [data.notices]);

  const noticesByFamily = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const n of data.notices) {
      if (!n.familyId) continue;
      map.set(n.familyId, (map.get(n.familyId) ?? 0) + 1);
    }
    return map;
  }, [data.notices]);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No people found."
        description="Try clearing filters or adjusting your search."
      />
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'auto',
        }}
      >
        <thead>
          <tr>
            <SortableHeader
              label="Name"
              direction={getSortDirection(homeSortKey, 'name', 'name-desc')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'name', 'name-desc'))}
            />
            <SortableHeader
              label="Status"
              direction={getSortDirection(homeSortKey, 'status', 'status-desc')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'status', 'status-desc'))}
            />
            <SortableHeader
              label="Attendance"
              direction={getSortDirection(homeSortKey, 'attendance', 'attendance-desc')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'attendance', 'attendance-desc'))}
            />
            <SortableHeader
              label="Groups"
              direction={getSortDirection(homeSortKey, 'groups', 'groups-desc')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'groups', 'groups-desc'))}
            />
            <SortableHeader
              label="Logs"
              direction={getSortDirection(homeSortKey, 'logs-desc', 'logs')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'logs-desc', 'logs'))}
            />
            <SortableHeader
              label="Todos"
              direction={getSortDirection(homeSortKey, 'todos-desc', 'todos')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'todos-desc', 'todos'))}
            />
            <SortableHeader
              label="Notices"
              direction={getSortDirection(homeSortKey, 'notices-desc', 'notices')}
              onSort={() => setHomeSortKey((k) => toggleSort(k, 'notices-desc', 'notices'))}
            />
            <SortableHeader
              label="Last contact"
              direction={getSortDirection(homeSortKey, 'last-contacted', 'last-contacted-recent')}
              onSort={() =>
                setHomeSortKey((k) => toggleSort(k, 'last-contacted', 'last-contacted-recent'))
              }
            />
            <th style={{ ...headerCellStyle, width: '2.5rem' }} aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            if (entry.type === 'family') {
              const memberTodos = entry.members.reduce(
                (sum, m) => sum + (openTodosByPerson.get(m.id) ?? 0),
                0
              );
              const memberLogs = entry.members.reduce(
                (sum, m) => sum + (logsByPerson.get(m.id) ?? 0),
                0
              );
              const memberNotices = entry.members.reduce(
                (sum, m) => sum + (noticesByPerson.get(m.id) ?? 0),
                0
              );
              const counts: Counts = {
                todos: memberTodos + (openTodosByFamily.get(entry.family.id) ?? 0),
                logs: memberLogs + (logsByFamily.get(entry.family.id) ?? 0),
                notices: memberNotices + (noticesByFamily.get(entry.family.id) ?? 0),
              };
              return (
                <FamilyTableRow
                  key={entry.family.id}
                  entry={entry}
                  counts={counts}
                  groupsById={groupsById}
                  onRowClick={onRowClick}
                />
              );
            }
            const counts: Counts = {
              todos: openTodosByPerson.get(entry.person.id) ?? 0,
              logs: logsByPerson.get(entry.person.id) ?? 0,
              notices: noticesByPerson.get(entry.person.id) ?? 0,
            };
            return (
              <IndividualTableRow
                key={entry.fromFamilySearch ? `${entry.person.id}-search` : entry.person.id}
                entry={entry}
                familiesById={familiesById}
                groupsById={groupsById}
                counts={counts}
                onRowClick={onRowClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  direction,
  onSort,
}: {
  label: string;
  direction: SortDirection;
  onSort: () => void;
}) {
  const active = direction !== null;
  const Icon = direction === 'asc' ? CaretUp : direction === 'desc' ? CaretDown : CaretUpDown;
  return (
    <th style={headerCellStyle}>
      <button
        type="button"
        onClick={onSort}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
          color: active ? 'var(--text-primary)' : 'inherit',
          cursor: 'pointer',
        }}
      >
        {label}
        <Icon size={12} weight={active ? 'bold' : 'regular'} />
      </button>
    </th>
  );
}

function FamilyTableRow({
  entry,
  counts,
  groupsById,
  onRowClick,
}: {
  entry: Extract<PeopleEntry, { type: 'family' }>;
  counts: Counts;
  groupsById: Map<string, Group>;
  onRowClick: (href: string) => (e: React.MouseEvent<HTMLTableRowElement>) => void;
}) {
  const { family, members, lastNoteTs } = entry;
  const allGroupIds = [...new Set(members.flatMap((m) => m.groupIds))];
  const allGroups = allGroupIds
    .map((id) => groupsById.get(id))
    .filter((g): g is Group => g !== undefined);
  const shepherdIds = [...new Set(members.flatMap((m) => m.assignedShepherdIds))];
  const adultsLabel = `Family · ${members.length} member${members.length !== 1 ? 's' : ''}${
    family.childCount ? ` · ${family.childCount} kid${family.childCount !== 1 ? 's' : ''}` : ''
  }`;

  return (
    <tr
      className="people-row"
      data-href={`/family/${family.id}`}
      onClick={onRowClick(`/family/${family.id}`)}
    >
      <td style={cellStyle}>
        <Link
          href={`/family/${family.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <AvatarBadge
            name={family.label}
            photo={family.photo}
            size={32}
            bg="var(--sage)"
            color="var(--sage-light)"
            icon={<House size={16} color="var(--sage-light)" />}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{family.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{adultsLabel}</div>
          </div>
        </Link>
      </td>
      <td style={cellStyle}>
        {shepherdIds.length === 0 ? (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
          >
            <StatusBadge
              label="No shepherd"
              bg="var(--amber-light)"
              color="var(--amber)"
              border="1px solid var(--amber-border)"
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {aggregateMembership(members)}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {aggregateMembership(members)}
          </span>
        )}
      </td>
      <td style={cellStyle}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {aggregateAttendance(members)}
        </span>
      </td>
      <td style={cellStyle}>
        <GroupCells groups={allGroups} />
      </td>
      <td style={cellStyle}>
        <CountCell value={counts.logs} />
      </td>
      <td style={cellStyle}>
        <CountCell value={counts.todos} />
      </td>
      <td style={cellStyle}>
        <CountCell value={counts.notices} />
      </td>
      <td style={cellStyle}>
        <LastContactCell lastNoteTs={lastNoteTs} />
      </td>
      <RowActionsCell target={{ kind: 'family', family }} />
    </tr>
  );
}

function IndividualTableRow({
  entry,
  familiesById,
  groupsById,
  counts,
  onRowClick,
}: {
  entry: Extract<PeopleEntry, { type: 'individual' }>;
  familiesById: Map<string, Family>;
  groupsById: Map<string, Group>;
  counts: Counts;
  onRowClick: (href: string) => (e: React.MouseEvent<HTMLTableRowElement>) => void;
}) {
  const { person, lastNoteTs } = entry;
  const personGroups = person.groupIds
    .map((id) => groupsById.get(id))
    .filter((g): g is Group => g !== undefined);
  const family = person.familyId ? familiesById.get(person.familyId) : undefined;
  const subtitle = family ? family.label : person.alternativeName;

  return (
    <tr
      className="people-row"
      data-href={`/person/${person.id}`}
      onClick={onRowClick(`/person/${person.id}`)}
    >
      <td style={cellStyle}>
        <Link
          href={`/person/${person.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <AvatarBadge name={fullName(person)} photo={person.photo} size={32} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {person.isShepherd && (
                <span
                  title="Shepherd"
                  aria-label="Shepherd"
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <HandHeart size={12} color="var(--sage)" />
                </span>
              )}
              {fullName(person)}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </Link>
      </td>
      <td style={cellStyle}>
        {person.assignedShepherdIds.length === 0 ? (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
          >
            <StatusBadge
              label="No shepherd"
              bg="var(--amber-light)"
              color="var(--amber)"
              border="1px solid var(--amber-border)"
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {getMembershipLabel(person.membershipStatus)}
            </span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {getMembershipLabel(person.membershipStatus)}
          </span>
        )}
      </td>
      <td style={cellStyle}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {getChurchAttendanceLabel(person.churchAttendance)}
        </span>
      </td>
      <td style={cellStyle}>
        <GroupCells groups={personGroups} />
      </td>
      <td style={cellStyle}>
        <CountCell value={counts.logs} />
      </td>
      <td style={cellStyle}>
        <CountCell value={counts.todos} />
      </td>
      <td style={cellStyle}>
        <CountCell value={counts.notices} />
      </td>
      <td style={cellStyle}>
        <LastContactCell lastNoteTs={lastNoteTs} />
      </td>
      <RowActionsCell target={{ kind: 'person', person }} />
    </tr>
  );
}

function CountCell({ value }: { value: number }) {
  return (
    <span
      style={{
        fontSize: 13,
        color: value === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
      }}
    >
      {value}
    </span>
  );
}

const groupChipStyle: React.CSSProperties = {
  fontSize: 10,
  padding: '0.125rem 0.4375rem',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

function GroupCells({ groups }: { groups: Group[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(groups.length);

  React.useLayoutEffect(() => {
    setVisibleCount(groups.length);
  }, [groups]);

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;
    const tops = new Set(children.map((c) => c.offsetTop));
    if (tops.size > 2 && visibleCount > 1) {
      setVisibleCount((v) => Math.max(1, v - 1));
    }
  });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setVisibleCount(groups.length));
    observer.observe(el);
    return () => observer.disconnect();
  }, [groups]);

  if (groups.length === 0) {
    return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No group</span>;
  }

  const visible = groups.slice(0, visibleCount);
  const hidden = groups.length - visible.length;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      {visible.map((g) => (
        <span key={g.id} style={groupChipStyle}>
          {g.name}
        </span>
      ))}
      {hidden > 0 && <span style={groupChipStyle}>+{hidden}</span>}
    </div>
  );
}

function LastContactCell({ lastNoteTs }: { lastNoteTs: number | null }) {
  const daysSince =
    lastNoteTs !== null ? differenceInCalendarDays(new Date(), new Date(lastNoteTs)) : null;
  return <LogStatusTag daysSince={daysSince} lastNoteTs={lastNoteTs} />;
}

function getSortDirection(
  active: HomeSortKey,
  ascKey: HomeSortKey,
  descKey: HomeSortKey
): SortDirection {
  if (active === ascKey) return 'asc';
  if (active === descKey) return 'desc';
  return null;
}

function toggleSort(current: HomeSortKey, ascKey: HomeSortKey, descKey: HomeSortKey): HomeSortKey {
  return current === ascKey ? descKey : ascKey;
}
