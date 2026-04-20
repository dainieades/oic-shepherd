'use client';

import React from 'react';
import { MagnifyingGlass, CheckCircle, Check } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { BottomSheet, ModalHeader } from './BottomSheet';

interface AddFamilyModalProps {
  onClose: () => void;
}

const memberAvatarPalette = [
  { bg: '#E8F0FE', color: '#4A6FA5' },
  { bg: '#FDE8F0', color: '#A54A6F' },
  { bg: '#E8FEF0', color: '#4AA56F' },
  { bg: '#FEF3E8', color: '#A5794A' },
  { bg: '#F0E8FE', color: '#7A4AA5' },
  { bg: '#E8FEFE', color: '#4A9FA5' },
];

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
  // If all same last name → "Smith Family", else "Smith / Jones Family"
  const unique = [...new Set(lastNames)];
  return unique.length === 1 ? `${top} Family` : `${unique.slice(0, 2).join(' / ')} Family`;
}

export default function AddFamilyModal({ onClose }: AddFamilyModalProps) {
  const { data, addFamily } = useApp();
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

  const handleCreate = () => {
    if (!familyName.trim() || selectedIds.length === 0) return;
    addFamily(familyName.trim(), selectedIds);
    setSubmitted(true);
    setTimeout(() => onClose(), 1600);
  };

  const selectedPeople = data.people.filter((p) => selectedIds.includes(p.id));

  return (
    <BottomSheet onClose={onClose} dragHandle>

        {/* ── Step: members ── */}
        {step === 'members' && (
          <>
            <ModalHeader
              title="Select members"
              onCancel={onClose}
              onAction={() => setStep('name')}
              actionLabel={selectedIds.length > 0 ? `Next (${selectedIds.length})` : 'Next'}
              actionDisabled={selectedIds.length === 0}
              actionVariant="text"
            />

            {/* Search */}
            <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '8px 12px',
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
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
                  memberAvatarPalette[p.englishName.charCodeAt(0) % memberAvatarPalette.length];
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
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
                        color: isSelected ? '#fff' : palette.color,
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
                    {isSelected ? (
                      <CheckCircle
                        size={22}
                        weight="fill"
                        color="var(--sage)"
                        style={{ flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: '1.5px solid var(--border)',
                          flexShrink: 0,
                        }}
                      />
                    )}
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
                padding: '24px 20px 48px',
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
                      memberAvatarPalette[p.englishName.charCodeAt(0) % memberAvatarPalette.length];
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--surface)',
                          borderRadius: 20,
                          padding: '4px 10px 4px 4px',
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
                  Family name
                </p>
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border-light)',
                    padding: '0 16px',
                  }}
                >
                  <input
                    ref={nameRef}
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="e.g. Smith Family"
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      fontSize: 16,
                      color: 'var(--text-primary)',
                    }}
                  />
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
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{familyName} has been added.</p>
          </div>
        )}
    </BottomSheet>
  );
}
