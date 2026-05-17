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
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, Z_SHEET } from '@/lib/constants';

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
  const initialTriage =
    personId ? (appData.people.find((p) => p.id === personId)?.canTriageVisitors ?? false) : false;
  const [canTriageVisitors, setCanTriageVisitors] = React.useState(initialTriage);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const isAdmin = currentPersona.role === 'admin';
  const showTriageToggle = isAdmin && role === 'shepherd';

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

    const triagePatch = role === 'shepherd' ? canTriageVisitors : false;
    if (personId) {
      await updatePerson(personId, {
        appRole: role,
        email: trimmed,
        canTriageVisitors: triagePatch,
      });
    } else {
      const matched = appData.people.find((p) => p.email?.toLowerCase() === trimmed);
      if (matched) {
        await updatePerson(matched.id, { appRole: role, canTriageVisitors: triagePatch });
      }
    }

    setStatus('success');
    onSuccess?.();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: BACKDROP_COLOR,
        zIndex: Z_SHEET,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem 0.75rem',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: 0,
                textAlign: personName ? 'left' : 'center',
              }}
            >
              Invite to App
            </p>
            {personName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <p
                  style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}
                >
                  {personName}
                </p>
                {onChangePerson && (
                  <button
                    onClick={onChangePerson}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 13,
                      color: 'var(--sage)',
                      fontWeight: 500,
                    }}
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
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          /* ── Success state ── */
          <div style={{ padding: '2rem 1.5rem 1rem', textAlign: 'center' }}>
            <CheckCircle
              size={48}
              color="var(--sage)"
              weight="fill"
              style={{ display: 'block', margin: '0 auto 1rem' }}
            />
            <p
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Invite sent!
            </p>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: 24,
              }}
            >
              <strong>{email.trim()}</strong> has been approved. They'll receive an email with a
              link to sign in — no password needed.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.8125rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div
            style={{
              padding: '1rem 1rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
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
                style={{
                  width: '100%',
                  padding: '0.6875rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `0.09375rem solid ${errorMsg ? 'var(--red)' : 'var(--border)'}`,
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  background: 'var(--bg)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errorMsg && (
                <p role="alert" style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Role
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableRoles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0.75rem 0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      border: `0.09375rem solid ${role === r.value ? 'var(--sage)' : 'var(--border-light)'}`,
                      background: role === r.value ? 'var(--sage-light)' : 'var(--bg)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{r.icon}</span>
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {r.label}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          margin: '0.0625rem 0 0',
                        }}
                      >
                        {r.description}
                      </p>
                    </div>
                    {role === r.value && (
                      <div
                        style={{
                          marginLeft: 'auto',
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'var(--sage)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={10} color="white" weight="bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Newcomer review toggle — admin only, shepherds only */}
            {showTriageToggle && (
              <button
                onClick={() => setCanTriageVisitors((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  border: '0.09375rem solid var(--border-light)',
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Review newcomers
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      margin: '0.0625rem 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    Lets this user review and welcome new sign-ups.
                  </p>
                </div>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 22,
                    borderRadius: 'var(--radius-pill)',
                    background: canTriageVisitors ? 'var(--sage)' : 'var(--border)',
                    position: 'relative',
                    transition: 'background 0.15s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: canTriageVisitors ? 16 : 2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      transition: 'left 0.15s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  />
                </span>
              </button>
            )}

            {/* Submit */}
            <button
              onClick={handleInvite}
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '0.8125rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                fontSize: 15,
                fontWeight: 600,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
                marginBottom: 8,
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
