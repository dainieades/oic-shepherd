'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success' };

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<Status>({ type: 'idle' });

  const handleSave = async () => {
    if (!newPassword) {
      setStatus({ type: 'error', message: 'Please enter a new password.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setStatus({ type: 'loading' });
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success' });
    }
  };

  const canSave = status.type !== 'loading';

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Nav bar */}
      <div style={navBarStyle}>
        <button
          onClick={() => router.back()}
          disabled={status.type === 'loading'}
          style={{ ...backBtnStyle, opacity: status.type === 'loading' ? 0.5 : 1 }}
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Change Password</span>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            height: 32,
            padding: '0 14px',
            borderRadius: 'var(--radius-xs)',
            background: status.type === 'loading' ? 'var(--border)' : 'var(--sage)',
            color: status.type === 'loading' ? 'var(--text-muted)' : 'var(--on-sage)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
          }}
        >
          {status.type === 'loading' ? 'Saving…' : 'Save'}
        </button>
      </div>

      {status.type === 'success' ? (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}
          >
            Password updated
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>
            Your new password is active.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              height: 44,
              padding: '0 24px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          {status.type === 'error' && (
            <div
              style={{
                background: 'var(--red-light)',
                border: '1px solid var(--red-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 13px',
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
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={status.type === 'loading'}
                autoFocus
                style={inputStyle}
              />
            </div>
            <div style={{ padding: '14px 16px' }}>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={status.type === 'loading'}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
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
  padding: '11px 13px',
  borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--border)',
  fontSize: 15,
  color: 'var(--text-primary)',
  background: 'var(--bg)',
  outline: 'none',
  boxSizing: 'border-box',
};
