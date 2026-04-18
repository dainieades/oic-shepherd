'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CaretRight,
  EnvelopeSimple,
  Lock,
  Question,
  SignOut,
  HandHeart,
  ShieldStar,
  Users,
  MapPin,
  Check,
  GoogleLogo,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { type MapProvider, MAP_PROVIDER_LABELS, MAP_PROVIDERS_STORAGE_KEY } from '@/lib/utils';

type PasswordStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success' };

export default function SettingsPage() {
  const { data, currentPersona, switchPersona } = useApp();
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const [mapProvider, setMapProvider] = React.useState<MapProvider>('apple');
  const [supabaseUser, setSupabaseUser] = React.useState<User | null>(null);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordStatus, setPasswordStatus] = React.useState<PasswordStatus>({ type: 'idle' });
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

  React.useEffect(() => {
    const stored = localStorage.getItem(MAP_PROVIDERS_STORAGE_KEY) as MapProvider | null;
    if (stored && stored in MAP_PROVIDER_LABELS) setMapProvider(stored);
  }, []);

  const handleMapProviderSelect = (provider: MapProvider) => {
    setMapProvider(provider);
    localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, provider);
    setShowMapPicker(false);
  };

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

  const handleChangePassword = async () => {
    if (!newPassword) {
      setPasswordStatus({ type: 'error', message: 'Please enter a new password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setPasswordStatus({ type: 'loading' });
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus({ type: 'error', message: error.message });
    } else {
      setPasswordStatus({ type: 'success' });
    }
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStatus({ type: 'idle' });
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
          zIndex: 20,
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
            padding: '14px 16px',
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
                color: '#fff',
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
      <SectionLabel>Account</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon={<EnvelopeSimple size={18} color="var(--text-muted)" />}
          label="Email"
          value={displayEmail}
        />
        {hasPassword && (
          <button
            onClick={() => setShowChangePassword(true)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'block',
            }}
          >
            <SettingsRow
              icon={<Lock size={18} color="var(--text-muted)" />}
              label="Change Password"
              chevron
            />
          </button>
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
      </SettingsCard>

      {/* ── Preferences ── */}
      <SectionLabel>Preferences</SectionLabel>
      <SettingsCard>
        <button
          onClick={() => setShowMapPicker(true)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'block',
          }}
        >
          <SettingsRow
            icon={<MapPin size={18} color="var(--text-muted)" />}
            label="Maps App"
            value={MAP_PROVIDER_LABELS[mapProvider]}
            chevron
          />
        </button>
      </SettingsCard>

      {/* ── Admin ── */}
      {currentPersona.role === 'admin' && (
        <>
          <SectionLabel>Admin</SectionLabel>
          <SettingsCard>
            <Link href="/settings/access" style={{ textDecoration: 'none', display: 'block' }}>
              <SettingsRow
                icon={<Users size={18} color="var(--text-muted)" />}
                label="Access Management"
                chevron
              />
            </Link>
          </SettingsCard>
        </>
      )}

      {/* ── Help ── */}
      <SectionLabel>Help</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon={<Question size={18} color="var(--text-muted)" />}
          label="Help & Support"
          chevron
        />
      </SettingsCard>

      {/* ── Sign Out ── */}
      <button
        onClick={() => setShowSignOutConfirm(true)}
        style={{
          width: '100%',
          marginTop: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius)',
          padding: '16px',
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

      {showMapPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(30,26,24,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMapPicker(false);
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
            <div style={{ padding: '20px 20px 12px', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px',
                }}
              >
                Maps App
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Choose which app opens when you tap an address.
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)' }}>
              {(['apple', 'google', 'waze'] as MapProvider[]).map((provider, i, arr) => (
                <button
                  key={provider}
                  onClick={() => handleMapProviderSelect(provider)}
                  style={{
                    width: '100%',
                    height: 50,
                    background: 'none',
                    border: 'none',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    cursor: 'pointer',
                    fontSize: 15,
                    color: 'var(--text-primary)',
                    fontWeight: mapProvider === provider ? 600 : 400,
                  }}
                >
                  <span>{MAP_PROVIDER_LABELS[provider]}</span>
                  {mapProvider === provider && (
                    <Check size={17} color="var(--sage)" weight="bold" />
                  )}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={() => setShowMapPicker(false)}
                style={{
                  width: '100%',
                  height: 50,
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(30,26,24,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && passwordStatus.type !== 'loading')
              closeChangePassword();
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 340,
              overflow: 'hidden',
            }}
          >
            {passwordStatus.type === 'success' ? (
              <>
                <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 6px',
                    }}
                  >
                    Password updated
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                    Your new password is active.
                  </p>
                </div>
                <div style={{ borderTop: '1px solid var(--border-light)' }}>
                  <button
                    onClick={closeChangePassword}
                    style={{
                      width: '100%',
                      height: 50,
                      background: 'none',
                      border: 'none',
                      fontSize: 15,
                      color: 'var(--sage)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '24px 20px 16px' }}>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 16px',
                      textAlign: 'center',
                    }}
                  >
                    Change Password
                  </p>
                  {passwordStatus.type === 'error' && (
                    <div
                      style={{
                        background: 'var(--red-light)',
                        border: '1px solid var(--red-border)',
                        borderRadius: 10,
                        padding: '9px 13px',
                        marginBottom: 14,
                        fontSize: 13,
                        color: 'var(--red)',
                      }}
                    >
                      {passwordStatus.message}
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 5,
                      }}
                    >
                      New password
                    </label>
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordStatus.type === 'loading'}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 10,
                        border: '1.5px solid var(--border)',
                        fontSize: 15,
                        color: 'var(--text-primary)',
                        background: 'var(--bg)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 5,
                      }}
                    >
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordStatus.type === 'loading'}
                      onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 10,
                        border: '1.5px solid var(--border)',
                        fontSize: 15,
                        color: 'var(--text-primary)',
                        background: 'var(--bg)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
                  <button
                    onClick={closeChangePassword}
                    disabled={passwordStatus.type === 'loading'}
                    style={{
                      flex: 1,
                      height: 50,
                      background: 'none',
                      border: 'none',
                      borderRight: '1px solid var(--border-light)',
                      fontSize: 15,
                      color: 'var(--text-secondary)',
                      cursor: passwordStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      opacity: passwordStatus.type === 'loading' ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={passwordStatus.type === 'loading'}
                    style={{
                      flex: 1,
                      height: 50,
                      background: 'none',
                      border: 'none',
                      fontSize: 15,
                      color: 'var(--sage)',
                      cursor: passwordStatus.type === 'loading' ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      opacity: passwordStatus.type === 'loading' ? 0.6 : 1,
                    }}
                  >
                    {passwordStatus.type === 'loading' ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSignOutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(30,26,24,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
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
            <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px',
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 8,
        marginTop: 0,
      }}
    >
      {children}
    </p>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="no-last-border"
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        marginBottom: 20,
      }}
    >
      {children}
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
        padding: '14px 16px',
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
