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
      <div className="min-h-dvh">
        <div className="settings-subpage-navbar sticky top-0 -mx-4 px-4 border-b border-border-light bg-bg flex items-center justify-between z-page" style={{ height: 54 }}>
          <button onClick={() => router.push('/settings')} className="inline-flex items-center gap-1 text-13 text-sage cursor-pointer" style={{ background: 'none', border: 'none' }}>
            <CaretLeft size={16} />
            Settings
          </button>
          <span className="text-15 font-semibold text-text-primary">My Profile</span>
          <span className="w-16" />
        </div>
        <div className="py-10 text-center text-text-muted text-14">
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
        className="settings-subpage-navbar fixed top-0 left-0 right-0 flex items-center justify-between px-4 border-b border-border-light bg-bg z-page"
        style={{ height: 54 }}
      >
        <button
          onClick={onBack}
          className="text-14 text-text-secondary cursor-pointer p-0"
          style={{ background: 'none', border: 'none' }}
        >
          Cancel
        </button>
        <span className="text-15 font-semibold text-text-primary">My Profile</span>
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className="text-14 font-semibold rounded-xs"
          style={{
            height: 32,
            padding: '0 0.875rem',
            background: canSave && !isSaving ? 'var(--sage)' : 'var(--border)',
            color: canSave && !isSaving ? 'var(--on-sage)' : 'var(--text-muted)',
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
        <span className="text-17 font-bold text-text-primary tracking-tight-1">
          My Profile
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-14 font-medium text-text-secondary border border-border rounded-xs cursor-pointer"
            style={{ height: 32, padding: '0 0.875rem', background: 'none' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="text-14 font-semibold rounded-xs"
            style={{
              height: 32,
              padding: '0 0.875rem',
              background: canSave && !isSaving ? 'var(--sage)' : 'var(--border)',
              color: canSave && !isSaving ? 'var(--on-sage)' : 'var(--text-muted)',
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

