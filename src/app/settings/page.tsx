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
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { MAP_PROVIDER_LABELS } from '@/lib/utils';
import { BACKDROP_COLOR, Z_NESTED } from '@/lib/constants';

export default function SettingsPage() {
  const { data, currentPersona, switchPersona, themePreference, mapProvider } = useApp();
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const [supabaseUser, setSupabaseUser] = React.useState<User | null>(null);
  const [linkingGoogle, setLinkingGoogle] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSupabaseUser(data.user));
  }, []);

  const person = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  // When the dev persona switcher is overriding the logged-in user, show the
  // persona's identity instead of the Google account's identity.
  const isDevOverride = supabaseUser && currentPersona.userId !== supabaseUser.id;
  const displayName = isDevOverride
    ? (person?.englishName ?? currentPersona.name)
    : (supabaseUser?.user_metadata?.full_name ?? person?.englishName ?? currentPersona.name);
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
        ? 'Shepherd'
        : 'Welcome Team';

  const hasPassword = supabaseUser?.identities?.some((i) => i.provider === 'email') ?? false;
  const hasGoogle = supabaseUser?.identities?.some((i) => i.provider === 'google') ?? false;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    switchPersona(data.personas[0].id);
    router.push('/signin');
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback';
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setLinkingGoogle(false);
      // error will be visible briefly before redirect — no need to show in UI
      console.error('Link Google error:', error.message);
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Sticky header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          background: 'var(--bg)',
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        {scrolled ? (
          <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Settings
            </span>
          </div>
        ) : (
          <div style={{ paddingTop: 20, paddingBottom: 14 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Settings
            </h1>
          </div>
        )}
      </div>

      {/* ── Profile row ── */}
      <Link
        href="/settings/profile"
        style={{ textDecoration: 'none', display: 'block', marginBottom: 28, marginTop: 8 }}
      >
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {person?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo}
              alt={displayName}
              style={{
                width: 52,
                height: 52,
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
                width: 52,
                height: 52,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {displayName}
              </p>
              {person?.chineseName && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                  {person.chineseName}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              {currentPersona.role === 'admin' ? (
                <ShieldStar size={13} color="var(--sage)" weight="fill" />
              ) : currentPersona.role === 'shepherd' ? (
                <HandHeart size={13} color="var(--sage)" weight="fill" />
              ) : null}
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{roleLabel}</span>
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
          <Link href="/settings/password" style={{ textDecoration: 'none', display: 'block' }}>
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
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: linkingGoogle ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              display: 'block',
              opacity: linkingGoogle ? 0.6 : 1,
            }}
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
        <Link href="/settings/appearance" style={{ textDecoration: 'none', display: 'block' }}>
          <SettingsRow
            icon={<CircleHalf size={18} color="var(--text-muted)" />}
            label="Appearance"
            value={themePreference === 'light' ? 'Light' : themePreference === 'dark' ? 'Dark' : 'System'}
            chevron
          />
        </Link>
        <Link href="/settings/maps" style={{ textDecoration: 'none', display: 'block' }}>
          <SettingsRow
            icon={<MapPin size={18} color="var(--text-muted)" />}
            label="Maps App"
            value={MAP_PROVIDER_LABELS[mapProvider]}
            chevron
          />
        </Link>
      </DrawerSection>

      {/* ── Admin ── */}
      {currentPersona.role === 'admin' && (
        <>
          <DrawerSection label="Admin" cardPadding="0">
            <Link href="/settings/access" style={{ textDecoration: 'none', display: 'block' }}>
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
        style={{
          width: '100%',
          marginTop: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <SignOut size={18} color="var(--red)" />
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--red)' }}>Sign Out</span>
      </button>

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
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.375rem',
                }}
              >
                Sign out?
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
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
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
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
                  fontSize: 15,
                  color: 'var(--sage)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--border-light)',
      }}
      className="no-last-border"
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
        {label}
      </span>
      {value && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{value}</span>}
      {chevron && <CaretRight size={15} color="var(--text-muted)" />}
    </div>
  );
}
