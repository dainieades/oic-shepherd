import type { Icon } from '@phosphor-icons/react';
import {
  UserList,
  Notepad,
  CheckCircle,
  UsersFour,
  Gear,
  HandWaving,
} from '@phosphor-icons/react';
import type { Role } from './types';

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Returns true when the given pathname matches this nav item. */
  matches: (pathname: string) => boolean;
  /** When true, the item is hidden for welcome-team personas. */
  shepherdOnly?: boolean;
  /** When set, only personas with one of these roles see the item. */
  roles?: readonly Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/',
    label: 'People',
    icon: UserList,
    matches: (p) => p === '/' || p === '/people',
  },
  {
    href: '/visitors/pending',
    label: 'Visitors',
    icon: HandWaving,
    matches: (p) => p.startsWith('/visitors'),
    roles: ['admin', 'welcome-team'],
  },
  {
    href: '/logs',
    label: 'Logs',
    icon: Notepad,
    matches: (p) => p === '/logs',
    shepherdOnly: true,
  },
  {
    href: '/todos',
    label: 'To-dos',
    icon: CheckCircle,
    matches: (p) => p === '/todos',
    shepherdOnly: true,
  },
  {
    href: '/groups',
    label: 'Groups',
    icon: UsersFour,
    matches: (p) => p === '/groups',
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Gear,
    matches: (p) => p === '/settings' || p.startsWith('/settings/'),
  },
];

export function isNavItemVisible(item: NavItem, role: Role): boolean {
  if (item.roles && !item.roles.includes(role)) return false;
  if (item.shepherdOnly && role === 'welcome-team') return false;
  return true;
}

export function isHiddenRoute(pathname: string): boolean {
  return (
    /^\/(person|family|groups)\/[^/]+/.test(pathname) ||
    pathname === '/settings/profile' ||
    pathname === '/settings/access' ||
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/welcome'
  );
}

/**
 * Desktop SideNav hides only on truly chromeless routes. Settings sub-pages
 * keep SideNav visible because the desktop settings layout provides its own
 * inner sidebar alongside the global nav.
 */
export function isSideNavHidden(pathname: string): boolean {
  return pathname === '/signin' || pathname === '/signup' || pathname === '/welcome';
}
