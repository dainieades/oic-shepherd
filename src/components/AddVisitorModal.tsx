'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { BottomSheet, ModalHeader } from './BottomSheet';
import VisitorIntakeForm, { type VisitorIntakeFormHandle } from './VisitorIntakeForm';

interface AddVisitorModalProps {
  onClose: () => void;
}

export default function AddVisitorModal({ onClose }: AddVisitorModalProps) {
  const { setFullPageModalOpen } = useApp();
  React.useEffect(() => {
    setFullPageModalOpen(true);
    return () => setFullPageModalOpen(false);
  }, [setFullPageModalOpen]);

  const { showToast } = useToast();
  const router = useRouter();
  const formRef = React.useRef<VisitorIntakeFormHandle>(null);
  const [canSave, setCanSave] = React.useState(false);

  const handleSaved = (personId: string) => {
    showToast('Visitor added');
    onClose();
    router.push(`/person/${personId}`);
  };

  return (
    <BottomSheet onClose={onClose} variant="dialog" aria-labelledby="add-visitor-title">
      <ModalHeader
        title="Add visitor"
        titleId="add-visitor-title"
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
        <VisitorIntakeForm ref={formRef} onSaved={handleSaved} onValidityChange={setCanSave} />
      </div>
    </BottomSheet>
  );
}
