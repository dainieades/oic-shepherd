'use client';

import { useApp } from '@/lib/context';
import { Lock } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AccessGate() {
  const { accessDenied } = useApp();
  const router = useRouter();

  if (!accessDenied) return null;

  async function handleBack() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '40px 28px 32px',
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
            margin: '0 auto 20px',
          }}
        >
          <Lock size={28} color="var(--text-muted)" weight="bold" />
        </div>
        <h2
          className="font-display"
          style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}
        >
          Access Restricted
        </h2>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          This app is for OIC church members only. Contact your pastor to request access.
        </p>
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--sage)',
            color: 'var(--on-sage)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
