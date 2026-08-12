'use client';

import React from 'react';
import { DrawerSection } from '@/components/form/DrawerSection';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CaretRight,
  EnvelopeSimple,
  Lock,
  SignOut,
  HandHeart,
  ShieldStar,
  Users,
  MapPin,
  GoogleLogo,
  CircleHalf,
  Bell,
  CalendarBlank,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';
import { MAP_PROVIDER_LABELS, fullName } from '@/lib/utils';

export default function SettingsPage() {
  const {
    data,
    currentPersona,
    themePreference,
    mapProvider,
    calendarSyncEnabled,
    supabaseUser,
    signOut,
    linkGoogle,
  } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const [linkingGoogle, setLinkingGoogle] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 64rem)');
    if (mq.matches) {
      router.replace('/settings/profile');
    }
  }, [router]);

  const person = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  // When the dev persona switcher is overriding the logged-in user, show the
  // persona's identity instead of the Google account's identity.
  const isDevOverride = supabaseUser && currentPersona.userId !== supabaseUser.id;
  const displayName = isDevOverride
    ? person
      ? fullName(person)
      : currentPersona.name
    : person
      ? fullName(person)
      : (supabaseUser?.user_metadata?.full_name ?? currentPersona.name);
  const displayEmail = isDevOverride
    ? (person?.email ?? '')
    : (supabaseUser?.email ?? person?.email ?? '');
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
  const hasGoogle = supabaseUser?.identities?.some((i) => i.provider === 'google') ?? false;

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback';
    try {
      await linkGoogle(redirectTo);
    } catch (err) {
      setLinkingGoogle(false);
      showToast('Could not link Google account. Try again.', 'error');
      console.error('Link Google error:', err);
    }
  };

  return (
    <div className="settings-index-mobile pb-12">
      {/* Sticky header */}
      <div
        className="bg-bg z-sticky sticky top-0 -mx-4 px-4"
        style={{
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        <div
          className="flex items-center overflow-hidden"
          style={{
            height: scrolled ? '2.75rem' : '4.125rem',
            transition: 'height 0.25s ease',
          }}
        >
          <span
            className="text-text-primary leading-none"
            style={{
              fontSize: scrolled ? 'var(--text-17)' : 'var(--text-32)',
              fontWeight: scrolled ? 'var(--font-semibold)' : 'var(--font-extrabold)',
              letterSpacing: scrolled ? 'var(--tracking-tight-1)' : 'var(--tracking-tight-3)',
              transition: 'font-size 0.25s ease, letter-spacing 0.25s ease',
            }}
          >
            Settings
          </span>
        </div>
      </div>

      {/* ── Profile row ── */}
      <Link href="/settings/profile" className="mt-2 mb-7 block no-underline">
        <div className="bg-surface border-border-light flex items-center gap-3.5 rounded border px-4 py-[0.875rem]">
          {person?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo}
              alt={displayName}
              className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
            />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="bg-sage text-on-sage text-17 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full font-bold">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-16 text-text-primary tracking-tight-1 m-0 font-bold">
                {displayName}
              </p>
              {person?.alternativeName && (
                <span className="text-13 text-text-muted font-normal">
                  {person.alternativeName}
                </span>
              )}
            </div>
            <div className="mt-[3px] flex items-center gap-[5px]">
              {currentPersona.role === 'admin' ? (
                <ShieldStar size={13} color="var(--sage)" weight="fill" />
              ) : currentPersona.role === 'shepherd' ? (
                <HandHeart size={13} color="var(--sage)" weight="fill" />
              ) : null}
              <span className="text-13 text-text-muted">{roleLabel}</span>
            </div>
          </div>
          <CaretRight size={16} color="var(--text-muted)" />
        </div>
      </Link>

      {/* ── Account ── */}
      <DrawerSection label="Account" cardPadding="0">
        <SettingsRow
          icon={<EnvelopeSimple size={18} color="var(--text-muted)" />}
          label="Email"
          value={displayEmail}
        />
        {hasPassword && (
          <Link href="/settings/password" className="block no-underline">
            <SettingsRow
              icon={<Lock size={18} color="var(--text-muted)" />}
              label="Change Password"
              chevron
            />
          </Link>
        )}
        {hasPassword && !hasGoogle && (
          <button
            onClick={handleLinkGoogle}
            disabled={linkingGoogle}
            className={`block w-full border-none bg-transparent p-0 text-left ${linkingGoogle ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <SettingsRow
              icon={<GoogleLogo size={18} color="var(--text-muted)" />}
              label={linkingGoogle ? 'Connecting…' : 'Link Google Account'}
              chevron={!linkingGoogle}
            />
          </button>
        )}
      </DrawerSection>

      {/* ── Preferences ── */}
      <DrawerSection label="Preferences" cardPadding="0">
        <Link href="/settings/appearance" className="block no-underline">
          <SettingsRow
            icon={<CircleHalf size={18} color="var(--text-muted)" />}
            label="Appearance"
            value={
              themePreference === 'light' ? 'Light' : themePreference === 'dark' ? 'Dark' : 'System'
            }
            chevron
          />
        </Link>
        <Link href="/settings/maps" className="block no-underline">
          <SettingsRow
            icon={<MapPin size={18} color="var(--text-muted)" />}
            label="Maps App"
            value={MAP_PROVIDER_LABELS[mapProvider]}
            chevron
          />
        </Link>
        <Link href="/settings/notifications" className="block no-underline">
          <SettingsRow
            icon={<Bell size={18} color="var(--text-muted)" />}
            label="Notifications"
            chevron
          />
        </Link>
        <Link href="/settings/calendar-sync" className="block no-underline">
          <SettingsRow
            icon={<CalendarBlank size={18} color="var(--text-muted)" />}
            label="Calendar Sync"
            value={calendarSyncEnabled ? 'On' : 'Off'}
            chevron
          />
        </Link>
      </DrawerSection>

      {/* ── Admin ── */}
      {currentPersona.role === 'admin' && (
        <>
          <DrawerSection label="Admin" cardPadding="0">
            <Link href="/settings/access" className="block no-underline">
              <SettingsRow
                icon={<Users size={18} color="var(--text-muted)" />}
                label="Access Management"
                chevron
              />
            </Link>
          </DrawerSection>
        </>
      )}

      {/* ── Sign Out ── */}
      <button
        onClick={() => setShowSignOutConfirm(true)}
        className="bg-surface border-border-light mt-2 flex w-full cursor-pointer items-center gap-3 rounded border p-4 text-left"
      >
        <SignOut size={18} color="var(--red)" />
        <span className="text-15 text-red font-medium">Sign Out</span>
      </button>

      {showSignOutConfirm && (
        <div
          className="z-nested bg-backdrop fixed inset-0 flex items-center justify-center px-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignOutConfirm(false);
          }}
        >
          <div className="bg-surface w-full max-w-[320px] overflow-hidden rounded-[16px]">
            <div className="px-5 pt-6 pb-4 text-center">
              <p className="text-16 text-text-primary mt-0 mb-[0.375rem] font-semibold">
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
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  chevron,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  chevron?: boolean;
}) {
  return (
    <div className="no-last-border border-border-light flex items-center gap-3.5 border-b px-4 py-[0.875rem]">
      <span className="shrink-0">{icon}</span>
      <span className="text-15 text-text-primary flex-1 font-medium">{label}</span>
      {value && <span className="text-14 text-text-muted">{value}</span>}
      {chevron && <CaretRight size={15} color="var(--text-muted)" />}
    </div>
  );
}
