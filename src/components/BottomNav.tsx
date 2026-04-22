'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserList, Notepad, CheckCircle, Gear, UsersFour } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';

export default function BottomNav() {
  const pathname = usePathname();
  const { currentPersona, fullPageModalOpen } = useApp();
  const isWelcome = currentPersona.role === 'welcome-team';

  // Hide on detail pages, sign-in, and when a full-page modal is open
  const isDetail =
    /^\/(person|family|groups)\/[^/]+/.test(pathname) ||
    pathname === '/settings/profile' ||
    pathname === '/signin' ||
    pathname === '/signup';
  if (isDetail || fullPageModalOpen) return null;

  const isPeople = pathname === '/' || pathname === '/people';
  const isLogs = pathname === '/logs';
  const isTodos = pathname === '/todos';
  const isGroups = pathname === '/groups';
  const isSettings = pathname === '/settings';

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[26.875rem] items-end justify-around px-2">
        <NavTab href="/" label="People" active={isPeople}>
          <UserList size={24} weight={isPeople ? 'fill' : 'regular'} />
        </NavTab>

        {!isWelcome && (
          <NavTab href="/logs" label="Logs" active={isLogs}>
            <Notepad size={24} weight={isLogs ? 'fill' : 'regular'} />
          </NavTab>
        )}

        {!isWelcome && (
          <NavTab href="/todos" label="To-dos" active={isTodos}>
            <CheckCircle size={24} weight={isTodos ? 'fill' : 'regular'} />
          </NavTab>
        )}

        <NavTab href="/groups" label="Groups" active={isGroups}>
          <UsersFour size={24} weight={isGroups ? 'fill' : 'regular'} />
        </NavTab>

        <NavTab href="/settings" label="Settings" active={isSettings}>
          <Gear size={24} weight={isSettings ? 'fill' : 'regular'} />
        </NavTab>
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="nav-tab flex w-16 flex-col items-center justify-end gap-0.5 pb-1.5"
      style={{ color: active ? 'var(--sage)' : 'var(--text-muted)', textDecoration: 'none' }}
    >
      {children}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
    </Link>
  );
}
