'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { Check } from '@phosphor-icons/react';
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
  const formRef = React.useRef<PersonFormBodyHandle>(null);
  const [canSave, setCanSave] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSaved = () => {
    showToast('Person added');
    setSubmitted(true);
    setTimeout(() => onClose(), 1600);
  };

  return (
    <BottomSheet onClose={onClose} aria-labelledby="add-person-title">
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
        {submitted ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              paddingTop: 60,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--sage-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={24} color="var(--sage)" weight="bold" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Person added
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Added to the directory.
            </p>
          </div>
        ) : (
          <PersonFormBody
            ref={formRef}
            onSaved={handleSaved}
            onValidityChange={setCanSave}
          />
        )}
      </div>
    </BottomSheet>
  );
}
