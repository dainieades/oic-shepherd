'use client';

import { useApp } from '@/lib/context';
import { Lock } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AccessGate() {
  const { accessDenied } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/welcome') return null;
  if (!accessDenied) return null;

  async function handleBack() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('shepherd-app-persona');
    router.push('/signin');
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-toast)',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '22.5rem',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '2.5rem 1.75rem 2rem',
          boxShadow: 'var(--shadow-elevated)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <Lock size={28} color="var(--text-muted)" weight="bold" />
        </div>
        <h2
          className="font-display"
          style={{ fontSize: 'var(--text-22)', fontWeight: 'var(--font-bold)', marginBottom: 10, color: 'var(--text-primary)' }}
        >
          Access Restricted
        </h2>
        <p
          style={{
            fontSize: 'var(--text-15)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-loose)',
            marginBottom: 28,
          }}
        >
          This app is for OIC church members only. Contact your pastor to request access.
        </p>
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            padding: '0.8125rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--sage)',
            color: 'var(--on-sage)',
            fontSize: 'var(--text-15)',
            fontWeight: 'var(--font-semibold)',
            cursor: 'pointer',
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
