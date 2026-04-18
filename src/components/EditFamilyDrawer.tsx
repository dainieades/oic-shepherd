'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { type Family, type Person, type Group } from '@/lib/types';
import {
  CaretRight,
  User,
  UsersFour,
  Plus,
  House,
  HandHeart,
  X,
  MagnifyingGlass,
  Check,
} from '@phosphor-icons/react';
import PickerMenu from './PickerMenu';

interface Props {
  family: Family;
  onClose: () => void;
}

const avatarPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];

export default function EditFamilyDrawer({ family, onClose }: Props) {
  const { data, updateFamily, updateFamilyMembers, assignGroupsToFamily, assignShepherdsToFamily } =
    useApp();
  const { showToast } = useToast();

  // Compute initial state from members
  const initialMembers = data.people.filter((p) => family.memberIds.includes(p.id));
  const initialGroupIds = Array.from(new Set(initialMembers.flatMap((m) => m.groupIds)));
  const initialShepherdIds = Array.from(
    new Set(initialMembers.flatMap((m) => m.assignedShepherdIds))
  );

  // State
  const [label, setLabel] = React.useState(family.label);
  const [memberIds, setMemberIds] = React.useState<string[]>(family.memberIds);
  const [primaryContactId, setPrimaryContactId] = React.useState<string>(
    family.primaryContactId ?? family.memberIds[0] ?? ''
  );
  const [groupIds, setGroupIds] = React.useState<string[]>(initialGroupIds);
  const [shepherdIds, setShepherdIds] = React.useState<string[]>(initialShepherdIds);

  // Picker open state
  const [showMemberPicker, setShowMemberPicker] = React.useState(false);
  const [showPrimaryContactPicker, setShowPrimaryContactPicker] = React.useState(false);
  const [showGroupPicker, setShowGroupPicker] = React.useState(false);
  const groupBtnRef = React.useRef<HTMLButtonElement>(null);
  const [showShepherdPicker, setShowShepherdPicker] = React.useState(false);

  const labelRef = React.useRef<HTMLInputElement>(null);

  // Derived
  const currentMembers = data.people.filter((p) => memberIds.includes(p.id));
  const primaryContact = currentMembers.find((m) => m.id === primaryContactId);

  const handleSave = async () => {
    if (!label.trim()) return;
    await updateFamily(family.id, {
      label: label.trim(),
      primaryContactId: primaryContactId || undefined,
    });
    await updateFamilyMembers(family.id, memberIds);
    await assignGroupsToFamily(family.id, groupIds);
    await assignShepherdsToFamily(family.id, shepherdIds);
    showToast('Family updated');
    onClose();
  };

  const toggleShepherd = (id: string) => {
    setShepherdIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // All people that can be toggled as members: no family, or already in this family
  const memberPickerPool = data.people.filter((p) => !p.familyId || p.familyId === family.id);

  const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));
  const selectedShepherds = data.personas.filter((p) => shepherdIds.includes(p.id));

  const primaryContactOptions = [
    { value: '', label: 'Not set' },
    ...currentMembers.map((m) => ({ value: m.id, label: m.englishName })),
  ];

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30,26,24,0.45)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            width: '100%',
            maxWidth: 430,
            height: 'calc(100dvh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 36,
              height: 4,
              background: 'var(--border)',
              borderRadius: 2,
              margin: '14px auto 0',
              flexShrink: 0,
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px 12px',
              flexShrink: 0,
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <button
              onClick={onClose}
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Edit family
            </span>
            <button
              onClick={handleSave}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--sage)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 48px' }}>
            {/* ── BASIC ── */}
            <DrawerSection label="Basic">
              <div
                className="field-row-hover"
                style={textRowStyle}
                onClick={() => labelRef.current?.focus()}
              >
                <span style={asteriskStyle}>*</span>
                <House size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Name</span>
                <input
                  ref={labelRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Chen Family"
                  style={inputInlineStyle}
                />
              </div>
            </DrawerSection>

            {/* ── MEMBERS ── */}
            <DrawerSection label="Members">
              {currentMembers.map((m, i) => {
                const palette = avatarPalette[i % avatarPalette.length];
                const inits = m.englishName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={m.id}
                    className="field-row-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 10,
                      paddingBottom: 10,
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: palette.bg,
                        color: palette.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {inits}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>
                      {m.englishName}
                    </span>
                    <button
                      onClick={() => {
                        const remaining = memberIds.filter((x) => x !== m.id);
                        setMemberIds(remaining);
                        if (primaryContactId === m.id) setPrimaryContactId(remaining[0] ?? '');
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#FEE2E2',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      aria-label={`Remove ${m.englishName}`}
                    >
                      <X size={12} color="#EF4444" />
                    </button>
                  </div>
                );
              })}
              {/* Add / edit members row */}
              <button
                className="field-row-hover"
                onClick={() => setShowMemberPicker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  background: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left' as const,
                }}
              >
                <span style={spacerStyle} />
                <Plus size={16} color="var(--sage)" />
                <span style={{ fontSize: 14, color: 'var(--sage)', fontWeight: 500 }}>
                  Add member
                </span>
              </button>
            </DrawerSection>

            {/* ── CHURCH ── */}
            <DrawerSection label="Church">
              {/* Primary Contact */}
              <button
                className="field-row-hover"
                onClick={() => setShowPrimaryContactPicker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  background: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left' as const,
                }}
              >
                <span style={spacerStyle} />
                <User size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Primary</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: primaryContact ? 'var(--text-primary)' : 'var(--text-muted)',
                    textAlign: 'left',
                  }}
                >
                  {primaryContact ? primaryContact.englishName : 'Not set'}
                </span>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>

              {/* Fellowship Groups */}
              <button
                ref={groupBtnRef}
                className="field-row-hover"
                onClick={() => setShowGroupPicker((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  background: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left' as const,
                }}
              >
                <span style={spacerStyle} />
                <UsersFour size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Groups</span>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selectedGroups.length > 0 ? (
                    selectedGroups.map((g) => (
                      <span
                        key={g.id}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'var(--blue-light)',
                          color: 'var(--blue)',
                          flexShrink: 0,
                        }}
                      >
                        {g.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                  )}
                </div>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>

              {/* Shepherds */}
              <button
                className="field-row-hover"
                onClick={() => setShowShepherdPicker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  background: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left' as const,
                }}
              >
                <span style={spacerStyle} />
                <HandHeart size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Shepherd</span>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selectedShepherds.length > 0 ? (
                    selectedShepherds.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'var(--sage-light)',
                          color: 'var(--sage)',
                          flexShrink: 0,
                        }}
                      >
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None</span>
                  )}
                </div>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
            </DrawerSection>
          </div>
        </div>
      </div>

      {/* Primary Contact Picker */}
      {showPrimaryContactPicker && (
        <PickerMenu
          title="Primary Contact"
          options={primaryContactOptions}
          value={primaryContactId}
          onSelect={(v) => setPrimaryContactId(v)}
          onClose={() => setShowPrimaryContactPicker(false)}
        />
      )}

      {/* Member Picker Sheet */}
      {showMemberPicker && (
        <MemberPickerSheet
          pool={memberPickerPool}
          currentMemberIds={memberIds}
          onConfirm={(ids) => {
            setMemberIds(ids);
            // If the current primary contact was removed, reset to first remaining member
            if (!ids.includes(primaryContactId)) setPrimaryContactId(ids[0] ?? '');
            setShowMemberPicker(false);
          }}
          onBack={() => setShowMemberPicker(false)}
        />
      )}

      {/* Group Picker */}
      {showGroupPicker && (
        <GroupPickerSheet
          groups={data.groups}
          currentIds={groupIds}
          onConfirm={(ids) => {
            setGroupIds(ids);
            setShowGroupPicker(false);
          }}
          onBack={() => setShowGroupPicker(false)}
        />
      )}

      {/* Shepherd Picker Sheet */}
      {showShepherdPicker && (
        <ShepherdPickerSheet
          personas={data.personas}
          selected={shepherdIds}
          onToggle={toggleShepherd}
          onDone={() => setShowShepherdPicker(false)}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const textRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
  borderBottom: '1px solid var(--border-light)',
  cursor: 'text',
};

const asteriskStyle: React.CSSProperties = {
  width: 10,
  fontSize: 14,
  color: 'var(--red)',
  flexShrink: 0,
  lineHeight: 1,
};

const spacerStyle: React.CSSProperties = {
  width: 10,
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  width: 60,
  flexShrink: 0,
};

const inputInlineStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  color: 'var(--text-primary)',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 4,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={sectionLabelStyle}>{label}</p>
      {children}
    </div>
  );
}

function MemberPickerSheet({
  pool,
  currentMemberIds,
  onConfirm,
  onBack,
}: {
  pool: Person[];
  currentMemberIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentMemberIds);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filtered = pool.filter(
    (p) =>
      !q ||
      p.englishName.toLowerCase().includes(q) ||
      (p.chineseName && p.chineseName.toLowerCase().includes(q))
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: 430,
          height: 'calc(100dvh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Members
          </span>
          <button
            onClick={() => onConfirm(selectedIds)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            padding: '12px 20px',
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
              borderRadius: 10,
              padding: '9px 12px',
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

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((p, i) => {
            const isSel = selectedIds.includes(p.id);
            const palette = avatarPalette[i % avatarPalette.length];
            const inits = p.englishName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
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
                    background: palette.bg,
                    color: palette.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {inits}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: 'var(--text-primary)',
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
                <MemberCheckCircle selected={isSel} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '24px 20px',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              No people found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberCheckCircle({ selected }: { selected: boolean }) {
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

function GroupPickerSheet({
  groups,
  currentIds,
  onConfirm,
  onBack,
}: {
  groups: Group[];
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: 430,
          height: 'calc(100dvh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 12px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Fellowship Groups
          </span>
          <button
            onClick={() => onConfirm(selectedIds)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--sage)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
          </button>
        </div>
        <div
          style={{
            padding: '12px 20px',
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
              borderRadius: 10,
              padding: '9px 12px',
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
                  padding: '12px 20px',
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
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    flexShrink: 0,
                    border: isSel ? 'none' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--blue)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {isSel && <Check size={11} color="#fff" weight="bold" />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                padding: '24px 20px',
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
      </div>
    </div>
  );
}

function ShepherdPickerSheet({
  personas,
  selected,
  onToggle,
  onDone,
}: {
  personas: import('@/lib/types').Persona[];
  selected: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(30,26,24,0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDone();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: 430,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '12px auto 0',
          }}
        />
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '12px 20px 10px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          Assign Shepherd
        </p>
        {personas.map((p) => {
          const isSel = selected.includes(p.id);
          const initials = p.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: isSel ? 'var(--sage-light)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-light)',
                cursor: 'pointer',
                textAlign: 'left' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isSel ? 'var(--sage)' : 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSel ? '#fff' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {p.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      margin: 0,
                      textTransform: 'capitalize',
                    }}
                  >
                    {p.role}
                  </p>
                </div>
              </div>
              {isSel && <Check size={16} color="var(--sage)" weight="bold" />}
            </button>
          );
        })}
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={onDone}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 12,
              background: 'var(--sage)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
