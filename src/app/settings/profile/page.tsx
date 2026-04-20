'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import PersonFormBody, { type PersonFormBodyHandle } from '@/components/PersonFormBody';
import { SHEET_MAX_WIDTH } from '@/lib/constants';

export default function SettingsProfilePage() {
  const router = useRouter();
  const { data, currentPersona } = useApp();
  const person = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  if (!person) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <div style={navBarStyle}>
          <button onClick={() => router.back()} style={backBtnStyle}>
            <CaretLeft size={16} />
            Settings
          </button>
          <span style={navTitleStyle}>My Profile</span>
          <span style={{ width: 64 }} />
        </div>
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          No profile linked to this account.
        </div>
      </div>
    );
  }

  return <ProfileEditor personId={person.id} onBack={() => router.back()} />;
}

function ProfileEditor({ personId, onBack }: { personId: string; onBack: () => void }) {
  const { data } = useApp();
  const person = data.people.find((p) => p.id === personId)!;
  const formRef = React.useRef<PersonFormBodyHandle>(null);
  const [canSave, setCanSave] = React.useState(!!person.englishName.trim());

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border-light)',
          height: 54,
        }}
      >
        <div
          style={{
            maxWidth: SHEET_MAX_WIDTH,
            margin: '0 auto',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
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
            onClick={() => formRef.current?.save()}
            disabled={!canSave}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 8,
              background: canSave ? 'var(--sage)' : 'var(--border)',
              color: canSave ? 'var(--on-sage)' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: canSave ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div style={{ height: 54 }} />

      <PersonFormBody
        ref={formRef}
        person={person}
        onSaved={onBack}
        showPhotoUpload
        onValidityChange={setCanSave}
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 30,
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
  fontSize: 13,
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
};
