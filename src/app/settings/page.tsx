'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CaretRight, EnvelopeSimple, Lock, Question, SignOut, HandHeart, ShieldStar, Users } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const { data, currentPersona, switchPersona } = useApp();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
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
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const roleLabel =
    currentPersona.role === 'admin' ? 'Pastor / Admin' :
    currentPersona.role === 'shepherd' ? 'Shepherd' :
    'Welcome Team';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    switchPersona(data.personas[0].id);
    router.push('/signin');
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg)',
        marginLeft: -16, marginRight: -16,
        paddingLeft: 16, paddingRight: 16,
        borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
      }}>
        {scrolled ? (
          <div style={{ height: 44, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Settings</span>
          </div>
        ) : (
          <div style={{ paddingTop: 20, paddingBottom: 14 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>Settings</h1>
          </div>
        )}
      </div>

      {/* ── Profile row ── */}
      <Link href="/settings/profile" style={{ textDecoration: 'none', display: 'block', marginBottom: 28, marginTop: 8 }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {person?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photo} alt={displayName} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--sage)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {displayName}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              {currentPersona.role === 'admin'
                ? <ShieldStar size={13} color="var(--sage)" weight="fill" />
                : currentPersona.role === 'shepherd'
                ? <HandHeart size={13} color="var(--sage)" weight="fill" />
                : null}
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{roleLabel}</span>
            </div>
          </div>
          <CaretRight size={16} color="var(--text-muted)" />
        </div>
      </Link>

      {/* ── Account ── */}
      <SectionLabel>Account</SectionLabel>
      <SettingsCard>
        <SettingsRow icon={<EnvelopeSimple size={18} color="var(--text-muted)" />} label="Email" value={displayEmail} />
        <SettingsRow icon={<Lock size={18} color="var(--text-muted)" />} label="Change Password" chevron />
      </SettingsCard>

      {/* ── Admin ── */}
      {currentPersona.role === 'admin' && (
        <>
          <SectionLabel>Admin</SectionLabel>
          <SettingsCard>
            <Link href="/settings/access" style={{ textDecoration: 'none', display: 'block' }}>
              <SettingsRow icon={<Users size={18} color="var(--text-muted)" />} label="Access Management" chevron />
            </Link>
          </SettingsCard>
        </>
      )}

      {/* ── Help ── */}
      <SectionLabel>Help</SectionLabel>
      <SettingsCard>
        <SettingsRow icon={<Question size={18} color="var(--text-muted)" />} label="Help & Support" chevron />
      </SettingsCard>

      {/* ── Sign Out ── */}
      <button
        onClick={() => setShowSignOutConfirm(true)}
        style={{
          width: '100%', marginTop: 8,
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius)',
          padding: '16px', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <SignOut size={18} color="var(--red)" />
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--red)' }}>Sign Out</span>
      </button>

      {showSignOutConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(30,26,24,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSignOutConfirm(false); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 320, overflow: 'hidden' }}>
            <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>Sign out?</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>You can always sign back in.</p>
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{ flex: 1, height: 50, background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: 15, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
              >Cancel</button>
              <button
                onClick={handleSignOut}
                style={{ flex: 1, height: 50, background: 'none', border: 'none', fontSize: 15, color: 'var(--sage)', cursor: 'pointer', fontWeight: 600 }}
              >Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, marginTop: 0 }}>
      {children}
    </p>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-last-border" style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border-light)',
      overflow: 'hidden', marginBottom: 20,
    }}>
      {children}
    </div>
  );
}

function SettingsRow({ icon, label, value, chevron }: {
  icon: React.ReactNode; label: string; value?: string; chevron?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }} className="no-last-border">
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
      {value && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{value}</span>}
      {chevron && <CaretRight size={15} color="var(--text-muted)" />}
    </div>
  );
}
