'use client';

import { useState } from 'react';
import { Envelope, Key, CaretDown, CaretUp } from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'magic-sent'; email: string }
  | { type: 'error'; message: string };

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  async function handleMagicLink() {
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'magic-sent', email: email.trim() });
    }
  }

  async function handlePassword() {
    if (!email.trim() || !password) {
      setStatus({ type: 'error', message: 'Please enter your email and password.' });
      return;
    }
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) setStatus({ type: 'error', message: error.message });
    // On success the middleware redirects to /
  }

  const isLoading = status.type === 'loading';

  // ── Magic link sent confirmation ────────────────────────────────────────
  if (status.type === 'magic-sent') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: '24px 16px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 390,
            background: 'var(--surface)',
            borderRadius: 20,
            border: '1px solid var(--border)',
            padding: '40px 28px 36px',
            boxShadow: 'var(--shadow-elevated)',
            textAlign: 'center',
          }}
        >
          <Envelope size={36} color="var(--sage)" style={{ marginBottom: 16 }} />
          <h2
            className="font-display"
            style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}
          >
            Check your inbox
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            We sent a sign-in link to <strong>{status.email}</strong>.
            <br />
            Click the link in that email to sign in.
          </p>
          <button
            onClick={() => setStatus({ type: 'idle' })}
            style={{
              marginTop: 24,
              background: 'none',
              border: 'none',
              color: 'var(--sage)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // ── Main sign-in card ───────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '24px 16px',
        zIndex: 10,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 390,
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: '36px 28px 32px',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1
            className="font-display"
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            Welcome
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Sign in to the OIC Shepherd app
          </p>
        </div>

        {/* Error banner */}
        {status.type === 'error' && (
          <div
            style={{
              background: 'var(--red-light)',
              border: '1px solid var(--red-border)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: 'var(--red)',
            }}
          >
            {status.message}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={isLoading}
          style={{
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
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
            <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
            <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
            <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
          </svg>
          Continue with Google
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 10,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Easiest option — sign in with your Google account in one tap
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or use email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        </div>

        {/* Email field */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--border)',
              fontSize: 15,
              color: 'var(--text-primary)',
              background: 'var(--surface)',
              outline: 'none',
            }}
          />
        </div>

        {/* Magic link button */}
        <button
          onClick={handleMagicLink}
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 20px',
            borderRadius: 12,
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            marginBottom: 10,
          }}
        >
          <Envelope size={18} weight="regular" />
          Email me a sign-in link
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          No password needed — we'll email you a secure link to sign in
        </p>

        {/* Password toggle */}
        <button
          onClick={() => setShowPassword((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            background: 'none',
            border: 'none',
            fontSize: 14,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: showPassword ? 14 : 0,
          }}
        >
          <Key size={16} weight="regular" />
          Sign in with password
          {showPassword ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>

        {/* Password field (collapsed by default) */}
        {showPassword && (
          <div style={{ marginBottom: 4 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handlePassword()}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                fontSize: 15,
                color: 'var(--text-primary)',
                background: 'var(--surface)',
                outline: 'none',
                marginBottom: 12,
              }}
            />
            <button
              onClick={handlePassword}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--sage)',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Sign in
            </button>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            marginTop: 24,
            paddingTop: 20,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Access is by invitation only.
            <br />Contact your pastor to request access.
          </p>
        </div>
      </div>
    </div>
  );
}
