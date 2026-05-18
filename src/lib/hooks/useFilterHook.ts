'use client';

import React from 'react';
import { type Dispatch, type SetStateAction } from 'react';
import { type MembershipStatus, type ChurchAttendance, type AppRole } from '../types';

export type HomeSortKey =
  | 'last-contacted'
  | 'last-contacted-recent'
  | 'name'
  | 'name-desc'
  | 'last-name'
  | 'last-name-desc'
  | 'status'
  | 'status-desc'
  | 'attendance'
  | 'attendance-desc'
  | 'groups'
  | 'groups-desc'
  | 'todos'
  | 'todos-desc'
  | 'logs'
  | 'logs-desc'
  | 'notices'
  | 'notices-desc';

export interface HomeFilters {
  shepherds: string[];
  memberships: MembershipStatus[];
  attendances: ChurchAttendance[];
  groups: string[];
  archiveFilter: 'hide' | 'include' | 'only';
  discipleship: ('in' | 'not-in')[];
  appRoles: AppRole[];
  positions: string[];
  languages: string[];
}

export const HOME_DEFAULT_FILTERS: HomeFilters = {
  shepherds: ['mine'],
  memberships: [],
  attendances: [],
  groups: [],
  archiveFilter: 'hide',
  discipleship: [],
  appRoles: [],
  positions: [],
  languages: [],
};

export interface FilterHookResult {
  homeFilters: HomeFilters;
  setHomeFilters: Dispatch<SetStateAction<HomeFilters>>;
  homeSortKey: HomeSortKey;
  setHomeSortKey: Dispatch<SetStateAction<HomeSortKey>>;
  todosShepherdFilter: string[];
  setTodosShepherdFilter: Dispatch<SetStateAction<string[]>>;
  logsShepherdFilter: string[];
  setLogsShepherdFilter: Dispatch<SetStateAction<string[]>>;
  resetFilters: () => void;
}

export function useFilterHook(): FilterHookResult {
  const [homeFilters, setHomeFilters] = React.useState<HomeFilters>(HOME_DEFAULT_FILTERS);
  const [homeSortKey, setHomeSortKey] = React.useState<HomeSortKey>('last-contacted');
  const [todosShepherdFilter, setTodosShepherdFilter] = React.useState<string[]>(['mine']);
  const [logsShepherdFilter, setLogsShepherdFilter] = React.useState<string[]>(['mine']);

  const resetFilters = React.useCallback(() => {
    setHomeFilters(HOME_DEFAULT_FILTERS);
    setHomeSortKey('last-contacted');
    setTodosShepherdFilter(['mine']);
    setLogsShepherdFilter(['mine']);
  }, []);

  return {
    homeFilters,
    setHomeFilters,
    homeSortKey,
    setHomeSortKey,
    todosShepherdFilter,
    setTodosShepherdFilter,
    logsShepherdFilter,
    setLogsShepherdFilter,
    resetFilters,
  };
}
