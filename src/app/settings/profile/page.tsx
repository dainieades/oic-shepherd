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
        <div
          className="settings-subpage-navbar border-border-light bg-bg z-page sticky top-0 -mx-4 flex items-center justify-between border-b px-4"
          style={{ height: 54 }}
        >
          <button
            onClick={() => router.push('/settings')}
            className="text-13 text-sage inline-flex cursor-pointer items-center gap-1"
            style={{ background: 'none', border: 'none' }}
          >
            <CaretLeft size={16} />
            Settings
          </button>
          <span className="text-15 text-text-primary font-semibold">My Profile</span>
          <span className="w-16" />
        </div>
        <div className="text-text-muted text-14 py-10 text-center">
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
        className="settings-subpage-navbar border-border-light bg-bg z-page fixed top-0 right-0 left-0 flex items-center justify-between border-b px-4"
        style={{ height: 54 }}
      >
        <button
          onClick={onBack}
          className="text-14 text-text-secondary cursor-pointer p-0"
          style={{ background: 'none', border: 'none' }}
        >
          Cancel
        </button>
        <span className="text-15 text-text-primary font-semibold">My Profile</span>
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className="text-14 rounded-xs font-semibold"
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
        <span className="text-17 text-text-primary tracking-tight-1 font-bold">My Profile</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-14 text-text-secondary border-border cursor-pointer rounded-xs border font-medium"
            style={{ height: 32, padding: '0 0.875rem', background: 'none' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="text-14 rounded-xs font-semibold"
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
