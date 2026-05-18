'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { authSetNewPassword } from '@/lib/auth';

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

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    const { error } = await authSetNewPassword(password);
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setStatus({ type: 'success' });
    }
  }

  const content =
    status.type === 'success' ? (
      <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 overflow-y-auto z-[60]">
        <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-elevated" style={{ padding: '2.25rem 1.75rem 2rem' }}>
          <div className="text-center">
            <h2 className="font-display text-22 font-bold mb-2.5">
              Password updated
            </h2>
            <p className="text-15 text-text-secondary leading-loose mb-6">
              Your new password is active.
            </p>
            <button onClick={() => router.push('/')} className="w-full text-15 font-semibold text-on-sage bg-sage rounded-md cursor-pointer" style={{ padding: '0.8125rem 1.25rem', border: 'none' }}>
              Continue to app
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 overflow-y-auto z-[60]">
        <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-elevated" style={{ padding: '2.25rem 1.75rem 2rem' }}>
          <div className="text-center mb-6">
            <h1 className="font-display text-30 font-bold text-text-primary mb-1.5">
              Set new password
            </h1>
            <p className="text-15 text-text-secondary">
              Choose a password for your account.
            </p>
          </div>

          {status.type === 'error' && <ErrorBanner message={status.message} />}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleReset();
            }}
            className="contents"
          >
            <div className="mb-3">
              <label className="block text-13 font-semibold text-text-primary mb-1.5">New password</label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full text-15 text-text-primary bg-surface rounded-md outline-none"
                style={{ padding: '0.75rem 0.875rem', border: '0.09375rem solid var(--border)' }}
              />
            </div>

            <div className="mb-5">
              <label className="block text-13 font-semibold text-text-primary mb-1.5">Confirm password</label>
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full text-15 text-text-primary bg-surface rounded-md outline-none"
                style={{ padding: '0.75rem 0.875rem', border: '0.09375rem solid var(--border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-15 font-semibold text-on-sage bg-sage rounded-md"
              style={{
                padding: '0.8125rem 1.25rem',
                border: 'none',
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


function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-light border border-red-border rounded-sm text-13 text-red mb-4" style={{ padding: '0.625rem 0.875rem' }}>
      {message}
    </div>
  );
}
