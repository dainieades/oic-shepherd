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
      <div className="bg-bg fixed inset-0 z-10 flex items-center justify-center overflow-y-auto px-4 py-6">
        <div className="bg-surface border-border w-full max-w-[390px] rounded-xl border px-7 pt-9 pb-8 shadow-[var(--shadow-elevated)]">
          <div className="text-center">
            <h2 className="font-display text-22 mb-2.5 font-bold">Check your inbox</h2>
            <p className="text-15 text-text-secondary mb-5 leading-loose">
              We sent a confirmation link to <strong>{step.email}</strong>.
              <br />
              Click the link to finish creating your account.
            </p>

            {resendStatus.type === 'error' && <ErrorBanner message={resendStatus.message} />}
            {wasResent && (
              <p className="text-13 text-sage mb-4 font-medium">
                Confirmation email resent. Check your inbox.
              </p>
            )}

            <button
              onClick={handleResendConfirmation}
              disabled={isResending || wasResent}
              className="text-sage text-14 mb-1 block w-full cursor-pointer border-none bg-transparent py-1 text-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending ? 'Sending…' : wasResent ? 'Sent' : "Didn't get it? Resend email"}
            </button>
            <button
              onClick={resetToEmail}
              className="text-sage text-14 block w-full cursor-pointer border-none bg-transparent py-1 text-center"
            >
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
      <div className="bg-bg fixed inset-0 z-10 flex items-center justify-center overflow-y-auto px-4 py-6">
        <div className="bg-surface border-border w-full max-w-[390px] rounded-xl border px-7 pt-9 pb-8 shadow-[var(--shadow-elevated)]">
          <div className="mb-6 text-center">
            <h1 className="font-display text-30 text-text-primary mb-1.5 font-bold">
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
              <label className="text-13 text-text-primary mb-1.5 block font-semibold">
                Password
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
                className="border-border text-15 text-text-primary bg-surface w-full rounded-md border px-3.5 py-3 outline-none"
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
                className="border-border text-15 text-text-primary bg-surface w-full rounded-md border px-3.5 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-sage text-15 text-on-sage mb-3 w-full cursor-pointer rounded-md border-none px-5 py-[0.8125rem] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <button
            onClick={resetToEmail}
            className="text-sage text-14 block w-full cursor-pointer border-none bg-transparent py-1 text-center"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Sign in with password screen ────────────────────────────────────────
  if (step.type === 'sign-in') {
    return (
      <div className="bg-bg fixed inset-0 z-10 flex items-center justify-center overflow-y-auto px-4 py-6">
        <div className="bg-surface border-border w-full max-w-[390px] rounded-xl border px-7 pt-9 pb-8 shadow-[var(--shadow-elevated)]">
          <div className="mb-6 text-center">
            <h1 className="font-display text-30 text-text-primary mb-1.5 font-bold">
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
              <label className="text-13 text-text-primary mb-1.5 block font-semibold">
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="border-border text-15 text-text-primary bg-surface w-full rounded-md border px-3.5 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-sage text-15 text-on-sage mb-3 w-full cursor-pointer rounded-md border-none px-5 py-[0.8125rem] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="text-sage text-14 mb-1 block w-full cursor-pointer border-none bg-transparent py-1 text-center"
          >
            Forgot password?
          </button>

          <button
            onClick={resetToEmail}
            className="text-sage text-14 block w-full cursor-pointer border-none bg-transparent py-1 text-center"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Reset password sent screen ─────────────────────────────────────────
  if (step.type === 'reset-sent') {
    return (
      <div className="bg-bg fixed inset-0 z-10 flex items-center justify-center overflow-y-auto px-4 py-6">
        <div className="bg-surface border-border w-full max-w-[390px] rounded-xl border px-7 pt-9 pb-8 shadow-[var(--shadow-elevated)]">
          <div className="text-center">
            <h2 className="font-display text-22 mb-2.5 font-bold">Check your inbox</h2>
            <p className="text-15 text-text-secondary mb-6 leading-loose">
              We sent a password reset link to <strong>{step.email}</strong>.
              <br />
              Click the link in the email to set a new password.
            </p>
            <button
              onClick={resetToEmail}
              className="text-sage text-14 block w-full cursor-pointer border-none bg-transparent py-1 text-center"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main email entry screen ─────────────────────────────────────────────
  return (
    <div className="bg-bg fixed inset-0 z-10 flex items-center justify-center overflow-y-auto px-4 py-6">
      <div className="bg-surface border-border w-full max-w-[390px] rounded-xl border px-7 pt-9 pb-8 shadow-[var(--shadow-elevated)]">
        {/* Header */}
        <div className="mb-7 text-center">
          <Logo height={88} style={{ margin: '0 auto var(--spacing-lg)' }} />
          <h1 className="font-display text-24 text-text-primary mb-1.5 font-bold">
            Welcome to Shepherd App.
          </h1>
        </div>

        {/* Error banner */}
        {status.type === 'error' && <ErrorBanner message={status.message} />}

        {/* Google button */}
        <div className="relative inline-block w-full">
          <span className="bg-sage text-on-sage text-11 tracking-wide-3 pointer-events-none absolute -top-2.5 left-1/2 z-[1] -translate-x-1/2 rounded-xl px-2 py-0.5 font-bold">
            Recommended
          </span>
          <button
            onClick={handleGoogle}
            disabled={isLoading}
            className="bg-surface text-15 text-text-primary border-sage flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border px-5 py-[0.8125rem] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="my-5 flex items-center gap-3">
          <div className="bg-border-light h-px flex-1" />
          <span className="text-13 text-text-muted">or</span>
          <div className="bg-border-light h-px flex-1" />
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
            <label className="text-13 text-text-primary mb-1.5 block font-semibold">
              Email address
            </label>
            <input
              type="email"
              name="username"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="border-border text-15 text-text-primary bg-surface w-full rounded-md border px-3.5 py-3 outline-none"
            />
          </div>

          {/* Continue button */}
          <button
            type="submit"
            disabled={isLoading || !isValidEmail(email)}
            className="bg-sage text-15 text-on-sage w-full cursor-pointer rounded-md border-none px-5 py-[0.8125rem] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? 'Checking…' : 'Continue'}
          </button>
        </form>

        {/* Footer */}
        <div className="border-border-light mt-6 border-t pt-5 text-center">
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
    <div className="bg-red-light border-red-border text-13 text-red mb-4 rounded-sm border px-3.5 py-2.5">
      {message}
    </div>
  );
}
