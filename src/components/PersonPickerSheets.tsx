'use client';

import React from 'react';
import { MagnifyingGlass, Check, IdentificationCard } from '@phosphor-icons/react';
import { CheckboxMark } from './CheckRow';
import { SHEPHERD_AVATAR_PALETTE, Z_SHEET } from '@/lib/constants';
import { CHURCH_POSITIONS } from '@/lib/types';
import { AvatarBadge } from './AvatarBadge';
import { BottomSheet, ModalHeader, SubPanel } from './BottomSheet';
import { fullName } from '@/lib/utils';

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
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Fellowship Groups"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="pill"
      />
      <div className="py-3 px-5 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2 bg-bg border border-border rounded-sm" style={{ padding: '0.5625rem 0.75rem' }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 text-14 text-text-primary bg-transparent border-none outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-text-muted text-18 leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((g) => {
          const isSel = selectedIds.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className="w-full flex items-center gap-3 py-3 px-5 border-none border-b border-border-light cursor-pointer text-left"
              style={{ background: isSel ? 'var(--blue-light)' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-14 m-0"
                  style={{
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--blue)' : 'var(--text-primary)',
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
          <p className="py-6 px-5 text-13 text-text-muted text-center italic">
            No groups found.
          </p>
        )}
      </div>
    </SubPanel>
  );
}

export function SheepPickerSheet({
  people,
  currentIds,
  onConfirm,
  onBack,
}: {
  people: {
    id: string;
    preferredName: string;
    lastName?: string;
    alternativeName?: string;
    photo?: string;
  }[];
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
      fullName(p).toLowerCase().includes(q) ||
      (p.alternativeName && p.alternativeName.toLowerCase().includes(q))
  );
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Sheep"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="pill"
      />
      <div className="py-3 px-5 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2 bg-bg border border-border rounded-sm" style={{ padding: '0.5625rem 0.75rem' }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="flex-1 text-14 text-text-primary bg-transparent border-none outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-text-muted text-18 leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-13 text-text-muted italic pt-6 text-center">
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
              className="w-full flex items-center gap-3 py-3 px-5 border-none border-b border-border-light cursor-pointer text-left"
              style={{ background: isSel ? 'var(--sage-light)' : 'none' }}
            >
              <AvatarBadge
                name={fullName(p)}
                photo={p.photo}
                size={36}
                bg={isSel ? 'var(--sage)' : palette.bg}
                color={isSel ? 'var(--on-sage)' : palette.color}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-14 m-0"
                  style={{
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {fullName(p)}
                </p>
                {p.alternativeName && (
                  <p className="text-11 text-text-muted m-0">
                    {p.alternativeName}
                  </p>
                )}
              </div>
              <CheckboxMark checked={isSel} />
            </button>
          );
        })}
      </div>
    </SubPanel>
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
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Shepherd"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="pill"
      />
      <div className="py-3 px-5 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2 bg-bg border border-border rounded-sm" style={{ padding: '0.5625rem 0.75rem' }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shepherds…"
            className="flex-1 text-14 text-text-primary bg-transparent border-none outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-text-muted text-18 leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((entry, i) => {
          const isSel = selectedIds.includes(entry.id);
          const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
          return (
            <button
              key={entry.id}
              onClick={() => toggle(entry.id)}
              className="w-full flex items-center gap-3 py-3 px-5 border-none border-b border-border-light cursor-pointer text-left"
              style={{ background: isSel ? 'var(--sage-light)' : 'none' }}
            >
              <AvatarBadge
                name={entry.name}
                photo={entry.photo}
                size={36}
                bg={isSel ? 'var(--sage)' : palette.bg}
                color={isSel ? 'var(--on-sage)' : palette.color}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-14 m-0"
                  style={{
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {entry.name}
                </p>
                <p className="text-11 text-text-muted m-0">
                  {entry.subtitle}
                </p>
              </div>
              <CheckboxMark checked={isSel} />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 px-5 text-13 text-text-muted text-center italic">
            No shepherds found.
          </p>
        )}
      </div>
    </SubPanel>
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
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Church Position"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedPositions)}
        actionLabel={selectedPositions.length > 0 ? `Done (${selectedPositions.length})` : 'Done'}
        actionVariant="pill"
      />
      <div className="py-3 px-5 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2 bg-bg border border-border rounded-sm" style={{ padding: '0.5625rem 0.75rem' }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search positions…"
            className="flex-1 text-14 text-text-primary bg-transparent border-none outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-text-muted text-18 leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((pos) => {
          const isSel = selectedPositions.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => toggle(pos)}
              className="w-full flex items-center gap-3 py-3 px-5 border-none border-b border-border-light cursor-pointer text-left"
              style={{ background: isSel ? 'var(--sage-light)' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-14 m-0"
                  style={{
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--sage)' : 'var(--text-primary)',
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
          <p className="py-6 px-5 text-13 text-text-muted text-center italic">
            No positions found.
          </p>
        )}
      </div>
    </SubPanel>
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
  people: { id: string; preferredName: string; lastName?: string }[];
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
      .some((m) => fullName(m).toLowerCase().includes(q));
  });

  return (
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Family"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedId)}
        actionLabel="Done"
        actionVariant="pill"
      />
      <div className="py-3 px-5 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2 bg-bg border border-border rounded-sm" style={{ padding: '0.5625rem 0.75rem' }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search families…"
            className="flex-1 text-14 text-text-primary bg-transparent border-none outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-text-muted text-18 leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!q && (
          <button
            onClick={() => setSelectedId(undefined)}
            className="w-full flex items-center gap-3 py-3 px-5 border-none border-b border-border-light cursor-pointer text-left"
            style={{ background: !selectedId ? 'var(--sage-light)' : 'none' }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-14 m-0 italic"
                style={{
                  fontWeight: !selectedId ? 'var(--font-semibold)' : 'var(--font-normal)',
                  color: !selectedId ? 'var(--sage)' : 'var(--text-muted)',
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
              className="w-full flex items-center gap-3 py-3 px-5 border-none border-b border-border-light cursor-pointer text-left"
              style={{ background: isSel ? 'var(--sage-light)' : 'none' }}
            >
              <div
                className="shrink-0 flex items-center justify-center text-12 font-bold rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  background: isSel ? 'var(--sage)' : palette.bg,
                  color: isSel ? 'var(--on-sage)' : palette.color,
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-14 m-0"
                  style={{
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {f.label}
                </p>
                {members.length > 0 && (
                  <p className="text-11 text-text-muted m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {members.map((m) => m.preferredName).join(', ')}
                  </p>
                )}
              </div>
              <RadioDot selected={isSel} />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 px-5 text-13 text-text-muted text-center italic">
            No families found.
          </p>
        )}
      </div>
    </SubPanel>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full [transition:background_0.15s]"
      style={{
        width: 20,
        height: 20,
        border: selected ? 'none' : '0.09375rem solid var(--border)',
        background: selected ? 'var(--sage)' : 'transparent',
      }}
    >
      {selected && <Check size={11} color="var(--on-sage)" weight="bold" />}
    </div>
  );
}

export function InvitePersonPickerSheet({
  people,
  onSelect,
  onBack,
}: {
  people: {
    id: string;
    preferredName: string;
    lastName?: string;
    alternativeName?: string;
    photo?: string;
    appRole?: string;
  }[];
  onSelect: (person: { id: string; preferredName: string; lastName?: string }) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = people.filter(
    (p) =>
      !q ||
      fullName(p).toLowerCase().includes(q) ||
      (p.alternativeName && p.alternativeName.toLowerCase().includes(q))
  );

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <div className="flex items-center pt-3.5 px-5 pb-3 shrink-0 border-b border-border-light">
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer text-14 text-text-secondary p-0 mr-auto"
        >
          Cancel
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-15 font-semibold text-text-primary">
          Who are you inviting?
        </span>
      </div>
      <div className="py-3 px-5 shrink-0 border-b border-border-light">
        <div className="flex items-center gap-2 bg-bg border border-border rounded-sm" style={{ padding: '0.5625rem 0.75rem' }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="flex-1 text-14 text-text-primary bg-transparent border-none outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer text-text-muted text-18 leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((p, i) => {
          const hasAccess = p.appRole && p.appRole !== 'no-access';
          const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 py-3 px-5 bg-transparent border-none border-b border-border-light cursor-pointer text-left"
            >
              <AvatarBadge
                name={fullName(p)}
                photo={p.photo}
                size={36}
                bg={palette.bg}
                color={palette.color}
              />
              <div className="flex-1 min-w-0">
                <p className="text-14 font-medium text-text-primary m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {fullName(p)}
                  {p.alternativeName && (
                    <span className="text-text-muted font-normal ml-1.5">
                      {p.alternativeName}
                    </span>
                  )}
                </p>
                {hasAccess && (
                  <p className="text-12 text-text-muted flex items-center gap-1" style={{ margin: '0.125rem 0 0' }}>
                    <IdentificationCard size={12} />
                    Already has access
                  </p>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-14 text-text-muted text-center py-8 px-5">
            No people found
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
