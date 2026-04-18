'use client';

import { useState } from 'react';
import { type AppData } from '@/lib/types';
import { CaretLeft, MagnifyingGlass, Check } from '@phosphor-icons/react';

interface PersonFamilyPickerProps {
  data: AppData;
  initialFamilyIds?: string[];
  initialPersonIds?: string[];
  onConfirm: (familyIds: string[], personIds: string[]) => void;
  onBack: () => void;
}

const avatarPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];

export default function PersonFamilyPicker({
  data,
  initialFamilyIds = [],
  initialPersonIds = [],
  onConfirm,
  onBack,
}: PersonFamilyPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>(initialFamilyIds);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(initialPersonIds);

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

  const families = data.families.filter((f) => {
    if (!q) return true;
    if (f.label.toLowerCase().includes(q)) return true;
    return data.people
      .filter((p) => f.memberIds.includes(p.id))
      .some(
        (m) =>
          m.englishName.toLowerCase().includes(q) || (m.chineseName && m.chineseName.includes(q))
      );
  });

  const individuals = data.people.filter((p) => {
    if (p.familyId) return false;
    if (!q) return true;
    return p.englishName.toLowerCase().includes(q) || (p.chineseName && p.chineseName.includes(q));
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        padding: '16px 20px 0',
      }}
    >
      {/* Header */}
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

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '9px 12px',
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <MagnifyingGlass size={14} color="var(--text-muted)" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search families or people…"
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

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {families.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              Families
            </p>
            {families.map((f, fi) => {
              const members = data.people.filter((p) => f.memberIds.includes(p.id));
              const palette = avatarPalette[fi % avatarPalette.length];
              const initials = f.label
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const selected = selectedFamilyIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFamily(f.id)}
                  className="picker-row"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderBottom: '1px solid var(--border-light)',
                    background: selected ? 'var(--sage-light)' : 'none',
                    border: 'none',
                    borderBottomColor: 'var(--border-light)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: palette.bg,
                      color: palette.color,
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
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 1,
                      }}
                    >
                      {f.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {members.map((m) => m.englishName.split(' ')[0]).join(', ')}
                    </p>
                  </div>
                  <CheckCircle selected={selected} />
                </button>
              );
            })}
          </div>
        )}

        {individuals.length > 0 && (
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              Individuals
            </p>
            {individuals.map((p, pi) => {
              const palette = avatarPalette[pi % avatarPalette.length];
              const initials = p.englishName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const selected = selectedPersonIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePerson(p.id)}
                  className="picker-row"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderBottom: '1px solid var(--border-light)',
                    background: selected ? 'var(--sage-light)' : 'none',
                    border: 'none',
                    borderBottomColor: 'var(--border-light)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: palette.bg,
                      color: palette.color,
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
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 1,
                      }}
                    >
                      {p.englishName}
                    </p>
                    {p.chineseName && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.chineseName}</p>
                    )}
                  </div>
                  <CheckCircle selected={selected} />
                </button>
              );
            })}
          </div>
        )}

        {families.length === 0 && individuals.length === 0 && (
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

function CheckCircle({ selected }: { selected: boolean }) {
  return selected ? (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'var(--sage)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={12} color="#fff" weight="bold" />
    </div>
  ) : (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        border: '2px solid var(--border)',
        background: 'transparent',
      }}
    />
  );
}
