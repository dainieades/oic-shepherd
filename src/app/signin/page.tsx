'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  authSignInWithGoogle,
  authSignUp,
  authSignInWithPassword,
  authResendConfirmation,
  authResetPasswordForEmail,
} from '@/lib/auth';
import { Logo } from '@/components/Logo';

type Step =
  | { type: 'email' }
  | { type: 'create-password'; email: string }
  | { type: 'sign-in'; email: string }
  | { type: 'signup-confirm'; email: string }
  | { type: 'reset-sent'; email: string };

type Status = { type: 'idle' } | { type: 'loading' } | { type: 'error'; message: string };

type ResendStatus =
  | { type: 'idle' }
  | { type: 'sending' }
  | { type: 'sent' }
  | { type: 'error'; message: string };

function isEmailNotConfirmedError(error: { message?: string; code?: string }): boolean {
  return (
    error.code === 'email_not_confirmed' ||
    (error.message ?? '').toLowerCase().includes('email not confirmed')
  );
}

export default function SignInPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [step, setStep] = React.useState<Step>({ type: 'email' });
  const [status, setStatus] = React.useState<Status>({ type: 'idle' });
  const [resendStatus, setResendStatus] = React.useState<ResendStatus>({ type: 'idle' });
  const router = useRouter();

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback';

  const isLoading = status.type === 'loading';

  async function handleGoogle() {
    setStatus({ type: 'loading' });
    const { error } = await authSignInWithGoogle(redirectTo);
    if (error) setStatus({ type: 'error', message: error });
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
      if (!res.ok && res.headers.get('content-type')?.includes('text/html')) {
        // Server returned an HTML error page (e.g. unhandled 500) — not JSON
        console.error('check-email returned non-JSON response', res.status);
        setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
        return;
      }
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
    } else if (result.status === 'no-service-key') {
      // SUPABASE_SERVICE_ROLE_KEY not set in .env.local — fall back to password form
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
    const { error } = await authSignUp(step.email, password, redirectTo);
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setStatus({ type: 'idle' });
      setResendStatus({ type: 'idle' });
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
    const { error, code } = await authSignInWithPassword(step.email, password);
    if (error) {
      if (isEmailNotConfirmedError({ message: error, code: code ?? undefined })) {
        setStatus({ type: 'idle' });
        setResendStatus({ type: 'idle' });
        setStep({ type: 'signup-confirm', email: step.email });
        return;
      }
      setStatus({ type: 'error', message: error });
    } else {
      router.push('/');
    }
  }

  async function handleResendConfirmation() {
    if (step.type !== 'signup-confirm') return;
    setResendStatus({ type: 'sending' });
    const { error } = await authResendConfirmation(step.email, redirectTo);
    if (error) {
      setResendStatus({ type: 'error', message: error });
    } else {
      setResendStatus({ type: 'sent' });
    }
  }

  async function handleForgotPassword() {
    if (step.type !== 'sign-in') return;
    setStatus({ type: 'loading' });
    const resetRedirectTo = `${redirectTo.replace('/auth/callback', '')}/auth/callback?next=/reset-password`;
    const { error } = await authResetPasswordForEmail(step.email, resetRedirectTo);
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setStatus({ type: 'idle' });
      setStep({ type: 'reset-sent', email: step.email });
    }
  }

  function resetToEmail() {
    setStep({ type: 'email' });
    setPassword('');
    setConfirmPassword('');
    setStatus({ type: 'idle' });
    setResendStatus({ type: 'idle' });
  }

  // ── Email confirmation screen ───────────────────────────────────────────
  if (step.type === 'signup-confirm') {
    const isResending = resendStatus.type === 'sending';
    const wasResent = resendStatus.type === 'sent';
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 z-10 overflow-y-auto">
        <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-[var(--shadow-elevated)] pt-9 px-7 pb-8">
          <div className="text-center">
            <h2
              className="font-display text-22 font-bold mb-2.5"
            >
              Check your inbox
            </h2>
            <p
              className="text-15 text-text-secondary leading-loose mb-5"
            >
              We sent a confirmation link to <strong>{step.email}</strong>.
              <br />
              Click the link to finish creating your account.
            </p>

            {resendStatus.type === 'error' && <ErrorBanner message={resendStatus.message} />}
            {wasResent && (
              <p
                className="text-13 text-sage font-medium mb-4"
              >
                Confirmation email resent. Check your inbox.
              </p>
            )}

            <button
              onClick={handleResendConfirmation}
              disabled={isResending || wasResent}
              className="block w-full bg-transparent border-none text-sage text-14 text-center mb-1 py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? 'Sending…'
                : wasResent
                  ? 'Sent'
                  : "Didn't get it? Resend email"}
            </button>
            <button onClick={resetToEmail} className="block w-full bg-transparent border-none text-sage text-14 cursor-pointer text-center py-1">
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
      <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 z-10 overflow-y-auto">
        <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-[var(--shadow-elevated)] pt-9 px-7 pb-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-30 font-bold text-text-primary mb-1.5">
              Create your password
            </h1>
            <p className="text-15 text-text-secondary">{step.email}</p>
          </div>

          {status.type === 'error' && <ErrorBanner message={status.message} />}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreatePassword();
            }}
            className="contents"
          >
            {/* Hidden email so password managers link the new password to this account */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={step.email}
              readOnly
              className="hidden"
            />

            <div className="mb-3">
              <label className="block text-13 font-semibold text-text-primary mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full rounded-md border border-border text-15 text-text-primary bg-surface outline-none py-3 px-3.5"
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
                className="w-full rounded-md border border-border text-15 text-text-primary bg-surface outline-none py-3 px-3.5"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md border-none bg-sage text-15 font-semibold text-on-sage mb-3 py-[0.8125rem] px-5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <button onClick={resetToEmail} className="block w-full bg-transparent border-none text-sage text-14 cursor-pointer text-center py-1">
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Sign in with password screen ────────────────────────────────────────
  if (step.type === 'sign-in') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 z-10 overflow-y-auto">
        <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-[var(--shadow-elevated)] pt-9 px-7 pb-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-30 font-bold text-text-primary mb-1.5">
              Welcome back
            </h1>
            <p className="text-15 text-text-secondary">{step.email}</p>
          </div>

          {status.type === 'error' && <ErrorBanner message={status.message} />}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignIn();
            }}
            className="contents"
          >
            {/* Hidden email so password managers know which account's password to fill */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={step.email}
              readOnly
              className="hidden"
            />

            <div className="mb-5">
              <label className="block text-13 font-semibold text-text-primary mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full rounded-md border border-border text-15 text-text-primary bg-surface outline-none py-3 px-3.5"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md border-none bg-sage text-15 font-semibold text-on-sage mb-3 py-[0.8125rem] px-5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="block w-full bg-transparent border-none text-sage text-14 cursor-pointer text-center py-1 mb-1"
          >
            Forgot password?
          </button>

          <button onClick={resetToEmail} className="block w-full bg-transparent border-none text-sage text-14 cursor-pointer text-center py-1">
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Reset password sent screen ─────────────────────────────────────────
  if (step.type === 'reset-sent') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 z-10 overflow-y-auto">
        <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-[var(--shadow-elevated)] pt-9 px-7 pb-8">
          <div className="text-center">
            <h2
              className="font-display text-22 font-bold mb-2.5"
            >
              Check your inbox
            </h2>
            <p
              className="text-15 text-text-secondary leading-loose mb-6"
            >
              We sent a password reset link to <strong>{step.email}</strong>.
              <br />
              Click the link in the email to set a new password.
            </p>
            <button onClick={resetToEmail} className="block w-full bg-transparent border-none text-sage text-14 cursor-pointer text-center py-1">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main email entry screen ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg py-6 px-4 z-10 overflow-y-auto">
      <div className="w-full max-w-[390px] bg-surface rounded-xl border border-border shadow-[var(--shadow-elevated)] pt-9 px-7 pb-8">
        {/* Header */}
        <div className="text-center mb-7">
          <Logo height={88} style={{ margin: '0 auto var(--spacing-lg)' }} />
          <h1 className="font-display text-24 font-bold text-text-primary mb-1.5">
            Welcome to Shepherd App.
          </h1>
        </div>

        {/* Error banner */}
        {status.type === 'error' && <ErrorBanner message={status.message} />}

        {/* Google button */}
        <div className="relative inline-block w-full">
          <span
            className="absolute bg-sage text-on-sage text-11 font-bold tracking-wide-3 rounded-xl pointer-events-none z-[1] -top-2.5 left-1/2 -translate-x-1/2 py-0.5 px-2"
          >
            Recommended
          </span>
          <button
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-md bg-surface text-15 font-semibold text-text-primary py-[0.8125rem] px-5 border border-sage cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                fill="#FFC107"
              />
              <path
                d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                fill="#FF3D00"
              />
              <path
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                fill="#4CAF50"
              />
              <path
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                fill="#1976D2"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 bg-border-light h-px" />
          <span className="text-13 text-text-muted">or</span>
          <div className="flex-1 bg-border-light h-px" />
        </div>

        {/* Email field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleContinue();
          }}
          className="contents"
        >
          <div className="mb-3">
            <label className="block text-13 font-semibold text-text-primary mb-1.5">Email address</label>
            <input
              type="email"
              name="username"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-md border border-border text-15 text-text-primary bg-surface outline-none py-3 px-3.5"
            />
          </div>

          {/* Continue button */}
          <button
            type="submit"
            disabled={isLoading || !isValidEmail(email)}
            className="w-full rounded-md border-none bg-sage text-15 font-semibold text-on-sage py-[0.8125rem] px-5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Checking…' : 'Continue'}
          </button>
        </form>

        {/* Footer */}
        <div
          className="border-t border-border-light text-center mt-6 pt-5"
        >
          <p className="text-13 text-text-muted leading-normal">
            Access is by invitation only.
            <br />
            Contact your pastor to request access.
          </p>
        </div>
      </div>
    </div>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="bg-red-light border border-red-border rounded-sm text-13 text-red mb-4 py-2.5 px-3.5"
    >
      {message}
    </div>
  );
}
