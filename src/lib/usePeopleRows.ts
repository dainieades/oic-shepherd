import React from 'react';
import { useApp } from '@/lib/context';
import { searchFamiliesAndPeople, getFamilyPriorityScore, fullName } from '@/lib/utils';
import type { Family, Group, Person } from '@/lib/types';

export type PeopleEntry =
  | {
      type: 'family';
      family: Family;
      members: Person[];
      lastNoteTs: number | null;
      group: Group | null;
    }
  | {
      type: 'individual';
      person: Person;
      lastNoteTs: number | null;
      group: Group | null;
      fromFamilySearch?: true;
    };

/**
 * Filters, sorts, and projects the dashboard People list according to the
 * current search query, filters, and sort key in AppContext. Used by both the
 * mobile card list and the desktop table so they stay in lockstep.
 */
export function usePeopleRows(deferredSearch: string): PeopleEntry[] {
  const { data, currentPersona, homeFilters: filters, homeSortKey: sortKey } = useApp();

  return React.useMemo(() => {
    const {
      families: matchedFamilies,
      individuals,
      familyMembers,
    } = searchFamiliesAndPeople(deferredSearch, data.families, data.people);

    const entries: PeopleEntry[] = [];

    const includesMine = filters.shepherds.includes('mine');
    const includesNoShepherd = filters.shepherds.includes('none');
    const specificShepherdIds = filters.shepherds.filter((s) => s !== 'mine' && s !== 'none');
    const includesNoGroup = filters.groups.includes('none');

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

      if (filters.shepherds.length > 0) {
        const matchesMine =
          includesMine && members.some((m) => currentPersona.assignedPeopleIds.includes(m.id));
        const matchesSpecific = specificShepherdIds.some((sid) =>
          members.some((m) => m.assignedShepherdIds.includes(sid))
        );
        const matchesNone =
          includesNoShepherd && members.every((m) => m.assignedShepherdIds.length === 0);
        if (!matchesMine && !matchesSpecific && !matchesNone) continue;
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
      if (
        filters.memberships.length > 0 &&
        !members.some((m) => filters.memberships.includes(m.membershipStatus))
      )
        continue;
      if (
        filters.attendances.length > 0 &&
        !members.some((m) => filters.attendances.includes(m.churchAttendance))
      )
        continue;
      if (filters.groups.length > 0) {
        const specificGroupIds = filters.groups.filter((g) => g !== 'none');
        const matchesGroup =
          specificGroupIds.length > 0 &&
          members.some((m) => specificGroupIds.some((gid) => m.groupIds.includes(gid)));
        const matchesNoGroup = includesNoGroup && members.every((m) => m.groupIds.length === 0);
        if (!matchesGroup && !matchesNoGroup) continue;
      }
      if (filters.discipleship.length > 0) {
        const passes = members.some(
          (m) =>
            (filters.discipleship.includes('in') && m.isBeingDiscipled) ||
            (filters.discipleship.includes('not-in') && !m.isBeingDiscipled)
        );
        if (!passes) continue;
      }
      if (
        filters.appRoles.length > 0 &&
        !members.some((m) => filters.appRoles.includes(m.appRole ?? 'no-access'))
      )
        continue;
      if (filters.positions.length > 0) {
        const specificPositions = filters.positions.filter((p) => p !== 'none');
        const matchesPosition =
          specificPositions.length > 0 &&
          members.some((m) =>
            specificPositions.some((pos) => (m.churchPositions ?? []).includes(pos))
          );
        const matchesNoPosition =
          filters.positions.includes('none') &&
          members.every((m) => (m.churchPositions ?? []).length === 0);
        if (!matchesPosition && !matchesNoPosition) continue;
      }
      if (
        filters.languages.length > 0 &&
        !members.some((m) => filters.languages.some((lang) => m.language.includes(lang)))
      )
        continue;

      const familyLastNoteTs =
        members.reduce((max, m) => {
          const t = lastNoteTime[m.id] ?? 0;
          return t > max ? t : max;
        }, 0) || null;
      const firstGroupId = members.flatMap((m) => m.groupIds)[0];
      const familyGroup = firstGroupId
        ? (data.groups.find((g) => g.id === firstGroupId) ?? null)
        : null;
      entries.push({
        type: 'family',
        family: f,
        members,
        lastNoteTs: familyLastNoteTs,
        group: familyGroup,
      });
    }

    for (const p of individuals) {
      if (filters.shepherds.length > 0) {
        const matchesMine = includesMine && currentPersona.assignedPeopleIds.includes(p.id);
        const matchesSpecific = specificShepherdIds.some((sid) =>
          p.assignedShepherdIds.includes(sid)
        );
        const matchesNone = includesNoShepherd && p.assignedShepherdIds.length === 0;
        if (!matchesMine && !matchesSpecific && !matchesNone) continue;
      }
      if (filters.archiveFilter === 'hide' && p.churchAttendance === 'archived') continue;
      if (filters.archiveFilter === 'only' && p.churchAttendance !== 'archived') continue;
      if (filters.memberships.length > 0 && !filters.memberships.includes(p.membershipStatus))
        continue;
      if (filters.attendances.length > 0 && !filters.attendances.includes(p.churchAttendance))
        continue;
      if (filters.groups.length > 0) {
        const specificGroupIds = filters.groups.filter((g) => g !== 'none');
        const matchesGroup =
          specificGroupIds.length > 0 && specificGroupIds.some((gid) => p.groupIds.includes(gid));
        const matchesNoGroup = includesNoGroup && p.groupIds.length === 0;
        if (!matchesGroup && !matchesNoGroup) continue;
      }
      if (filters.discipleship.length > 0) {
        const passes =
          (filters.discipleship.includes('in') && p.isBeingDiscipled) ||
          (filters.discipleship.includes('not-in') && !p.isBeingDiscipled);
        if (!passes) continue;
      }
      if (filters.appRoles.length > 0 && !filters.appRoles.includes(p.appRole ?? 'no-access'))
        continue;
      if (filters.positions.length > 0) {
        const specificPositions = filters.positions.filter((pos) => pos !== 'none');
        const matchesPosition =
          specificPositions.length > 0 &&
          specificPositions.some((pos) => (p.churchPositions ?? []).includes(pos));
        const matchesNoPosition =
          filters.positions.includes('none') && (p.churchPositions ?? []).length === 0;
        if (!matchesPosition && !matchesNoPosition) continue;
      }
      if (
        filters.languages.length > 0 &&
        !filters.languages.some((lang) => p.language.includes(lang))
      )
        continue;
      const personLastNoteTs = lastNoteTime[p.id] ?? null;
      const personGroup = p.groupIds[0]
        ? (data.groups.find((g) => g.id === p.groupIds[0]) ?? null)
        : null;
      entries.push({
        type: 'individual',
        person: p,
        lastNoteTs: personLastNoteTs,
        group: personGroup,
      });
    }

    for (const p of familyMembers) {
      if (filters.archiveFilter === 'hide' && p.churchAttendance === 'archived') continue;
      if (filters.archiveFilter === 'only' && p.churchAttendance !== 'archived') continue;
      if (filters.memberships.length > 0 && !filters.memberships.includes(p.membershipStatus))
        continue;
      if (filters.attendances.length > 0 && !filters.attendances.includes(p.churchAttendance))
        continue;
      if (filters.groups.length > 0) {
        const specificGroupIds = filters.groups.filter((g) => g !== 'none');
        const matchesGroup =
          specificGroupIds.length > 0 && specificGroupIds.some((gid) => p.groupIds.includes(gid));
        const matchesNoGroup = includesNoGroup && p.groupIds.length === 0;
        if (!matchesGroup && !matchesNoGroup) continue;
      }
      if (filters.discipleship.length > 0) {
        const passes =
          (filters.discipleship.includes('in') && p.isBeingDiscipled) ||
          (filters.discipleship.includes('not-in') && !p.isBeingDiscipled);
        if (!passes) continue;
      }
      if (filters.appRoles.length > 0 && !filters.appRoles.includes(p.appRole ?? 'no-access'))
        continue;
      if (filters.positions.length > 0) {
        const specificPositions = filters.positions.filter((pos) => pos !== 'none');
        const matchesPosition =
          specificPositions.length > 0 &&
          specificPositions.some((pos) => (p.churchPositions ?? []).includes(pos));
        const matchesNoPosition =
          filters.positions.includes('none') && (p.churchPositions ?? []).length === 0;
        if (!matchesPosition && !matchesNoPosition) continue;
      }
      if (
        filters.languages.length > 0 &&
        !filters.languages.some((lang) => p.language.includes(lang))
      )
        continue;
      const personLastNoteTs = lastNoteTime[p.id] ?? null;
      const personGroup = p.groupIds[0]
        ? (data.groups.find((g) => g.id === p.groupIds[0]) ?? null)
        : null;
      entries.push({
        type: 'individual',
        person: p,
        lastNoteTs: personLastNoteTs,
        group: personGroup,
        fromFamilySearch: true,
      });
    }

    const openTodoCountByPerson = new Map<string, number>();
    const openTodoCountByFamily = new Map<string, number>();
    for (const t of data.todos) {
      if (t.completed) continue;
      if (t.personId)
        openTodoCountByPerson.set(t.personId, (openTodoCountByPerson.get(t.personId) ?? 0) + 1);
      if (t.familyId)
        openTodoCountByFamily.set(t.familyId, (openTodoCountByFamily.get(t.familyId) ?? 0) + 1);
    }
    const noticeCountByPerson = new Map<string, number>();
    const noticeCountByFamily = new Map<string, number>();
    for (const n of data.notices) {
      if (n.personId)
        noticeCountByPerson.set(n.personId, (noticeCountByPerson.get(n.personId) ?? 0) + 1);
      if (n.familyId)
        noticeCountByFamily.set(n.familyId, (noticeCountByFamily.get(n.familyId) ?? 0) + 1);
    }
    const logCountByPerson = new Map<string, number>();
    const logCountByFamily = new Map<string, number>();
    for (const n of data.notes) {
      if (n.personId)
        logCountByPerson.set(n.personId, (logCountByPerson.get(n.personId) ?? 0) + 1);
      if (n.familyId)
        logCountByFamily.set(n.familyId, (logCountByFamily.get(n.familyId) ?? 0) + 1);
    }

    const todoCount = (e: PeopleEntry): number => {
      if (e.type === 'family') {
        const m = e.members.reduce((s, p) => s + (openTodoCountByPerson.get(p.id) ?? 0), 0);
        return m + (openTodoCountByFamily.get(e.family.id) ?? 0);
      }
      return openTodoCountByPerson.get(e.person.id) ?? 0;
    };
    const noticeCount = (e: PeopleEntry): number => {
      if (e.type === 'family') {
        const m = e.members.reduce((s, p) => s + (noticeCountByPerson.get(p.id) ?? 0), 0);
        return m + (noticeCountByFamily.get(e.family.id) ?? 0);
      }
      return noticeCountByPerson.get(e.person.id) ?? 0;
    };
    const logCount = (e: PeopleEntry): number => {
      if (e.type === 'family') {
        const m = e.members.reduce((s, p) => s + (logCountByPerson.get(p.id) ?? 0), 0);
        return m + (logCountByFamily.get(e.family.id) ?? 0);
      }
      return logCountByPerson.get(e.person.id) ?? 0;
    };
    const attendanceRank: Record<string, number> = {
      regular: 0,
      visitor: 1,
      'fellowship-group-only': 2,
      'on-leave': 3,
      archived: 4,
    };
    const membershipRank: Record<string, number> = {
      member: 0,
      'membership-track': 1,
      'non-member': 2,
    };
    const attendanceScore = (e: PeopleEntry): number => {
      const list = e.type === 'family' ? e.members : [e.person];
      if (list.length === 0) return 99;
      return Math.min(...list.map((m) => attendanceRank[m.churchAttendance] ?? 99));
    };
    const statusScore = (e: PeopleEntry): number => {
      const list = e.type === 'family' ? e.members : [e.person];
      const noShepherd = list.length === 0 || list.every((m) => m.assignedShepherdIds.length === 0);
      if (noShepherd) return -1;
      if (e.type === 'family') return 0;
      return membershipRank[e.person.membershipStatus] ?? 99;
    };
    const groupSortValue = (e: PeopleEntry): string =>
      e.group ? e.group.name.toLowerCase() : '￿';

    entries.sort((a, b) => {
      const aMembers = a.type === 'family' ? a.members : [a.person];
      const bMembers = b.type === 'family' ? b.members : [b.person];
      const aName = a.type === 'family' ? a.family.label : fullName(a.person);
      const bName = b.type === 'family' ? b.family.label : fullName(b.person);
      const lastName = (n: string) => n.trim().split(/\s+/).slice(-1)[0] ?? n;
      const aLast = lastName(aName);
      const bLast = lastName(bName);

      switch (sortKey) {
        case 'name': {
          const cmp = aName.localeCompare(bName);
          return cmp !== 0 ? cmp : aLast.localeCompare(bLast);
        }
        case 'name-desc': {
          const cmp = bName.localeCompare(aName);
          return cmp !== 0 ? cmp : bLast.localeCompare(aLast);
        }
        case 'last-name': {
          const cmp = aLast.localeCompare(bLast);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'last-name-desc': {
          const cmp = bLast.localeCompare(aLast);
          return cmp !== 0 ? cmp : bName.localeCompare(aName);
        }
        case 'last-contacted': {
          const aTime = Math.max(0, ...aMembers.map((m) => lastNoteTime[m.id] ?? 0));
          const bTime = Math.max(0, ...bMembers.map((m) => lastNoteTime[m.id] ?? 0));
          if (aTime !== bTime) return aTime - bTime;
          return aLast.localeCompare(bLast);
        }
        case 'last-contacted-recent': {
          const aTime = Math.max(0, ...aMembers.map((m) => lastNoteTime[m.id] ?? 0));
          const bTime = Math.max(0, ...bMembers.map((m) => lastNoteTime[m.id] ?? 0));
          if (aTime !== bTime) return bTime - aTime;
          return aLast.localeCompare(bLast);
        }
        case 'status': {
          const cmp = statusScore(a) - statusScore(b);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'status-desc': {
          const cmp = statusScore(b) - statusScore(a);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'attendance': {
          const cmp = attendanceScore(a) - attendanceScore(b);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'attendance-desc': {
          const cmp = attendanceScore(b) - attendanceScore(a);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'groups': {
          const cmp = groupSortValue(a).localeCompare(groupSortValue(b));
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'groups-desc': {
          const cmp = groupSortValue(b).localeCompare(groupSortValue(a));
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'todos': {
          const cmp = todoCount(a) - todoCount(b);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'todos-desc': {
          const cmp = todoCount(b) - todoCount(a);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'logs': {
          const cmp = logCount(a) - logCount(b);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'logs-desc': {
          const cmp = logCount(b) - logCount(a);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'notices': {
          const cmp = noticeCount(a) - noticeCount(b);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        case 'notices-desc': {
          const cmp = noticeCount(b) - noticeCount(a);
          return cmp !== 0 ? cmp : aName.localeCompare(bName);
        }
        default:
          return getFamilyPriorityScore(bMembers) - getFamilyPriorityScore(aMembers);
      }
    });

    return entries;
  }, [data, deferredSearch, filters, sortKey, currentPersona]);
}
