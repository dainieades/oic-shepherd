import type { Icon } from '@phosphor-icons/react';
import { UserList, Notepad, CheckCircle, UsersFour, Gear } from '@phosphor-icons/react';

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Returns true when the given pathname matches this nav item. */
  matches: (pathname: string) => boolean;
  /** When true, the item is hidden for welcome-team personas. */
  shepherdOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/',
    label: 'People',
    icon: UserList,
    matches: (p) => p === '/' || p === '/people',
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
    matches: (p) => p === '/settings',
  },
];

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
