'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Check } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { authUpdatePassword, authResetPasswordForEmail } from '@/lib/auth';

type Status = { type: 'idle' } | { type: 'loading' } | { type: 'error'; message: string };

type Step = { type: 'form' } | { type: 'reset-sent'; email: string } | { type: 'success' };

export default function ChangePasswordPage() {
  const { supabaseUser: user } = useApp();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [step, setStep] = React.useState<Step>({ type: 'form' });
  const [status, setStatus] = React.useState<Status>({ type: 'idle' });
  const [currentPasswordError, setCurrentPasswordError] = React.useState<string | null>(null);

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
    const { error } = await authUpdatePassword(currentPassword, newPassword);

    if (error) {
      const msg = error.toLowerCase();
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
      setStatus({ type: 'error', message: error });
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
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : '/auth/callback?next=/reset-password';
    const { error } = await authResetPasswordForEmail(user.email, redirectTo);
    if (error) {
      setStatus({ type: 'error', message: error });
      return;
    }
    setStatus({ type: 'idle' });
    setStep({ type: 'reset-sent', email: user.email });
  };

  const canGoBack = !isLoading;

  return (
    <div className="pb-12">
      <div className="settings-subpage-navbar border-border-light bg-bg z-page sticky top-0 -mx-4 flex h-[54px] items-center justify-between border-b px-4">
        <button
          onClick={() => router.push('/settings')}
          disabled={!canGoBack}
          className="text-13 text-sage inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0"
          style={{ opacity: canGoBack ? 1 : 0.5 }}
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 text-text-primary font-semibold">Change Password</span>
        <span className="w-16" />
      </div>

      {step.type === 'success' && (
        <div className="mt-10 text-center">
          <p className="text-17 text-text-primary tracking-tight-1 mb-2 font-semibold">
            Password updated
          </p>
          <p className="text-14 text-text-muted mb-6">Your new password is active.</p>
          <button
            onClick={() => router.push('/settings')}
            className="bg-sage text-on-sage text-15 h-11 cursor-pointer rounded-sm border-none px-6 font-semibold"
          >
            Done
          </button>
        </div>
      )}

      {step.type === 'reset-sent' && (
        <div className="mt-10 px-2 text-center">
          <p className="text-17 text-text-primary tracking-tight-1 mb-2 font-semibold">
            Check your inbox
          </p>
          <p className="text-14 text-text-muted mb-6 leading-normal">
            We sent a password reset link to <strong>{step.email}</strong>.
            <br />
            Click the link in the email to set a new password.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="bg-sage text-on-sage text-15 h-11 cursor-pointer rounded-sm border-none px-6 font-semibold"
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
          className="mt-6"
        >
          {/* Hidden username field so password managers attach the new password to this account */}
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={user?.email ?? ''}
            readOnly
            className="hidden"
          />

          {status.type === 'error' && (
            <div
              className="bg-red-light border-red-border text-13 text-red mb-4 rounded-sm border"
              style={{ padding: '0.5625rem 0.8125rem' }}
            >
              {status.message}
            </div>
          )}

          <div className="bg-surface border-border-light overflow-hidden rounded border">
            <div className="border-border-light border-b px-4 py-3.5">
              <label className="text-12 text-text-muted tracking-wide-5 mb-1.5 block font-semibold uppercase">
                Current password
              </label>
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
                className="text-15 text-text-primary bg-bg box-border w-full rounded-sm outline-none"
                style={{
                  padding: '0.6875rem 0.8125rem',
                  border: `0.09375rem solid ${currentPasswordError ? 'var(--red)' : 'var(--border)'}`,
                }}
              />
              {currentPasswordError && (
                <p className="text-12 text-red leading-comfortable mt-1.5">
                  {currentPasswordError}
                </p>
              )}
            </div>
            <div className="border-border-light border-b px-4 py-3.5">
              <label className="text-12 text-text-muted tracking-wide-5 mb-1.5 block font-semibold uppercase">
                New password
              </label>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="border-border text-15 text-text-primary bg-bg box-border w-full rounded-sm border outline-none"
                style={{ padding: '0.6875rem 0.8125rem' }}
              />
              <div className="mt-2 flex flex-wrap gap-3">
                {[
                  { met: hasMinLength, label: '8+ characters' },
                  { met: hasUppercase, label: '1 uppercase' },
                  { met: hasNumber, label: '1 number' },
                ].map((rule) => (
                  <span
                    key={rule.label}
                    className="text-12 inline-flex items-center gap-1"
                    style={{
                      color: rule.met ? 'var(--sage)' : 'var(--text-muted)',
                      fontWeight: rule.met ? 'var(--font-semibold)' : 'var(--font-normal)',
                      transition: 'color 0.15s',
                    }}
                  >
                    <Check size={12} weight="bold" style={{ opacity: rule.met ? 1 : 0.3 }} />
                    {rule.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 py-3.5">
              <label className="text-12 text-text-muted tracking-wide-5 mb-1.5 block font-semibold uppercase">
                Confirm new password
              </label>
              <input
                type="password"
                name="confirm-new-password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="text-15 text-text-primary bg-bg box-border w-full rounded-sm outline-none"
                style={{
                  padding: '0.6875rem 0.8125rem',
                  border: `0.09375rem solid ${confirmMismatch ? 'var(--red)' : 'var(--border)'}`,
                }}
              />
              {confirmMismatch && (
                <p className="text-12 text-red leading-comfortable mt-1.5">
                  Passwords don&apos;t match
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-sage text-on-sage text-15 mt-5 h-11 w-full rounded-sm border-none px-6 font-semibold"
            style={{
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
            className="text-sage text-14 mt-2 block w-full border-none bg-transparent py-3 text-center font-medium"
            style={{
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
