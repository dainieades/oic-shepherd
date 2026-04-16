'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Step =
  | { type: 'email' }
  | { type: 'create-password'; email: string }
  | { type: 'sign-in'; email: string }
  | { type: 'signup-confirm'; email: string };

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string };

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<Step>({ type: 'email' });
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const router = useRouter();
  const supabase = createClient();

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback';

  const isLoading = status.type === 'loading';

  async function handleGoogle() {
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setStatus({ type: 'error', message: error.message });
  }

  async function handleContinue() {
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    setStatus({ type: 'loading' });

    let result: { status?: string; error?: string };
    try {
      const res = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      result = await res.json();
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
      return;
    }

    if (result.status === 'google') {
      setStatus({ type: 'error', message: 'Log in with your Google account.' });
    } else if (result.status === 'not-invited') {
      setStatus({
        type: 'error',
        message: 'Access is by invitation only. Contact your pastor to request access.',
      });
    } else if (result.status === 'invited') {
      setStatus({ type: 'idle' });
      setStep({ type: 'create-password', email: email.trim() });
    } else if (result.status === 'existing') {
      setStatus({ type: 'idle' });
      setStep({ type: 'sign-in', email: email.trim() });
    } else {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    }
  }

  async function handleCreatePassword() {
    if (step.type !== 'create-password') return;
    if (!password) {
      setStatus({ type: 'error', message: 'Please enter a password.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signUp({
      email: step.email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'idle' });
      setStep({ type: 'signup-confirm', email: step.email });
    }
  }

  async function handleSignIn() {
    if (step.type !== 'sign-in') return;
    if (!password) {
      setStatus({ type: 'error', message: 'Please enter your password.' });
      return;
    }
    setStatus({ type: 'loading' });
    const { error } = await supabase.auth.signInWithPassword({
      email: step.email,
      password,
    });
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      router.push('/');
    }
  }

  function resetToEmail() {
    setStep({ type: 'email' });
    setPassword('');
    setConfirmPassword('');
    setStatus({ type: 'idle' });
  }

  // ── Email confirmation screen ───────────────────────────────────────────
  if (step.type === 'signup-confirm') {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              We sent a confirmation link to <strong>{step.email}</strong>.
              <br />
              Click the link to finish creating your account.
            </p>
            <button onClick={resetToEmail} style={ghostButtonStyle}>
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create password screen ──────────────────────────────────────────────
  if (step.type === 'create-password') {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 className="font-display" style={headingStyle}>Create your password</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{step.email}</p>
          </div>

          {status.type === 'error' && <ErrorBanner message={status.message} />}

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePassword()}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleCreatePassword}
            disabled={isLoading}
            style={{ ...primaryButtonStyle, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', marginBottom: 12 }}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>

          <button onClick={resetToEmail} style={ghostButtonStyle}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Sign in with password screen ────────────────────────────────────────
  if (step.type === 'sign-in') {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 className="font-display" style={headingStyle}>Welcome back</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{step.email}</p>
          </div>

          {status.type === 'error' && <ErrorBanner message={status.message} />}

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            style={{ ...primaryButtonStyle, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', marginBottom: 12 }}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>

          <button onClick={resetToEmail} style={ghostButtonStyle}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Main email entry screen ─────────────────────────────────────────────
  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 className="font-display" style={headingStyle}>Welcome</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Sign in to the OIC Shepherd app
          </p>
        </div>

        {/* Error banner */}
        {status.type === 'error' && <ErrorBanner message={status.message} />}

        {/* Google button */}
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--sage)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.03em',
              padding: '2px 8px',
              borderRadius: 20,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            Recommended
          </span>
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
            border: '1.5px solid var(--sage)',
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
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        </div>

        {/* Email field */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            style={inputStyle}
          />
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={isLoading || !isValidEmail(email)}
          style={{
            ...primaryButtonStyle,
            opacity: isLoading || !isValidEmail(email) ? 0.4 : 1,
            cursor: isLoading || !isValidEmail(email) ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Checking…' : 'Continue'}
        </button>

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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ── Shared styles ─────────────────────────────────────────────────────────────

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

const headingStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 6,
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

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 20px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--sage)',
  fontSize: 15,
  fontWeight: 600,
  color: '#fff',
};

const ghostButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--sage)',
  fontSize: 14,
  cursor: 'pointer',
  textAlign: 'center',
  padding: '4px 0',
};

function ErrorBanner({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  );
}
