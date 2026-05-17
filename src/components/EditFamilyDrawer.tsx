'use client';

import React from 'react';
import { DrawerSection } from '@/components/form/DrawerSection';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { BottomSheet, ModalHeader, SubPanel } from './BottomSheet';
import { type Family, type Person, type Group } from '@/lib/types';
import {
  CaretRight,
  UsersFour,
  Plus,
  House,
  HandHeart,
  X,
  MagnifyingGlass,
  Check,
} from '@phosphor-icons/react';
import { fullName } from '@/lib/utils';
import { ShepherdPickerSheet } from './PersonPickerSheets';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';

interface Props {
  family: Family;
  onClose: () => void;
}

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
  const [label, setLabel] = React.useState(family.label.replace(/ Family$/i, ''));
  const [memberIds, setMemberIds] = React.useState<string[]>(family.memberIds);
  const [groupIds, setGroupIds] = React.useState<string[]>(initialGroupIds);
  const [shepherdIds, setShepherdIds] = React.useState<string[]>(initialShepherdIds);

  // Picker open state
  const [showMemberPicker, setShowMemberPicker] = React.useState(false);
  const [showGroupPicker, setShowGroupPicker] = React.useState(false);
  const [showShepherdPicker, setShowShepherdPicker] = React.useState(false);

  const labelRef = React.useRef<HTMLInputElement>(null);

  // Derived
  const currentMembers = data.people.filter((p) => memberIds.includes(p.id));

  const handleSave = async () => {
    if (!label.trim()) return;
    await updateFamily(family.id, { label: `${label.trim()} Family` });
    await updateFamilyMembers(family.id, memberIds);
    await assignGroupsToFamily(family.id, groupIds);
    await assignShepherdsToFamily(family.id, shepherdIds);
    showToast('Family updated');
    onClose();
  };

  // All people that can be toggled as members: no family, or already in this family
  const memberPickerPool = data.people.filter((p) => !p.familyId || p.familyId === family.id);

  const selectedGroups = data.groups.filter((g) => groupIds.includes(g.id));
  const shepherdEntries = data.personas
    .filter((p) => p.role === 'shepherd' || p.role === 'admin')
    .map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.role === 'admin' ? 'Pastor' : 'User',
      photo: p.personId ? data.people.find((person) => person.id === p.personId)?.photo : undefined,
    }));
  const selectedShepherds = shepherdEntries.filter((e) => shepherdIds.includes(e.id));

  return (
    <>
      <BottomSheet
        onClose={onClose}
        variant="dialog"
        contentStyle={{ maxWidth: '44rem', width: '100%' }}
        aria-labelledby="edit-family-title"
      >
        <ModalHeader
          title="Edit family"
          titleId="edit-family-title"
          onCancel={onClose}
          onAction={handleSave}
          actionLabel="Save"
        />

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.25rem 3rem',
            background: 'var(--bg)',
          }}
        >
          {/* ── BASIC ── */}
          <DrawerSection label="Basic">
            <div
              className="field-row-hover"
              style={textRowStyle}
              onClick={() => labelRef.current?.focus()}
            >
              <span style={asteriskStyle}>*</span>
              <House size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Last name</span>
              <input
                ref={labelRef}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Chen"
                style={inputInlineStyle}
              />
              <span style={{ fontSize: 15, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Family
              </span>
            </div>
          </DrawerSection>

          {/* ── MEMBERS ── */}
          <DrawerSection label="Members">
            {currentMembers.map((m, i) => {
              const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
              const inits = fullName(m)
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
                    {fullName(m)}
                  </span>
                  <button
                    onClick={() => {
                      setMemberIds(memberIds.filter((x) => x !== m.id));
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--red-light)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    aria-label={`Remove ${fullName(m)}`}
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
            {/* Fellowship Groups */}
            <button
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
                        padding: '0.125rem 0.5rem',
                        borderRadius: 'var(--radius-pill)',
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
                        padding: '0.125rem 0.5rem',
                        borderRadius: 'var(--radius-pill)',
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
      </BottomSheet>

      {/* Member Picker Sheet */}
      {showMemberPicker && (
        <MemberPickerSheet
          pool={memberPickerPool}
          currentMemberIds={memberIds}
          onConfirm={(ids) => {
            setMemberIds(ids);
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
          entries={shepherdEntries}
          currentIds={shepherdIds}
          onConfirm={(ids) => {
            setShepherdIds(ids);
            setShowShepherdPicker(false);
          }}
          onBack={() => setShowShepherdPicker(false)}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

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
      fullName(p).toLowerCase().includes(q) ||
      (p.alternativeName && p.alternativeName.toLowerCase().includes(q))
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Members"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="pill"
      />

        {/* Search */}
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

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((p, i) => {
            const isSel = selectedIds.includes(p.id);
            const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
            const inits = fullName(p)
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
                    {fullName(p)}
                  </p>
                  {p.alternativeName && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      {p.alternativeName}
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
                padding: '1.5rem 1.25rem',
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
    </SubPanel>
  );
}

function MemberCheckCircle({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
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
    <SubPanel onBack={onBack}>
      <ModalHeader
        title="Fellowship Groups"
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="pill"
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
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    flexShrink: 0,
                    border: isSel ? 'none' : '0.09375rem solid var(--border)',
                    background: isSel ? 'var(--blue)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  {isSel && <Check size={11} color="var(--surface)" weight="bold" />}
                </div>
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
    </SubPanel>
  );
}
