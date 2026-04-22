'use client';

import React from 'react';
import { type AppRole } from '@/lib/types';
import { Warning, Check } from '@phosphor-icons/react';
import { Z_SHEET } from '@/lib/constants';
import { BottomSheet } from '@/components/BottomSheet';

const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access. Can manage all records, logs, and settings.',
  },
  {
    value: 'shepherd',
    label: 'Shepherd',
    description: 'Can view and log for their assigned people.',
  },
  {
    value: 'welcome-team',
    label: 'Welcome Team',
    description: 'Can view the directory and check in visitors.',
  },
];

interface Props {
  currentRole: AppRole | undefined;
  onSelect: (role: AppRole) => void;
  onRemove: () => void; // called after warning is confirmed
  onClose: () => void;
  isAdmin: boolean;
  personName?: string;
}

export default function AppRolePickerSheet({
  currentRole,
  onSelect,
  onRemove,
  onClose,
  isAdmin,
  personName,
}: Props) {
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  return (
    <BottomSheet onClose={onClose} compact zIndex={Z_SHEET}>
        {/* Title */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.75rem 1.25rem 0.625rem',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          App Role
        </p>

        {confirmRemove ? (
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
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Remove access?
            </p>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {personName ? `${personName} will` : 'This person will'} no longer be able to log into
              the app.
            </p>
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'var(--red)',
                color: 'var(--on-red)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Remove Access
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'none',
                color: 'var(--text-secondary)',
                border: 'none',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          /* ── Role options ── */
          <>
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = opt.value === currentRole;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSelect(opt.value);
                    onClose();
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
                        fontSize: 15,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {opt.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: isSelected ? 'var(--sage)' : 'var(--text-muted)',
                        lineHeight: 1.4,
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

            {isAdmin && (
              <button
                onClick={() => setConfirmRemove(true)}
                style={{
                  width: '100%',
                  padding: '0.9375rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--red)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Remove Access
              </button>
            )}
          </>
        )}
    </BottomSheet>
  );
}
