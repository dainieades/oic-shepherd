'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { MEMBER_AVATAR_PALETTE } from '@/lib/constants';

interface AddFamilyModalProps {
  onClose: () => void;
}


function suggestFamilyName(
  memberIds: string[],
  people: { id: string; englishName: string }[]
): string {
  const selected = people.filter((p) => memberIds.includes(p.id));
  if (selected.length === 0) return '';
  // Collect last names
  const lastNames = selected.map((p) => {
    const parts = p.englishName.trim().split(/\s+/);
    return parts[parts.length - 1];
  });
  // Find most common last name
  const freq: Record<string, number> = {};
  for (const n of lastNames) freq[n] = (freq[n] ?? 0) + 1;
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? lastNames[0];
  // If all same last name → "Smith", else "Smith / Jones"
  const unique = [...new Set(lastNames)];
  return unique.length === 1 ? top : unique.slice(0, 2).join(' / ');
}

export default function AddFamilyModal({ onClose }: AddFamilyModalProps) {
  const { data, addFamily, setFullPageModalOpen } = useApp();
  const router = useRouter();
  React.useEffect(() => {
    setFullPageModalOpen(true);
    return () => setFullPageModalOpen(false);
  }, [setFullPageModalOpen]);
  const [step, setStep] = React.useState<'members' | 'name'>('members');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');
  const [familyName, setFamilyName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);

  // People who don't have a family yet
  const pool = data.people.filter((p) => !p.familyId && !p.isChild);

  const q = search.toLowerCase();
  const filtered = pool.filter(
    (p) =>
      q === '' ||
      p.englishName.toLowerCase().includes(q) ||
      (p.chineseName && p.chineseName.toLowerCase().includes(q))
  );

  // Sort: selected first, then alphabetical
  const sorted = [
    ...filtered.filter((p) => selectedIds.includes(p.id)),
    ...filtered.filter((p) => !selectedIds.includes(p.id)),
  ];

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  React.useEffect(() => {
    if (step === 'members') {
      setTimeout(() => searchRef.current?.focus(), 80);
    } else if (step === 'name') {
      const suggested = suggestFamilyName(selectedIds, data.people);
      setFamilyName(suggested);
      setTimeout(() => {
        nameRef.current?.focus();
        nameRef.current?.select();
      }, 80);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!familyName.trim() || selectedIds.length === 0) return;
    const familyId = await addFamily(`${familyName.trim()} Family`, selectedIds);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      router.push(`/family/${familyId}`);
    }, 1600);
  };

  const selectedPeople = data.people.filter((p) => selectedIds.includes(p.id));

  return (
    <BottomSheet onClose={onClose} aria-labelledby="add-family-title">

        {/* ── Step: members ── */}
        {step === 'members' && (
          <>
            <ModalHeader
              title="Select members"
              titleId="add-family-title"
              onCancel={onClose}
              onAction={() => setStep('name')}
              actionLabel={selectedIds.length > 0 ? `Next (${selectedIds.length})` : 'Next'}
              actionDisabled={selectedIds.length === 0}
              actionVariant="pill"
            />

            {/* Search */}
            <div style={{ padding: '0.75rem 1rem 0.5rem', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                }}
              >
                <MagnifyingGlass size={16} color="var(--text-muted)" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search people…"
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 2rem' }}>
              {sorted.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    paddingTop: 32,
                    fontStyle: 'italic',
                  }}
                >
                  {q ? 'No people match your search.' : 'All individuals are already in families.'}
                </p>
              )}
              {sorted.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const initials = p.englishName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const palette =
                  MEMBER_AVATAR_PALETTE[p.englishName.charCodeAt(0) % MEMBER_AVATAR_PALETTE.length];
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0.625rem 0',
                      background: isSelected ? 'var(--sage-light)' : 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: 0,
                      margin: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: isSelected ? 'var(--sage)' : palette.bg,
                        color: isSelected ? 'var(--on-sage)' : palette.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {p.englishName}
                      </p>
                      {p.chineseName && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          {p.chineseName}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        flexShrink: 0,
                        border: isSelected ? 'none' : '0.09375rem solid var(--border)',
                        background: isSelected ? 'var(--sage)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.15s',
                      }}
                    >
                      {isSelected && <Check size={11} color="var(--on-sage)" weight="bold" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step: name ── */}
        {step === 'name' && !submitted && (
          <>
            <ModalHeader
              title="Name family"
              titleId="add-family-title"
              onCancel={() => setStep('members')}
              cancelLabel="Back"
              onAction={handleCreate}
              actionLabel="Create"
              actionDisabled={!familyName.trim()}
            />

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem 1.25rem 3rem',
                background: 'var(--bg)',
              }}
            >
              {/* Members preview */}
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Members ({selectedPeople.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedPeople.map((p) => {
                    const initials = p.englishName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const palette =
                      MEMBER_AVATAR_PALETTE[p.englishName.charCodeAt(0) % MEMBER_AVATAR_PALETTE.length];
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--surface)',
                          borderRadius: 'var(--radius-xl)',
                          padding: '0.25rem 0.625rem 0.25rem 0.25rem',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: palette.bg,
                            color: palette.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <span
                          style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}
                        >
                          {p.englishName.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Family name input */}
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  Last name
                </p>
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border-light)',
                    padding: '0 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <input
                    ref={nameRef}
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="e.g. Smith"
                    style={{
                      flex: 1,
                      padding: '0.875rem 0',
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      fontSize: 16,
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span style={{ fontSize: 16, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    Family
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Success state ── */}
        {submitted && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
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
              Family created
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{familyName} Family has been added.</p>
          </div>
        )}
    </BottomSheet>
  );
}
