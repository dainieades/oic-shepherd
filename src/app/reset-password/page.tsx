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
      <div className="bg-bg fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-4 py-6">
        <div
          className="bg-surface border-border shadow-elevated w-full max-w-[390px] rounded-xl border"
          style={{ padding: '2.25rem 1.75rem 2rem' }}
        >
          <div className="text-center">
            <h2 className="font-display text-22 mb-2.5 font-bold">Password updated</h2>
            <p className="text-15 text-text-secondary mb-6 leading-loose">
              Your new password is active.
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-15 text-on-sage bg-sage w-full cursor-pointer rounded-md font-semibold"
              style={{ padding: '0.8125rem 1.25rem', border: 'none' }}
            >
              Continue to app
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="bg-bg fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-4 py-6">
        <div
          className="bg-surface border-border shadow-elevated w-full max-w-[390px] rounded-xl border"
          style={{ padding: '2.25rem 1.75rem 2rem' }}
        >
          <div className="mb-6 text-center">
            <h1 className="font-display text-30 text-text-primary mb-1.5 font-bold">
              Set new password
            </h1>
            <p className="text-15 text-text-secondary">Choose a password for your account.</p>
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
              <label className="text-13 text-text-primary mb-1.5 block font-semibold">
                New password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="text-15 text-text-primary bg-surface w-full rounded-md outline-none"
                style={{ padding: '0.75rem 0.875rem', border: '0.09375rem solid var(--border)' }}
              />
            </div>

            <div className="mb-5">
              <label className="text-13 text-text-primary mb-1.5 block font-semibold">
                Confirm password
              </label>
              <input
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="text-15 text-text-primary bg-surface w-full rounded-md outline-none"
                style={{ padding: '0.75rem 0.875rem', border: '0.09375rem solid var(--border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="text-15 text-on-sage bg-sage w-full rounded-md font-semibold"
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
    <div
      className="bg-red-light border-red-border text-13 text-red mb-4 rounded-sm border"
      style={{ padding: '0.625rem 0.875rem' }}
    >
      {message}
    </div>
  );
}
