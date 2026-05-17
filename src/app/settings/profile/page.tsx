'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import PersonFormBody, { type PersonFormBodyHandle } from '@/components/PersonFormBody';

export default function SettingsProfilePage() {
  const router = useRouter();
  const { data, currentPersona } = useApp();
  const person = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  if (!person) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <div className="settings-subpage-navbar" style={navBarStyle}>
          <button onClick={() => router.push('/settings')} style={backBtnStyle}>
            <CaretLeft size={16} />
            Settings
          </button>
          <span style={navTitleStyle}>My Profile</span>
          <span style={{ width: 64 }} />
        </div>
        <div
          style={{
            padding: '2.5rem 0',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-14)',
          }}
        >
          No profile linked to this account.
        </div>
      </div>
    );
  }

  return <ProfileEditor personId={person.id} onBack={() => router.push('/settings')} />;
}

function ProfileEditor({ personId, onBack }: { personId: string; onBack: () => void }) {
  const { data } = useApp();
  const person = data.people.find((p) => p.id === personId)!;
  const formRef = React.useRef<PersonFormBodyHandle>(null);
  const [canSave, setCanSave] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await formRef.current?.save();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div
        className="settings-subpage-navbar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-page)',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-light)',
          height: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
        }}
      >
        <button
          onClick={onBack}
          style={{
            fontSize: 'var(--text-14)',
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Cancel
        </button>
        <span style={navTitleStyle}>My Profile</span>
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          style={{
            height: 32,
            padding: '0 0.875rem',
            borderRadius: 'var(--radius-xs)',
            background: canSave && !isSaving ? 'var(--sage)' : 'var(--border)',
            color: canSave && !isSaving ? 'var(--on-sage)' : 'var(--text-muted)',
            fontSize: 'var(--text-14)',
            fontWeight: 'var(--font-semibold)',
            border: 'none',
            cursor: canSave && !isSaving ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="settings-subpage-spacer" style={{ height: 54 }} />

      <div className="settings-subpage-desktop-header">
        <span style={{ fontSize: 'var(--text-17)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight-1)' }}>
          My Profile
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onBack}
            style={{
              height: 32,
              padding: '0 0.875rem',
              borderRadius: 'var(--radius-xs)',
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-medium)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            style={{
              height: 32,
              padding: '0 0.875rem',
              borderRadius: 'var(--radius-xs)',
              background: canSave && !isSaving ? 'var(--sage)' : 'var(--border)',
              color: canSave && !isSaving ? 'var(--on-sage)' : 'var(--text-muted)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-semibold)',
              border: 'none',
              cursor: canSave && !isSaving ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <PersonFormBody
        ref={formRef}
        person={person}
        onSaved={onBack}
        showPhotoUpload
        onValidityChange={setCanSave}
        ownContact
        sheetVariant="picker-dialog"
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 'var(--z-page)',
  background: 'var(--bg)',
  marginLeft: -16,
  marginRight: -16,
  paddingLeft: 16,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 54,
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 'var(--text-13)',
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-15)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-primary)',
};
