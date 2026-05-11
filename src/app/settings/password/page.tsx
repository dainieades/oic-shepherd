'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Check } from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string };

type Step =
  | { type: 'form' }
  | { type: 'reset-sent'; email: string }
  | { type: 'success' };

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [step, setStep] = React.useState<Step>({ type: 'form' });
  const [status, setStatus] = React.useState<Status>({ type: 'idle' });
  const [currentPasswordError, setCurrentPasswordError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const isLoading = status.type === 'loading';

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const newPasswordValid = hasMinLength && hasUppercase && hasNumber;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const handleSave = async () => {
    if (!user?.email) {
      setStatus({ type: 'error', message: 'No account email on file. Sign out and back in.' });
      return;
    }
    if (!currentPassword) {
      setCurrentPasswordError('Please enter your current password.');
      return;
    }
    // newPasswordValid, confirmMismatch, and empty-confirm states are all
    // surfaced inline — silently bail so we don't double up with a banner.
    if (!newPasswordValid || !confirmPassword || confirmMismatch) {
      return;
    }
    if (newPassword === currentPassword) {
      setStatus({
        type: 'error',
        message: 'New password must be different from your current password.',
      });
      return;
    }

    setStatus({ type: 'loading' });
    const supabase = createClient();

    // Supabase verifies current_password server-side when
    // "Require current password when updating" is enabled.
    const { error } = await supabase.auth.updateUser({
      current_password: currentPassword,
      password: newPassword,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      const wrongCurrent =
        msg.includes('current password') ||
        msg.includes('incorrect password') ||
        msg.includes('invalid credentials') ||
        msg.includes('invalid login');
      if (wrongCurrent) {
        setStatus({ type: 'idle' });
        setCurrentPasswordError('Current password is incorrect.');
        return;
      }
      setStatus({ type: 'error', message: error.message });
      return;
    }

    setStatus({ type: 'idle' });
    setStep({ type: 'success' });
  };

  const handleForgot = async () => {
    if (!user?.email) {
      setStatus({ type: 'error', message: 'No account email on file. Sign out and back in.' });
      return;
    }
    setStatus({ type: 'loading' });
    const supabase = createClient();
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : '/auth/callback?next=/reset-password';
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }
    setStatus({ type: 'idle' });
    setStep({ type: 'reset-sent', email: user.email });
  };

  const canGoBack = !isLoading;

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={navBarStyle}>
        <button
          onClick={() => router.push('/settings')}
          disabled={!canGoBack}
          style={{ ...backBtnStyle, opacity: canGoBack ? 1 : 0.5 }}
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Change Password</span>
        <span style={{ width: 64 }} />
      </div>

      {step.type === 'success' && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Password updated
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 1.5rem' }}>
            Your new password is active.
          </p>
          <button
            onClick={() => router.push('/settings')}
            style={primaryButtonStyle}
          >
            Done
          </button>
        </div>
      )}

      {step.type === 'reset-sent' && (
        <div style={{ marginTop: 40, textAlign: 'center', padding: '0 0.5rem' }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Check your inbox
          </p>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              margin: '0 0 1.5rem',
              lineHeight: 1.5,
            }}
          >
            We sent a password reset link to <strong>{step.email}</strong>.
            <br />
            Click the link in the email to set a new password.
          </p>
          <button
            onClick={() => router.push('/settings')}
            style={primaryButtonStyle}
          >
            Back to settings
          </button>
        </div>
      )}

      {step.type === 'form' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{ marginTop: 24 }}
        >
          {/* Hidden username field so password managers attach the new password to this account */}
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={user?.email ?? ''}
            readOnly
            style={{ display: 'none' }}
          />

          {status.type === 'error' && (
            <div
              style={{
                background: 'var(--red-light)',
                border: '1px solid var(--red-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5625rem 0.8125rem',
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--red)',
              }}
            >
              {status.message}
            </div>
          )}

          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
              <label style={labelStyle}>Current password</label>
              <input
                type="password"
                name="current-password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (currentPasswordError) setCurrentPasswordError(null);
                }}
                disabled={isLoading}
                autoFocus
                style={{
                  ...inputStyle,
                  borderColor: currentPasswordError ? 'var(--red)' : 'var(--border)',
                }}
              />
              {currentPasswordError && (
                <p style={helperErrorStyle}>{currentPasswordError}</p>
              )}
            </div>
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                style={inputStyle}
              />
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { met: hasMinLength, label: '8+ characters' },
                  { met: hasUppercase, label: '1 uppercase' },
                  { met: hasNumber, label: '1 number' },
                ].map((rule) => (
                  <span
                    key={rule.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: rule.met ? 'var(--sage)' : 'var(--text-muted)',
                      fontWeight: rule.met ? 600 : 400,
                      transition: 'color 0.15s',
                    }}
                  >
                    <Check
                      size={12}
                      weight="bold"
                      style={{ opacity: rule.met ? 1 : 0.3 }}
                    />
                    {rule.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ padding: '0.875rem 1rem' }}>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                name="confirm-new-password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  ...inputStyle,
                  borderColor: confirmMismatch ? 'var(--red)' : 'var(--border)',
                }}
              />
              {confirmMismatch && (
                <p style={helperErrorStyle}>Passwords don&apos;t match</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...primaryButtonStyle,
              width: '100%',
              marginTop: 20,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Updating…' : 'Update password'}
          </button>

          <button
            type="button"
            onClick={handleForgot}
            disabled={isLoading || !user?.email}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 8,
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              color: 'var(--sage)',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'center',
              cursor: isLoading || !user?.email ? 'not-allowed' : 'pointer',
              opacity: isLoading || !user?.email ? 0.5 : 1,
            }}
          >
            I forgot my current password
          </button>
        </form>
      )}
    </div>
  );
}

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 'var(--z-page)',
  background: 'var(--bg)',
  marginLeft: -16,
  marginRight: -16,
  paddingLeft: 16,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 54,
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6875rem 0.8125rem',
  borderRadius: 'var(--radius-sm)',
  border: '0.09375rem solid var(--border)',
  fontSize: 15,
  color: 'var(--text-primary)',
  background: 'var(--bg)',
  outline: 'none',
  boxSizing: 'border-box',
};

const helperErrorStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: 'var(--red)',
  lineHeight: 1.4,
};

const primaryButtonStyle: React.CSSProperties = {
  height: 44,
  padding: '0 1.5rem',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--sage)',
  color: 'var(--on-sage)',
  border: 'none',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};
