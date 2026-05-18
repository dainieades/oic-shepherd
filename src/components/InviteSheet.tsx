'use client';

import React from 'react';
import {
  PaperPlaneTilt,
  CheckCircle,
  HandHeart,
  ShieldStar,
  Check,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { X } from '@phosphor-icons/react';
import { SHEET_MAX_WIDTH } from '@/lib/constants';

type InviteRole = 'shepherd' | 'admin';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  initialEmail?: string;
  initialRole?: InviteRole;
  personName?: string;
  /** If provided, saves the chosen role back to the person record on success */
  personId?: string;
  /** If provided, shows a "Change" button next to the person name to go back to the picker */
  onChangePerson?: () => void;
}

const ROLES: { value: InviteRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'shepherd',
    label: 'User',
    description: 'View and log care for assigned people',
    icon: <HandHeart size={18} color="var(--sage)" />,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all records and settings',
    icon: <ShieldStar size={18} color="var(--sage)" />,
  },
];

export default function InviteSheet({
  onClose,
  onSuccess,
  initialEmail = '',
  initialRole = 'shepherd',
  personName,
  personId,
  onChangePerson,
}: Props) {
  const { data: appData, currentPersona, updatePerson } = useApp();
  const [email, setEmail] = React.useState(initialEmail);
  const [role, setRole] = React.useState<InviteRole>(initialRole);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const isAdmin = currentPersona.role === 'admin';

  // Non-admins can invite shepherds; only admins can invite admins.
  const availableRoles = isAdmin ? ROLES : ROLES.filter((r) => r.value === 'shepherd');

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg('Enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    let res: Response;
    let data: { ok?: boolean; existing?: boolean; error?: string };
    try {
      res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          label: personName ?? null,
          personId: personId ?? null,
        }),
      });
      data = await res.json();
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
      return;
    }

    if (!res.ok || !data.ok) {
      setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
      setStatus('error');
      return;
    }

    if (personId) {
      await updatePerson(personId, { appRole: role, email: trimmed });
    } else {
      const matched = appData.people.find((p) => p.email?.toLowerCase() === trimmed);
      if (matched) {
        await updatePerson(matched.id, { appRole: role });
      }
    }

    setStatus('success');
    onSuccess?.();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-5 z-sheet bg-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in bg-surface rounded-lg w-full"
        style={{ maxWidth: SHEET_MAX_WIDTH }}
      >
        <div className="flex items-center justify-between border-b border-border-light"
          style={{ padding: '0.875rem 1rem 0.75rem' }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-12 font-semibold text-text-muted uppercase tracking-wide-6 m-0"
              style={{ textAlign: personName ? 'left' : 'center' }}
            >
              Invite to App
            </p>
            {personName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-15 font-semibold text-text-primary m-0">{personName}</p>
                {onChangePerson && (
                  <button
                    onClick={onChangePerson}
                    className="bg-transparent border-none cursor-pointer p-0 text-13 text-sage font-medium"
                  >
                    Change
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none cursor-pointer p-1 text-text-muted flex items-center ml-2 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          /* ── Success state ── */
          <div className="text-center" style={{ padding: '2rem 1.5rem 1rem' }}>
            <CheckCircle
              size={48}
              color="var(--sage)"
              weight="fill"
              style={{ display: 'block', margin: '0 auto 1rem' }}
            />
            <p className="text-17 font-bold text-text-primary" style={{ marginBottom: 6 }}>
              Invite sent!
            </p>
            <p
              className="text-14 text-text-secondary leading-open"
              style={{ marginBottom: 24 }}
            >
              <strong>{email.trim()}</strong> has been approved. They'll receive an email with a
              link to sign in — no password needed.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md border-none bg-sage text-on-sage text-15 font-semibold cursor-pointer"
              style={{ padding: '0.8125rem 1.25rem' }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div
            className="flex flex-col"
            style={{ padding: '1rem 1rem 0.5rem', gap: 14 }}
          >
            {/* Email */}
            <div>
              <label className="block text-12 font-semibold text-text-muted uppercase tracking-wide-6 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                autoFocus={!initialEmail}
                className="w-full rounded-sm text-15 text-text-primary bg-bg outline-none box-border"
                style={{
                  padding: '0.6875rem 0.875rem',
                  border: `0.09375rem solid ${errorMsg ? 'var(--red)' : 'var(--border)'}`,
                }}
              />
              {errorMsg && (
                <p role="alert" className="text-12 text-red mt-1">{errorMsg}</p>
              )}
            </div>

            {availableRoles.length > 1 && <div>
              <label className="block text-12 font-semibold text-text-muted uppercase tracking-wide-6 mb-1.5">
                Role
              </label>
              <div className="flex flex-col gap-2">
                {availableRoles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className="flex items-center gap-3 rounded-sm text-left cursor-pointer"
                    style={{
                      padding: '0.75rem 0.875rem',
                      border: `0.09375rem solid ${role === r.value ? 'var(--sage)' : 'var(--border-light)'}`,
                      background: role === r.value ? 'var(--sage-light)' : 'var(--bg)',
                    }}
                  >
                    <span className="shrink-0">{r.icon}</span>
                    <div>
                      <p className="text-14 font-semibold text-text-primary m-0">{r.label}</p>
                      <p
                        className="text-12 text-text-muted m-0"
                        style={{ marginTop: '0.0625rem' }}
                      >
                        {r.description}
                      </p>
                    </div>
                    {role === r.value && (
                      <div
                        className="ml-auto rounded-full bg-sage flex items-center justify-center shrink-0"
                        style={{ width: 18, height: 18 }}
                      >
                        <Check size={10} color="white" weight="bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>}

            {/* Submit */}
            <button
              onClick={handleInvite}
              disabled={status === 'loading'}
              className="w-full rounded-md border-none bg-sage text-on-sage text-15 font-semibold flex items-center justify-center gap-2 mt-1 mb-2"
              style={{
                padding: '0.8125rem 1.25rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.6 : 1,
              }}
            >
              <PaperPlaneTilt size={16} weight="fill" />
              {status === 'loading' ? 'Saving…' : 'Send Invite'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
