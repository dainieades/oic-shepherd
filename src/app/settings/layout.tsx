'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Lock,
  SignOut,
  HandHeart,
  ShieldStar,
  Users,
  MapPin,
  CircleHalf,
  Bell,
  CalendarBlank,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { fullName } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-shell">
      <DesktopSidebar />
      <div className="settings-content-desktop">{children}</div>
    </div>
  );
}

function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, currentPersona, supabaseUser, signOut } = useApp();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);

  const person = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  const isDevOverride = supabaseUser && currentPersona.userId !== supabaseUser.id;
  const displayName = isDevOverride
    ? person
      ? fullName(person)
      : currentPersona.name
    : person
      ? fullName(person)
      : (supabaseUser?.user_metadata?.full_name ?? currentPersona.name);
  const avatarUrl = isDevOverride ? null : (supabaseUser?.user_metadata?.avatar_url ?? null);
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    currentPersona.role === 'admin'
      ? 'Admin'
      : currentPersona.role === 'shepherd'
        ? 'User'
        : 'Welcome Team';

  const hasPassword = supabaseUser?.identities?.some((i) => i.provider === 'email') ?? false;

  const accountItems: NavItem[] = [];
  if (hasPassword) {
    accountItems.push({
      href: '/settings/password',
      label: 'Password',
      icon: <Lock size={16} weight="regular" />,
    });
  }

  const preferenceItems: NavItem[] = [
    {
      href: '/settings/appearance',
      label: 'Appearance',
      icon: <CircleHalf size={16} weight="regular" />,
    },
    { href: '/settings/maps', label: 'Maps App', icon: <MapPin size={16} weight="regular" /> },
    {
      href: '/settings/notifications',
      label: 'Notifications',
      icon: <Bell size={16} weight="regular" />,
    },
    {
      href: '/settings/calendar-sync',
      label: 'Calendar Sync',
      icon: <CalendarBlank size={16} weight="regular" />,
    },
  ];

  const adminItems: NavItem[] =
    currentPersona.role === 'admin'
      ? [
          {
            href: '/settings/access',
            label: 'Access Management',
            icon: <Users size={16} weight="regular" />,
          },
        ]
      : [];

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <>
      <aside className="settings-sidebar-desktop">
        <h1 className="text-28 text-text-primary tracking-tight-3 m-0 leading-none font-extrabold">
          Settings
        </h1>

        <Link
          href="/settings/profile"
          className="flex items-center gap-3 rounded border px-4 py-3.5 no-underline"
          style={{
            background: pathname === '/settings/profile' ? 'var(--sage-light)' : 'var(--surface)',
            borderColor:
              pathname === '/settings/profile' ? 'var(--sage-mid)' : 'var(--border-light)',
          }}
        >
          {person?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo}
              alt={displayName}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="bg-sage text-on-sage text-15 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-14 text-text-primary tracking-tight-1 m-0 overflow-hidden font-bold text-ellipsis whitespace-nowrap">
              {displayName}
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              {currentPersona.role === 'admin' ? (
                <ShieldStar size={11} color="var(--sage)" weight="fill" />
              ) : currentPersona.role === 'shepherd' ? (
                <HandHeart size={11} color="var(--sage)" weight="fill" />
              ) : null}
              <span className="text-12 text-text-muted">{roleLabel}</span>
            </div>
          </div>
        </Link>

        {accountItems.length > 0 && (
          <NavGroup label="Account" items={accountItems} pathname={pathname} />
        )}
        <NavGroup label="Preferences" items={preferenceItems} pathname={pathname} />
        {adminItems.length > 0 && <NavGroup label="Admin" items={adminItems} pathname={pathname} />}

        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="bg-surface border-border-light mt-auto flex cursor-pointer items-center gap-2.5 rounded border px-4 py-3 text-left"
        >
          <SignOut size={16} color="var(--red)" />
          <span className="text-14 text-red font-medium">Sign Out</span>
        </button>
      </aside>

      {showSignOutConfirm && (
        <div
          className="z-nested bg-backdrop fixed inset-0 flex items-center justify-center px-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignOutConfirm(false);
          }}
        >
          <div className="bg-surface w-full max-w-xs overflow-hidden" style={{ borderRadius: 16 }}>
            <div className="px-5 pt-6 pb-4 text-center">
              <p
                className="text-16 text-text-primary font-semibold"
                style={{ margin: '0 0 0.375rem' }}
              >
                Sign out?
              </p>
              <p className="text-14 text-text-muted m-0">You can always sign back in.</p>
            </div>
            <div className="border-border-light flex border-t">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="border-border-light text-15 text-text-secondary h-[50px] flex-1 cursor-pointer border-r border-none bg-transparent font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="text-15 text-sage h-[50px] flex-1 cursor-pointer border-none bg-transparent font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
}) {
  return (
    <div className="bg-surface border-border-light overflow-hidden rounded border">
      <div
        className="text-12 text-text-muted tracking-wide-4 font-semibold uppercase"
        style={{ padding: '0.75rem 1rem 0.5rem' }}
      >
        {label}
      </div>
      <nav className="flex flex-col">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="text-14 flex items-center gap-2.5 no-underline"
              style={{
                padding: '0.625rem 1rem',
                fontWeight: active ? 'var(--font-semibold)' : 'var(--font-medium)',
                color: active ? 'var(--sage)' : 'var(--text-primary)',
                background: active ? 'var(--sage-tint, rgba(0,0,0,0.04))' : 'transparent',
                borderLeft: active ? '3px solid var(--sage)' : '3px solid transparent',
              }}
            >
              <span
                className="shrink-0"
                style={{ color: active ? 'var(--sage)' : 'var(--text-muted)' }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
