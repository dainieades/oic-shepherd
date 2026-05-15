'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { BottomSheet, ModalHeader } from './BottomSheet';
import PersonFormBody, { type PersonFormBodyHandle } from './PersonFormBody';

interface AddPersonModalProps {
  onClose: () => void;
}

export default function AddPersonModal({ onClose }: AddPersonModalProps) {
  const { setFullPageModalOpen } = useApp();
  React.useEffect(() => {
    setFullPageModalOpen(true);
    return () => setFullPageModalOpen(false);
  }, [setFullPageModalOpen]);

  const { showToast } = useToast();
  const router = useRouter();
  const formRef = React.useRef<PersonFormBodyHandle>(null);
  const [canSave, setCanSave] = React.useState(false);

  const handleSaved = (newPersonId?: string) => {
    showToast('Person added');
    onClose();
    if (newPersonId) router.push(`/person/${newPersonId}`);
  };

  return (
    <BottomSheet onClose={onClose} variant="dialog" aria-labelledby="add-person-title">
      <ModalHeader
        title="Add person"
        titleId="add-person-title"
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
        <PersonFormBody ref={formRef} onSaved={handleSaved} onValidityChange={setCanSave} />
      </div>
    </BottomSheet>
  );
}
