'use client';

import React from 'react';
import { MagnifyingGlass, Check } from '@phosphor-icons/react';
import { CheckboxMark } from './CheckRow';
import { SHEPHERD_AVATAR_PALETTE, Z_SHEET } from '@/lib/constants';
import { CHURCH_POSITIONS } from '@/lib/types';
import { AvatarBadge } from './AvatarBadge';
import { BottomSheet, ModalHeader } from './BottomSheet';

export function GroupPickerSheet({
  groups,
  currentIds,
  onConfirm,
  onBack,
}: {
  groups: import('@/lib/types').Group[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = groups.filter((g) => !q || g.name.toLowerCase().includes(q));
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title="Fellowship Groups"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="text"
      />
        <div
          style={{
            padding: '0.75rem 1.25rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5625rem 0.75rem',
            }}
          >
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((g) => {
            const isSel = selectedIds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1.25rem',
                  background: isSel ? 'var(--blue-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--blue)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {g.name}
                  </p>
                </div>
                <CheckboxMark checked={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No groups found.
            </p>
          )}
        </div>
    </BottomSheet>
  );
}

export function SheepPickerSheet({
  people,
  currentIds,
  onConfirm,
  onBack,
}: {
  people: { id: string; englishName: string; chineseName?: string; photo?: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const sorted = [
    ...people.filter((p) => selectedIds.includes(p.id)),
    ...people.filter((p) => !selectedIds.includes(p.id)),
  ].filter(
    (p) =>
      !q ||
      p.englishName.toLowerCase().includes(q) ||
      (p.chineseName && p.chineseName.toLowerCase().includes(q))
  );
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title="Sheep"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="text"
      />
        <div
          style={{
            padding: '0.75rem 1.25rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5625rem 0.75rem',
            }}
          >
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                paddingTop: 24,
                textAlign: 'center',
              }}
            >
              No matching people.
            </p>
          )}
          {sorted.map((p, i) => {
            const isSel = selectedIds.includes(p.id);
            const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1.25rem',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <AvatarBadge
                  name={p.englishName}
                  photo={p.photo}
                  size={36}
                  bg={isSel ? 'var(--sage)' : palette.bg}
                  color={isSel ? 'var(--on-sage)' : palette.color}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {p.englishName}
                  </p>
                  {p.chineseName && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {p.chineseName}
                    </p>
                  )}
                </div>
                <CheckboxMark checked={isSel} />
              </button>
            );
          })}
        </div>
    </BottomSheet>
  );
}

export function ShepherdPickerSheet({
  entries,
  currentIds,
  onConfirm,
  onBack,
}: {
  entries: { id: string; name: string; subtitle: string; photo?: string }[];
  currentIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = entries.filter((e) => !q || e.name.toLowerCase().includes(q));
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title="Shepherd"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="text"
      />
        <div
          style={{
            padding: '0.75rem 1.25rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5625rem 0.75rem',
            }}
          >
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shepherds…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((entry, i) => {
            const isSel = selectedIds.includes(entry.id);
            const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
            return (
              <button
                key={entry.id}
                onClick={() => toggle(entry.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1.25rem',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <AvatarBadge
                  name={entry.name}
                  photo={entry.photo}
                  size={36}
                  bg={isSel ? 'var(--sage)' : palette.bg}
                  color={isSel ? 'var(--on-sage)' : palette.color}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {entry.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {entry.subtitle}
                  </p>
                </div>
                <CheckboxMark checked={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No shepherds found.
            </p>
          )}
        </div>
    </BottomSheet>
  );
}

export function PositionPickerSheet({
  currentPositions,
  onConfirm,
  onBack,
}: {
  currentPositions: string[];
  onConfirm: (positions: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedPositions, setSelectedPositions] = React.useState<string[]>(currentPositions);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = CHURCH_POSITIONS.filter((pos) => !q || pos.toLowerCase().includes(q));
  const toggle = (pos: string) =>
    setSelectedPositions((prev) =>
      prev.includes(pos) ? prev.filter((x) => x !== pos) : [...prev, pos]
    );

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title="Church Position"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedPositions)}
        actionLabel={selectedPositions.length > 0 ? `Done (${selectedPositions.length})` : 'Done'}
        actionVariant="text"
      />
        <div
          style={{
            padding: '0.75rem 1.25rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5625rem 0.75rem',
            }}
          >
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search positions…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((pos) => {
            const isSel = selectedPositions.includes(pos);
            return (
              <button
                key={pos}
                onClick={() => toggle(pos)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1.25rem',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {pos}
                  </p>
                </div>
                <CheckboxMark checked={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No positions found.
            </p>
          )}
        </div>
    </BottomSheet>
  );
}

export function FamilyPickerSheet({
  families,
  people,
  currentFamilyId,
  onConfirm,
  onBack,
}: {
  families: { id: string; label: string; memberIds: string[] }[];
  people: { id: string; englishName: string }[];
  currentFamilyId: string | undefined;
  onConfirm: (familyId: string | undefined) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | undefined>(currentFamilyId);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = families.filter((f) => {
    if (!q) return true;
    if (f.label.toLowerCase().includes(q)) return true;
    return people
      .filter((p) => f.memberIds.includes(p.id))
      .some((m) => m.englishName.toLowerCase().includes(q));
  });

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title="Family"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedId)}
        actionLabel="Done"
        actionVariant="text"
      />
        <div
          style={{
            padding: '0.75rem 1.25rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5625rem 0.75rem',
            }}
          >
            <MagnifyingGlass size={14} color="var(--text-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search families…"
              style={{
                flex: 1,
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!q && (
            <button
              onClick={() => setSelectedId(undefined)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.75rem 1.25rem',
                background: !selectedId ? 'var(--sage-light)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-light)',
                cursor: 'pointer',
                textAlign: 'left' as const,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: !selectedId ? 600 : 400,
                    color: !selectedId ? 'var(--sage)' : 'var(--text-muted)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  None
                </p>
              </div>
              <RadioDot selected={!selectedId} />
            </button>
          )}
          {filtered.map((f, fi) => {
            const isSel = selectedId === f.id;
            const palette = SHEPHERD_AVATAR_PALETTE[fi % SHEPHERD_AVATAR_PALETTE.length];
            const initials = f.label
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const members = people.filter((p) => f.memberIds.includes(p.id));
            return (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.75rem 1.25rem',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isSel ? 'var(--sage)' : palette.bg,
                    color: isSel ? 'var(--on-sage)' : palette.color,
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
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {f.label}
                  </p>
                  {members.length > 0 && (
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {members.map((m) => m.englishName.split(' ')[0]).join(', ')}
                    </p>
                  )}
                </div>
                <RadioDot selected={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '1.5rem 1.25rem',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No families found.
            </p>
          )}
        </div>
    </BottomSheet>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        flexShrink: 0,
        border: selected ? 'none' : '0.09375rem solid var(--border)',
        background: selected ? 'var(--sage)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
      }}
    >
      {selected && <Check size={11} color="var(--on-sage)" weight="bold" />}
    </div>
  );
}
