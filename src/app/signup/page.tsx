'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus } from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; email: string }
  | { type: 'error'; message: string };

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  const supabase = createClient();

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback';

  async function handleGoogle() {
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setStatus({ type: 'error', message: error.message });
  }

  async function handleCreate() {
    if (!email.trim() || !password) {
      setStatus({ type: 'error', message: 'Please enter your email and a password.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', email: email.trim() });
    }
  }

  const isLoading = status.type === 'loading';

  // ── Success state ──────────────────────────────────────────────────────────
  if (status.type === 'success') {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <UserPlus size={24} color="var(--sage)" weight="bold" />
            </div>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Check your inbox</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We sent a confirmation link to <strong>{status.email}</strong>.
              <br />Click it to activate your account.
            </p>
            <Link href="/signin" style={{ display: 'inline-block', marginTop: 24, fontSize: 14, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main create account card ───────────────────────────────────────────────
  return (
    <div style={outerStyle}>
      <div style={cardStyle}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Join the OIC Shepherd community
          </p>
        </div>

        {/* Error banner */}
        {status.type === 'error' && (
          <div style={{ background: 'var(--red-light)', border: '1px solid var(--red-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
            {status.message}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={isLoading}
          style={{ ...btnOutlineStyle, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 10, marginBottom: 20, lineHeight: 1.5 }}>
          Fastest way — one tap and you're in
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or sign up with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Choose a password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={inputStyle}
          />
        </div>

        {/* Create account button */}
        <button
          onClick={handleCreate}
          disabled={isLoading}
          style={{ ...btnOutlineStyle, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          <UserPlus size={18} weight="regular" />
          Create account
        </button>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const outerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  padding: '24px 16px',
  zIndex: 10,
  overflowY: 'auto',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 390,
  background: 'var(--surface)',
  borderRadius: 20,
  border: '1px solid var(--border)',
  padding: '36px 28px 32px',
  boxShadow: 'var(--shadow-elevated)',
};

const btnOutlineStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '13px 20px',
  borderRadius: 12,
  border: '1.5px solid var(--border)',
  background: 'var(--surface)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid var(--border)',
  fontSize: 15,
  color: 'var(--text-primary)',
  background: 'var(--surface)',
  outline: 'none',
};
