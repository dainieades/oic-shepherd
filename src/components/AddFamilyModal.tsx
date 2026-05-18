'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { MEMBER_AVATAR_PALETTE } from '@/lib/constants';
import { fullName } from '@/lib/utils';

interface AddFamilyModalProps {
  onClose: () => void;
}

function suggestFamilyName(
  memberIds: string[],
  people: { id: string; preferredName: string; lastName?: string }[]
): string {
  const selected = people.filter((p) => memberIds.includes(p.id));
  if (selected.length === 0) return '';
  // Collect last names
  const lastNames = selected.map((p) => {
    if (p.lastName && p.lastName.trim()) return p.lastName.trim();
    const parts = p.preferredName.trim().split(/\s+/);
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
  const pool = data.people.filter((p) => !p.familyId);

  const q = search.toLowerCase();
  const filtered = pool.filter(
    (p) =>
      q === '' ||
      fullName(p).toLowerCase().includes(q) ||
      (p.alternativeName && p.alternativeName.toLowerCase().includes(q))
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
    <BottomSheet onClose={onClose} variant="dialog" aria-labelledby="add-family-title">
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
          <div className="py-3 px-4 pb-2 shrink-0">
            <div className="flex items-center gap-2 bg-bg rounded-sm py-2 px-3">
              <MagnifyingGlass size={16} color="var(--text-muted)" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="flex-1 bg-transparent border-none outline-none text-14 text-text-primary"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {sorted.length === 0 && (
              <p className="text-13 text-text-muted text-center pt-8 italic">
                {q ? 'No people match your search.' : 'All individuals are already in families.'}
              </p>
            )}
            {sorted.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const initials = fullName(p)
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const palette =
                MEMBER_AVATAR_PALETTE[p.preferredName.charCodeAt(0) % MEMBER_AVATAR_PALETTE.length];
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="w-full flex items-center gap-3 border-none border-b border-border-light cursor-pointer text-left rounded-none m-0"
                  style={{
                    padding: '0.625rem 0',
                    background: isSelected ? 'var(--sage-light)' : 'none',
                    borderRadius: 0,
                  }}
                >
                  <div
                    className="shrink-0 rounded-full flex items-center justify-center text-12 font-bold"
                    style={{
                      width: 36,
                      height: 36,
                      background: isSelected ? 'var(--sage)' : palette.bg,
                      color: isSelected ? 'var(--on-sage)' : palette.color,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="m-0 text-14"
                      style={{
                        fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                        color: isSelected ? 'var(--sage)' : 'var(--text-primary)',
                      }}
                    >
                      {fullName(p)}
                    </p>
                    {p.alternativeName && (
                      <p className="text-12 text-text-muted m-0">{p.alternativeName}</p>
                    )}
                  </div>
                  <div
                    className="shrink-0 flex items-center justify-center transition-[background] duration-150"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: isSelected ? 'none' : '0.09375rem solid var(--border)',
                      background: isSelected ? 'var(--sage)' : 'transparent',
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

          <div className="flex-1 overflow-y-auto bg-bg" style={{ padding: '1.5rem 1.25rem 3rem' }}>
            {/* Members preview */}
            <div className="mb-6">
              <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
                Members ({selectedPeople.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPeople.map((p) => {
                  const initials = fullName(p)
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  const palette =
                    MEMBER_AVATAR_PALETTE[
                      p.preferredName.charCodeAt(0) % MEMBER_AVATAR_PALETTE.length
                    ];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 bg-surface rounded-xl border border-border-light"
                      style={{ padding: '0.25rem 0.625rem 0.25rem 0.25rem' }}
                    >
                      <div
                        className="rounded-full flex items-center justify-center text-10 font-bold shrink-0"
                        style={{
                          width: 24,
                          height: 24,
                          background: palette.bg,
                          color: palette.color,
                        }}
                      >
                        {initials}
                      </div>
                      <span className="text-13 text-text-primary font-medium">
                        {p.preferredName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Family name input */}
            <div className="mb-6">
              <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-1">
                Last name
              </p>
              <div className="bg-surface rounded border border-border-light px-4 flex items-center gap-1">
                <input
                  ref={nameRef}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Smith"
                  className="flex-1 bg-transparent border-none outline-none text-16 text-text-primary"
                  style={{ padding: '0.875rem 0' }}
                />
                <span className="text-16 text-text-muted whitespace-nowrap">Family</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Success state ── */}
      {submitted && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div
            className="rounded-full bg-sage-light flex items-center justify-center"
            style={{ width: 56, height: 56 }}
          >
            <Check size={24} color="var(--sage)" weight="bold" />
          </div>
          <p className="text-16 font-semibold text-text-primary">Family created</p>
          <p className="text-13 text-text-muted">{familyName} Family has been added.</p>
        </div>
      )}
    </BottomSheet>
  );
}
