'use client';

import React from 'react';
import { type AppData } from '@/lib/types';
import { CaretLeft, MagnifyingGlass, House } from '@phosphor-icons/react';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';
import { AvatarBadge } from './AvatarBadge';
import { CheckboxMark } from './CheckRow';
import { fullName } from '@/lib/utils';

interface PersonFamilyPickerProps {
  data: AppData;
  initialFamilyIds?: string[];
  initialPersonIds?: string[];
  allowedPersonIds?: string[];
  onConfirm: (familyIds: string[], personIds: string[]) => void;
  onBack: () => void;
}

type PickerItem =
  | {
      kind: 'family';
      id: string;
      label: string;
      subtitle: string;
      photo?: string;
      paletteIndex: number;
    }
  | {
      kind: 'person';
      id: string;
      label: string;
      subtitle?: string;
      photo?: string;
      paletteIndex: number;
    };

export default function PersonFamilyPicker({
  data,
  initialFamilyIds = [],
  initialPersonIds = [],
  allowedPersonIds,
  onConfirm,
  onBack,
}: PersonFamilyPickerProps) {
  const [search, setSearch] = React.useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = React.useState<string[]>(initialFamilyIds);
  const [selectedPersonIds, setSelectedPersonIds] = React.useState<string[]>(initialPersonIds);

  const totalSelected = selectedFamilyIds.length + selectedPersonIds.length;
  const q = search.toLowerCase();

  const toggleFamily = (id: string) =>
    setSelectedFamilyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const togglePerson = (id: string) =>
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const familyItems: PickerItem[] = data.families
    .filter((f) => {
      if (allowedPersonIds && !f.memberIds.some((id) => allowedPersonIds.includes(id)))
        return false;
      if (!q) return true;
      if (f.label.toLowerCase().includes(q)) return true;
      return data.people
        .filter((p) => f.memberIds.includes(p.id))
        .some(
          (m) =>
            fullName(m).toLowerCase().includes(q) ||
            (m.alternativeName && m.alternativeName.includes(q))
        );
    })
    .map((f, fi) => ({
      kind: 'family' as const,
      id: f.id,
      label: f.label,
      subtitle: data.people
        .filter((p) => f.memberIds.includes(p.id))
        .map((m) => m.preferredName)
        .join(', '),
      photo: f.photo,
      paletteIndex: fi,
    }));

  const personItems: PickerItem[] = data.people
    .filter((p) => {
      if (p.familyId) return false;
      if (allowedPersonIds && !allowedPersonIds.includes(p.id)) return false;
      if (!q) return true;
      return (
        fullName(p).toLowerCase().includes(q) ||
        (p.alternativeName && p.alternativeName.includes(q))
      );
    })
    .map((p, pi) => ({
      kind: 'person' as const,
      id: p.id,
      label: fullName(p),
      subtitle: p.alternativeName,
      photo: p.photo,
      paletteIndex: pi,
    }));

  const items: PickerItem[] = [...familyItems, ...personItems];

  const allFamilyIds = familyItems.map((f) => f.id);
  const allPersonIds = personItems.map((p) => p.id);
  const allSelected =
    items.length > 0 &&
    allFamilyIds.every((id) => selectedFamilyIds.includes(id)) &&
    allPersonIds.every((id) => selectedPersonIds.includes(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedFamilyIds((prev) => prev.filter((id) => !allFamilyIds.includes(id)));
      setSelectedPersonIds((prev) => prev.filter((id) => !allPersonIds.includes(id)));
    } else {
      setSelectedFamilyIds((prev) => [...new Set([...prev, ...allFamilyIds])]);
      setSelectedPersonIds((prev) => [...new Set([...prev, ...allPersonIds])]);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 px-5 pt-4">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={onBack}
          className="bg-transparent border-0 cursor-pointer text-sage flex items-center gap-1 text-14 p-0"
        >
          <CaretLeft size={16} />
          Back
        </button>
        <span className="text-15 font-semibold text-text-primary">
          Select who
        </span>
        <button
          onClick={() => onConfirm(selectedFamilyIds, selectedPersonIds)}
          className="bg-transparent border-0 cursor-pointer text-14 font-semibold p-0"
          style={{ color: totalSelected > 0 ? 'var(--sage)' : 'var(--text-muted)' }}
        >
          {totalSelected > 0 ? `Done (${totalSelected})` : 'Done'}
        </button>
      </div>

      <div
        className="flex items-center gap-2 bg-bg border border-border rounded-sm mb-2 shrink-0"
        style={{ padding: '0.5625rem 0.75rem' }}
      >
        <MagnifyingGlass size={14} color="var(--text-muted)" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search families or people..."
          className="flex-1 text-14 text-text-primary bg-transparent border-0 outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="bg-transparent border-0 cursor-pointer text-text-muted text-18 leading-none p-0"
          >
            ×
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex justify-end mb-1.5 shrink-0">
          <button
            onClick={toggleAll}
            className="bg-transparent border-0 cursor-pointer text-12 font-semibold text-sage p-0"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {items.map((item) => {
          const palette =
            SHEPHERD_AVATAR_PALETTE[item.paletteIndex % SHEPHERD_AVATAR_PALETTE.length];
          const selected =
            item.kind === 'family'
              ? selectedFamilyIds.includes(item.id)
              : selectedPersonIds.includes(item.id);
          const onToggle =
            item.kind === 'family' ? () => toggleFamily(item.id) : () => togglePerson(item.id);

          return (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={onToggle}
              className="w-full flex items-center gap-3 py-2.5 border-b border-border-light cursor-pointer text-left border-x-0 border-t-0"
              style={{ background: selected ? 'var(--sage-light)' : 'transparent' }}
            >
              <AvatarBadge
                name={item.label}
                photo={item.photo}
                size={36}
                bg={selected ? 'var(--sage)' : palette.bg}
                color={selected ? 'var(--on-sage)' : palette.color}
                icon={item.kind === 'family' ? <House size={18} /> : undefined}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="m-0 text-14"
                  style={{
                    fontWeight: selected ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: selected ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {item.label}
                </p>
                {item.subtitle && (
                  <p className="m-0 text-12 text-text-muted truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <CheckboxMark checked={selected} />
            </button>
          );
        })}

        {items.length === 0 && (
          <p className="text-13 text-text-muted italic pt-4">
            No results found.
          </p>
        )}
      </div>
    </div>
  );
}
