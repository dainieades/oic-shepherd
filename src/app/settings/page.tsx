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
  const { data, currentPersona, themePreference, mapProvider, calendarSyncEnabled, supabaseUser, signOut, linkGoogle } = useApp();
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
      ? 'Pastor / Admin'
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
        className="sticky top-0 bg-bg -mx-4 px-4 z-sticky"
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
      <Link
        href="/settings/profile"
        className="no-underline block mb-7 mt-2"
      >
        <div className="bg-surface rounded border border-border-light py-[0.875rem] px-4 flex items-center gap-3.5">
          {person?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo}
              alt={displayName}
              className="w-[52px] h-[52px] rounded-full object-cover shrink-0"
            />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-[52px] h-[52px] rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-sage text-on-sage flex items-center justify-center text-17 font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-16 font-bold text-text-primary m-0 tracking-tight-1">
                {displayName}
              </p>
              {person?.alternativeName && (
                <span className="text-13 text-text-muted font-normal">
                  {person.alternativeName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-[5px] mt-[3px]">
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
          <Link href="/settings/password" className="no-underline block">
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
            className={`w-full bg-transparent border-none p-0 text-left block${linkingGoogle ? ' cursor-not-allowed opacity-60' : ' cursor-pointer'}`}
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
        <Link href="/settings/appearance" className="no-underline block">
          <SettingsRow
            icon={<CircleHalf size={18} color="var(--text-muted)" />}
            label="Appearance"
            value={
              themePreference === 'light' ? 'Light' : themePreference === 'dark' ? 'Dark' : 'System'
            }
            chevron
          />
        </Link>
        <Link href="/settings/maps" className="no-underline block">
          <SettingsRow
            icon={<MapPin size={18} color="var(--text-muted)" />}
            label="Maps App"
            value={MAP_PROVIDER_LABELS[mapProvider]}
            chevron
          />
        </Link>
        <Link href="/settings/notifications" className="no-underline block">
          <SettingsRow
            icon={<Bell size={18} color="var(--text-muted)" />}
            label="Notifications"
            chevron
          />
        </Link>
        <Link href="/settings/calendar-sync" className="no-underline block">
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
            <Link href="/settings/access" className="no-underline block">
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
        className="w-full mt-2 bg-surface border border-border-light rounded p-4 cursor-pointer text-left flex items-center gap-3"
      >
        <SignOut size={18} color="var(--red)" />
        <span className="text-15 font-medium text-red">Sign Out</span>
      </button>

      {showSignOutConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8 z-nested bg-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignOutConfirm(false);
          }}
        >
          <div className="bg-surface rounded-[16px] w-full max-w-[320px] overflow-hidden">
            <div className="px-5 pt-6 pb-4 text-center">
              <p className="text-16 font-semibold text-text-primary mt-0 mb-[0.375rem]">
                Sign out?
              </p>
              <p className="text-14 text-text-muted m-0">
                You can always sign back in.
              </p>
            </div>
            <div className="border-t border-border-light flex">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 h-[50px] bg-transparent border-none border-r border-border-light text-15 text-text-secondary cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 h-[50px] bg-transparent border-none text-15 text-sage cursor-pointer font-semibold"
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
    <div
      className="no-last-border flex items-center gap-3.5 py-[0.875rem] px-4 border-b border-border-light"
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-15 font-medium text-text-primary">
        {label}
      </span>
      {value && <span className="text-14 text-text-muted">{value}</span>}
      {chevron && <CaretRight size={15} color="var(--text-muted)" />}
    </div>
  );
}
