'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success' };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<Status>({ type: 'idle' });
  const [mounted, setMounted] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => { setMounted(true); }, []);

  const isLoading = status.type === 'loading';

  async function handleReset() {
    if (!password) {
      setStatus({ type: 'error', message: 'Please enter a new password.' });
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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success' });
    }
  }

  const content = status.type === 'success' ? (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <h2
            className="font-display"
            style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}
          >
            Password updated
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Your new password is active.
          </p>
          <button
            onClick={() => router.push('/')}
            style={primaryButtonStyle}
          >
            Continue to app
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 className="font-display" style={headingStyle}>
            Set new password
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Choose a password for your account.
          </p>
        </div>

        {status.type === 'error' && <ErrorBanner message={status.message} />}

        <form
          onSubmit={(e) => { e.preventDefault(); handleReset(); }}
          style={{ display: 'contents' }}
        >
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
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
              name="confirm-password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...primaryButtonStyle,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Saving…' : 'Set password'}
          </button>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;
  return ReactDOM.createPortal(content, document.body);
}

const outerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  padding: '1.5rem 1rem',
  zIndex: 60,
  overflowY: 'auto',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 390,
  background: 'var(--surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border)',
  padding: '2.25rem 1.75rem 2rem',
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
  padding: '0.75rem 0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '0.09375rem solid var(--border)',
  fontSize: 15,
  color: 'var(--text-primary)',
  background: 'var(--surface)',
  outline: 'none',
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8125rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--sage)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--on-sage)',
  cursor: 'pointer',
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'var(--red-light)',
        border: '1px solid var(--red-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.625rem 0.875rem',
        marginBottom: 16,
        fontSize: 13,
        color: 'var(--red)',
      }}
    >
      {message}
    </div>
  );
}
