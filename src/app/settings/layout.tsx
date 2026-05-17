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
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { fullName } from '@/lib/utils';
import { BACKDROP_COLOR, Z_NESTED } from '@/lib/constants';

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
  const { data, currentPersona } = useApp();
  const [supabaseUser, setSupabaseUser] = React.useState<User | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSupabaseUser(data.user));
  }, []);

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
      ? 'Pastor / Admin'
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
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('shepherd-app-persona');
    router.push('/signin');
  };

  return (
    <>
      <aside className="settings-sidebar-desktop">
        <h1
          style={{
            fontSize: 'var(--text-28)',
            fontWeight: 'var(--font-extrabold)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight-3)',
            margin: 0,
            lineHeight: 'var(--leading-none)',
          }}
        >
          Settings
        </h1>

        <Link
          href="/settings/profile"
          style={{
            textDecoration: 'none',
            background: pathname === '/settings/profile' ? 'var(--sage-light)' : 'var(--surface)',
            border: '1px solid',
            borderColor:
              pathname === '/settings/profile' ? 'var(--sage-mid)' : 'var(--border-light)',
            borderRadius: 'var(--radius)',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {person?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo}
              alt={displayName}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-15)',
                fontWeight: 'var(--font-bold)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: 'var(--tracking-tight-1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {currentPersona.role === 'admin' ? (
                <ShieldStar size={11} color="var(--sage)" weight="fill" />
              ) : currentPersona.role === 'shepherd' ? (
                <HandHeart size={11} color="var(--sage)" weight="fill" />
              ) : null}
              <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>{roleLabel}</span>
            </div>
          </div>
        </Link>

        {accountItems.length > 0 && (
          <NavGroup label="Account" items={accountItems} pathname={pathname} />
        )}
        <NavGroup label="Preferences" items={preferenceItems} pathname={pathname} />
        {adminItems.length > 0 && (
          <NavGroup label="Admin" items={adminItems} pathname={pathname} />
        )}

        <button
          onClick={() => setShowSignOutConfirm(true)}
          style={{
            marginTop: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <SignOut size={16} color="var(--red)" />
          <span style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--font-medium)', color: 'var(--red)' }}>Sign Out</span>
        </button>
      </aside>

      {showSignOutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: Z_NESTED,
            background: BACKDROP_COLOR,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignOutConfirm(false);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 320,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.5rem 1.25rem 1rem', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 'var(--text-16)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 0.375rem',
                }}
              >
                Sign out?
              </p>
              <p style={{ fontSize: 'var(--text-14)', color: 'var(--text-muted)', margin: 0 }}>
                You can always sign back in.
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{
                  flex: 1,
                  height: 50,
                  background: 'none',
                  border: 'none',
                  borderRight: '1px solid var(--border-light)',
                  fontSize: 'var(--text-15)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  flex: 1,
                  height: 50,
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--text-15)',
                  color: 'var(--sage)',
                  cursor: 'pointer',
                  fontWeight: 'var(--font-semibold)',
                }}
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
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-12)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide-4)',
          padding: '0.75rem 1rem 0.5rem',
        }}
      >
        {label}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.625rem 1rem',
                fontSize: 'var(--text-14)',
                fontWeight: active ? 'var(--font-semibold)' : 'var(--font-medium)',
                color: active ? 'var(--sage)' : 'var(--text-primary)',
                background: active ? 'var(--sage-tint, rgba(0,0,0,0.04))' : 'transparent',
                borderLeft: active ? '3px solid var(--sage)' : '3px solid transparent',
              }}
            >
              <span style={{ flexShrink: 0, color: active ? 'var(--sage)' : 'var(--text-muted)' }}>
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
