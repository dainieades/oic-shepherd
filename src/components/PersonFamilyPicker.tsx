'use client';

import React from 'react';
import { type AppData } from '@/lib/types';
import { CaretLeft, MagnifyingGlass, House } from '@phosphor-icons/react';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';
import { AvatarBadge } from './AvatarBadge';
import { CheckboxMark } from './CheckRow';

interface PersonFamilyPickerProps {
  data: AppData;
  initialFamilyIds?: string[];
  initialPersonIds?: string[];
  allowedPersonIds?: string[];
  onConfirm: (familyIds: string[], personIds: string[]) => void;
  onBack: () => void;
}

type PickerItem =
  | { kind: 'family'; id: string; label: string; subtitle: string; photo?: string; paletteIndex: number }
  | { kind: 'person'; id: string; label: string; subtitle?: string; photo?: string; paletteIndex: number };

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
      if (allowedPersonIds && !f.memberIds.some((id) => allowedPersonIds.includes(id))) return false;
      if (!q) return true;
      if (f.label.toLowerCase().includes(q)) return true;
      return data.people
        .filter((p) => f.memberIds.includes(p.id))
        .some(
          (m) =>
            m.englishName.toLowerCase().includes(q) || (m.chineseName && m.chineseName.includes(q))
        );
    })
    .map((f, fi) => ({
      kind: 'family' as const,
      id: f.id,
      label: f.label,
      subtitle: data.people
        .filter((p) => f.memberIds.includes(p.id))
        .map((m) => m.englishName.split(' ')[0])
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
        p.englishName.toLowerCase().includes(q) ||
        (p.chineseName && p.chineseName.includes(q))
      );
    })
    .map((p, pi) => ({
      kind: 'person' as const,
      id: p.id,
      label: p.englishName,
      subtitle: p.chineseName,
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        padding: '1rem 1.25rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--sage)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 14,
            padding: 0,
          }}
        >
          <CaretLeft size={16} />
          Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Select who
        </span>
        <button
          onClick={() => onConfirm(selectedFamilyIds, selectedPersonIds)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: totalSelected > 0 ? 'var(--sage)' : 'var(--text-muted)',
            padding: 0,
          }}
        >
          {totalSelected > 0 ? `Done (${totalSelected})` : 'Done'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5625rem 0.75rem',
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <MagnifyingGlass size={14} color="var(--text-muted)" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search families or people..."
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

      {items.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 6,
            flexShrink: 0,
          }}
        >
          <button
            onClick={toggleAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--sage)',
              padding: 0,
            }}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {items.map((item) => {
          const palette = SHEPHERD_AVATAR_PALETTE[item.paletteIndex % SHEPHERD_AVATAR_PALETTE.length];
          const selected =
            item.kind === 'family'
              ? selectedFamilyIds.includes(item.id)
              : selectedPersonIds.includes(item.id);
          const onToggle = item.kind === 'family'
            ? () => toggleFamily(item.id)
            : () => togglePerson(item.id);

          return (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={onToggle}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.625rem 0',
                borderBottom: '1px solid var(--border-light)',
                background: selected ? 'var(--sage-light)' : 'none',
                border: 'none',
                borderBottomColor: 'var(--border-light)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <AvatarBadge
                name={item.label}
                photo={item.photo}
                size={36}
                bg={selected ? 'var(--sage)' : palette.bg}
                color={selected ? 'var(--on-sage)' : palette.color}
                icon={item.kind === 'family' ? <House size={18} /> : undefined}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                    color: selected ? 'var(--sage)' : 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {item.label}
                </p>
                {item.subtitle && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.subtitle}
                  </p>
                )}
              </div>
              <CheckboxMark checked={selected} />
            </button>
          );
        })}

        {items.length === 0 && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              paddingTop: 16,
            }}
          >
            No results found.
          </p>
        )}
      </div>
    </div>
  );
}
