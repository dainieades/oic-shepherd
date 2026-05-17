'use client';

import React from 'react';
import { type AppRole } from '@/lib/types';
import { Warning, Check, PencilSimple } from '@phosphor-icons/react';
import { SubPanel } from '@/components/BottomSheet';

const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access. Can manage all records, logs, and settings.',
  },
  {
    value: 'shepherd',
    label: 'User',
    description: 'Can view and log for their assigned people.',
  },
];

interface Props {
  currentRole: AppRole | undefined;
  canTriageVisitors?: boolean;
  noPersonLinked?: boolean;
  currentEmail?: string;
  onSelect: (role: AppRole) => void;
  onToggleTriage?: (next: boolean) => Promise<void> | void;
  onRemove: () => Promise<void> | void;
  onUpdateEmail?: (newEmail: string) => Promise<{ error?: string } | void>;
  onClose: () => void;
  isAdmin: boolean;
  personName?: string;
}

export default function AppRolePickerSheet({
  currentRole,
  canTriageVisitors = false,
  noPersonLinked,
  currentEmail,
  onSelect,
  onToggleTriage,
  onRemove,
  onUpdateEmail,
  onClose,
  isAdmin,
  personName,
}: Props) {
  const canEditEmail = Boolean(onUpdateEmail && currentEmail);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [emailDraft, setEmailDraft] = React.useState(currentEmail ?? '');
  const [emailError, setEmailError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<AppRole | undefined>(currentRole);
  const [triageOn, setTriageOn] = React.useState(canTriageVisitors);
  const [triageSaving, setTriageSaving] = React.useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  React.useEffect(() => {
    setTriageOn(canTriageVisitors);
  }, [canTriageVisitors]);

  React.useEffect(() => {
    if (editingEmail) {
      setEmailDraft(currentEmail ?? '');
      setEmailError('');
      const t = window.setTimeout(() => emailInputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [editingEmail, currentEmail]);

  async function handleSaveEmail() {
    if (!onUpdateEmail) return;
    const trimmed = emailDraft.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (trimmed === (currentEmail ?? '').toLowerCase()) {
      setEditingEmail(false);
      return;
    }
    setSaving(true);
    const result = await onUpdateEmail(trimmed);
    setSaving(false);
    if (result && 'error' in result && result.error) {
      setEmailError(result.error);
      return;
    }
    setEditingEmail(false);
    onClose();
  }

  return (
    <SubPanel onBack={onClose}>
      {/* Title */}
      <p
        style={{
          fontSize: 'var(--text-12)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-muted)',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide-6)',
          padding: '0.75rem 1.25rem 0.625rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        App Role
      </p>

      {editingEmail ? (
        /* ── Edit email address ── */
        <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
          <p
            style={{
              fontSize: 'var(--text-13)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: 'var(--leading-normal)',
              marginTop: 0,
              marginBottom: 16,
            }}
          >
            Update the email {personName ? `${personName} uses` : 'used'} to sign in.
          </p>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-12)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide-6)',
              marginBottom: 6,
            }}
          >
            Email address
          </label>
          <input
            ref={emailInputRef}
            type="email"
            value={emailDraft}
            onChange={(e) => {
              setEmailDraft(e.target.value);
              setEmailError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEmail();
            }}
            placeholder="name@example.com"
            autoComplete="email"
            style={{
              width: '100%',
              padding: '0.6875rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              border: `0.09375rem solid ${emailError ? 'var(--red)' : 'var(--border)'}`,
              fontSize: 'var(--text-15)',
              color: 'var(--text-primary)',
              background: 'var(--bg)',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: emailError ? 4 : 16,
            }}
          />
          {emailError && (
            <p role="alert" style={{ fontSize: 'var(--text-12)', color: 'var(--red)', margin: '0 0 12px' }}>
              {emailError}
            </p>
          )}
          <button
            onClick={handleSaveEmail}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-15)',
              fontWeight: 'var(--font-semibold)',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              marginBottom: 10,
            }}
          >
            {saving ? 'Saving…' : 'Save Email'}
          </button>
          <button
            onClick={() => {
              setEditingEmail(false);
              setEmailError('');
            }}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'none',
              color: 'var(--text-secondary)',
              border: 'none',
              fontSize: 'var(--text-15)',
              fontWeight: 'var(--font-medium)',
              cursor: saving ? 'not-allowed' : 'pointer',
              marginBottom: 4,
            }}
          >
            Cancel
          </button>
        </div>
      ) : confirmRemove ? (
        /* ── Warning state ── */
        <div style={{ padding: '1.5rem 1.25rem 0.5rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--red-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Warning size={20} color="var(--red)" />
          </div>
          <p
            style={{
              fontSize: 'var(--text-16)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Remove access?
          </p>
          <p
            style={{
              fontSize: 'var(--text-14)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: 'var(--leading-normal)',
              marginBottom: 24,
            }}
          >
            {personName ? `${personName} will` : 'This person will'} no longer be able to log into
            the app.
          </p>
          <button
            onClick={async () => {
              setSaving(true);
              await onRemove();
              setSaving(false);
              onClose();
            }}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--red)',
              color: 'var(--on-red)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-15)',
              fontWeight: 'var(--font-semibold)',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              marginBottom: 10,
            }}
          >
            {saving ? 'Removing…' : 'Remove Access'}
          </button>
          <button
            onClick={() => setConfirmRemove(false)}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'none',
              color: 'var(--text-secondary)',
              border: 'none',
              fontSize: 'var(--text-15)',
              fontWeight: 'var(--font-medium)',
              cursor: saving ? 'not-allowed' : 'pointer',
              marginBottom: 4,
            }}
          >
            Cancel
          </button>
        </div>
      ) : noPersonLinked ? (
        /* ── No person record linked ── */
        <div style={{ padding: '1.5rem 1.25rem 1.25rem', textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Warning size={20} color="var(--text-muted)" />
          </div>
          <p
            style={{ fontSize: 'var(--text-15)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 8 }}
          >
            No person record linked
          </p>
          <p
            style={{
              fontSize: 'var(--text-13)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
              marginBottom: 24,
            }}
          >
            To manage this person&apos;s role, open their person record and add this email address
            to their profile.
          </p>
          {isAdmin && (
            <>
              {canEditEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'none',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-15)',
                    fontWeight: 'var(--font-medium)',
                    cursor: 'pointer',
                    marginBottom: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <PencilSimple size={15} />
                  Edit Email
                </button>
              )}
              <button
                onClick={() => setConfirmRemove(true)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'none',
                  border: '1px solid var(--border-light)',
                  color: 'var(--red)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-15)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  marginBottom: 10,
                }}
              >
                Remove Access
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-15)',
              fontWeight: 'var(--font-medium)',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      ) : (
        /* ── Role options ── */
        <>
          {ROLE_OPTIONS.map((opt) => {
            const isSelected = opt.value === selectedRole;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedRole(opt.value);
                  onSelect(opt.value);
                  if (opt.value !== 'shepherd') onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.875rem 1.25rem',
                  background: isSelected ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-15)',
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-normal)',
                      color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-12)',
                      color: isSelected ? 'var(--sage)' : 'var(--text-muted)',
                      lineHeight: 'var(--leading-comfortable)',
                    }}
                  >
                    {opt.description}
                  </p>
                </div>
                {isSelected && (
                  <Check size={16} color="var(--sage)" weight="bold" style={{ flexShrink: 0 }} />
                )}
              </button>
            );
          })}

          {isAdmin && selectedRole === 'shepherd' && onToggleTriage && (
            <button
              onClick={async () => {
                if (triageSaving) return;
                const next = !triageOn;
                setTriageOn(next);
                setTriageSaving(true);
                try {
                  await onToggleTriage(next);
                } catch {
                  setTriageOn(!next);
                } finally {
                  setTriageSaving(false);
                }
              }}
              disabled={triageSaving}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.875rem 1.25rem',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-light)',
                cursor: triageSaving ? 'not-allowed' : 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 'var(--text-15)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  Review newcomers
                </p>
                <p style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)', lineHeight: 'var(--leading-comfortable)' }}>
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
                  background: triageOn ? 'var(--sage)' : 'var(--border)',
                  position: 'relative',
                  transition: 'background 0.15s',
                  opacity: triageSaving ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: triageOn ? 16 : 2,
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

          {isAdmin && (
            <>
              {canEditEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  style={{
                    width: '100%',
                    padding: '0.9375rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border-light)',
                    fontSize: 'var(--text-15)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <PencilSimple size={16} color="var(--text-muted)" />
                  Edit Email
                </button>
              )}
              <button
                onClick={() => setConfirmRemove(true)}
                style={{
                  width: '100%',
                  padding: '0.9375rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: 'var(--text-15)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Remove Access
              </button>
            </>
          )}
        </>
      )}
    </SubPanel>
  );
}
