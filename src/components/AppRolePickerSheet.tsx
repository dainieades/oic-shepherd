'use client';

import React from 'react';
import { type AppRole } from '@/lib/types';
import { Warning, Check, PencilSimple, X } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/BottomSheet';

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
  noPersonLinked?: boolean;
  currentEmail?: string;
  onSelect: (role: AppRole) => void;
  onRemove: () => Promise<void> | void;
  onUpdateEmail?: (newEmail: string) => Promise<{ error?: string } | void>;
  onClose: () => void;
  isAdmin: boolean;
  personName?: string;
}

export default function AppRolePickerSheet({
  currentRole,
  noPersonLinked,
  currentEmail,
  onSelect,
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
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

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
    <BottomSheet onClose={onClose} variant="confirm" allowBackdropClose compact>
      {/* Header */}
      <div className="flex items-center justify-between pt-3 pr-4 pb-[0.625rem] pl-5 border-b border-border-light">
        <p className="text-12 font-semibold text-text-muted uppercase tracking-wide-6 m-0">
          App Role
        </p>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--border-light)] border-none cursor-pointer text-text-muted shrink-0"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {editingEmail ? (
        /* ── Edit email address ── */
        <div className="px-5 pt-5 pb-2">
          <p className="text-13 text-text-secondary text-center leading-normal mt-0 mb-4">
            Update the email {personName ? `${personName} uses` : 'used'} to sign in.
          </p>
          <label className="block text-12 font-semibold text-text-muted uppercase tracking-wide-6 mb-1.5">
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
            className="w-full rounded-sm text-15 text-text-primary bg-bg outline-none box-border"
            style={{
              padding: '0.6875rem 0.875rem',
              border: `0.09375rem solid ${emailError ? 'var(--red)' : 'var(--border)'}`,
              marginBottom: emailError ? 4 : 16,
            }}
          />
          {emailError && (
            <p role="alert" className="text-12 text-red m-0 mb-3">
              {emailError}
            </p>
          )}
          <button
            onClick={handleSaveEmail}
            disabled={saving}
            className="w-full py-3.5 bg-sage text-on-sage border-none rounded-md text-15 font-semibold mb-2.5"
            style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Email'}
          </button>
          <button
            onClick={() => {
              setEditingEmail(false);
              setEmailError('');
            }}
            disabled={saving}
            className="w-full py-3.5 bg-transparent text-text-secondary border-none text-15 font-medium mb-1"
            style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
        </div>
      ) : confirmRemove ? (
        /* ── Warning state ── */
        <div className="px-5 pt-6 pb-2">
          <div className="w-11 h-11 rounded-full bg-red-light flex items-center justify-center mx-auto mb-4">
            <Warning size={20} color="var(--red)" />
          </div>
          <p className="text-16 font-bold text-text-primary text-center mb-2">
            Remove access?
          </p>
          <p className="text-14 text-text-secondary text-center leading-normal mb-6">
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
            className="w-full py-3.5 bg-red text-on-red border-none rounded-md text-15 font-semibold mb-2.5"
            style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Removing…' : 'Remove Access'}
          </button>
          <button
            onClick={() => setConfirmRemove(false)}
            disabled={saving}
            className="w-full py-3.5 bg-transparent text-text-secondary border-none text-15 font-medium mb-1"
            style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
        </div>
      ) : noPersonLinked ? (
        /* ── No person record linked ── */
        <div className="px-5 pt-6 pb-5 text-center">
          <div className="w-11 h-11 rounded-full bg-[var(--border-light)] flex items-center justify-center mx-auto mb-4">
            <Warning size={20} color="var(--text-muted)" />
          </div>
          <p className="text-15 font-semibold text-text-primary mb-2">
            No person record linked
          </p>
          <p className="text-13 text-text-secondary leading-normal mb-6">
            To manage this person&apos;s role, open their person record and add this email address
            to their profile.
          </p>
          {isAdmin && (
            <>
              {canEditEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="w-full py-3.5 bg-transparent border border-border-light text-text-primary rounded-md text-15 font-medium cursor-pointer mb-2.5 inline-flex items-center justify-center gap-2"
                >
                  <PencilSimple size={15} />
                  Edit Email
                </button>
              )}
              <button
                onClick={() => setConfirmRemove(true)}
                className="w-full py-3.5 bg-transparent border border-border-light text-red rounded-md text-15 font-semibold cursor-pointer mb-2.5"
              >
                Remove Access
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-surface border border-border-light text-text-primary rounded-md text-15 font-medium cursor-pointer"
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
                className="w-full flex items-center gap-3 border-none border-b border-border-light cursor-pointer text-left"
                style={{
                  padding: '0.875rem 1.25rem',
                  background: isSelected ? 'var(--sage-light)' : 'none',
                }}
              >
                <div className="flex-1">
                  <p
                    className="text-15 mb-0.5"
                    style={{
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-normal)',
                      color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="text-12 leading-comfortable"
                    style={{ color: isSelected ? 'var(--sage)' : 'var(--text-muted)' }}
                  >
                    {opt.description}
                  </p>
                </div>
                {isSelected && (
                  <Check size={16} color="var(--sage)" weight="bold" className="shrink-0" />
                )}
              </button>
            );
          })}

          {isAdmin && (
            <>
              {canEditEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="w-full bg-transparent border-none border-b border-border-light text-15 font-medium text-text-primary cursor-pointer text-left flex items-center gap-2.5"
                  style={{ padding: '0.9375rem 1.25rem' }}
                >
                  <PencilSimple size={16} color="var(--text-muted)" />
                  Edit Email
                </button>
              )}
              <button
                onClick={() => setConfirmRemove(true)}
                className="w-full bg-transparent border-none border-b border-border-light text-15 font-medium text-red cursor-pointer text-left"
                style={{ padding: '0.9375rem 1.25rem' }}
              >
                Remove Access
              </button>
            </>
          )}
        </>
      )}
    </BottomSheet>
  );
}
