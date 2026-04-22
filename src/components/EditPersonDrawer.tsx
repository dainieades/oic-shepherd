'use client';

import React from 'react';
import { type Person } from '@/lib/types';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { useToast } from './Toast';
import PersonFormBody, { type PersonFormBodyHandle } from './PersonFormBody';

interface Props {
  person: Person;
  onClose: () => void;
}

export default function EditPersonDrawer({ person, onClose }: Props) {
  const { showToast } = useToast();
  const formRef = React.useRef<PersonFormBodyHandle>(null);
  const [canSave, setCanSave] = React.useState(!!person.englishName.trim());

  const handleSaved = () => {
    showToast('Changes saved');
    onClose();
  };

  return (
    <>
      <BottomSheet onClose={onClose} aria-labelledby="edit-person-title">
        <ModalHeader
          title="Edit person"
          titleId="edit-person-title"
          onCancel={onClose}
          onAction={() => formRef.current?.save()}
          actionLabel="Save"
          actionDisabled={!canSave}
        />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.25rem 3rem',
            background: 'var(--bg)',
          }}
        >
          <PersonFormBody
            ref={formRef}
            person={person}
            onSaved={handleSaved}
            showInviteRow
            onValidityChange={setCanSave}
          />
        </div>
      </BottomSheet>
    </>
  );
}
