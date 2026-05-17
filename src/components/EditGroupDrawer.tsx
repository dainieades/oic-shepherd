'use client';

import React from 'react';
import { BottomSheet, ModalHeader } from '@/components/BottomSheet';
import { DrawerSection } from '@/components/form/DrawerSection';
import {
  TextT,
  AlignLeft,
  UserList,
  CaretRight,
  Crown,
  Check,
} from '@phosphor-icons/react';
import { Z_SHEET } from '@/lib/constants';
import { useApp } from '@/lib/context';
import { fullName } from '@/lib/utils';
import type { Group, Person } from '@/lib/types';

interface Props {
  group: Group;
  onClose: () => void;
  onSave: (
    updates: Partial<Pick<Group, 'name' | 'description' | 'leaderIds'>>,
    memberIds: string[]
  ) => void;
}

export default function EditGroupDrawer({ group, onClose, onSave }: Props) {
  const { data } = useApp();

  const [name, setName] = React.useState(group.name);
  const [description, setDesc] = React.useState(group.description ?? '');
  const [leaderIds, setLeaderIds] = React.useState<string[]>(group.leaderIds);
  const [memberIds, setMemberIds] = React.useState<string[]>(group.memberIds);

  const [showLeaderPicker, setShowLeaderPicker] = React.useState(false);
  const [showMemberPicker, setShowMemberPicker] = React.useState(false);

  const nameRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  const selectedLeaders = data.people.filter((p) => leaderIds.includes(p.id));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(
      { name: name.trim(), description: description.trim() || undefined, leaderIds },
      memberIds
    );
  };

  return (
    <>
      <BottomSheet onClose={onClose}>
        <ModalHeader
          title="Edit group"
          onCancel={onClose}
          onAction={handleSave}
          actionLabel="Save"
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.25rem 3rem',
            background: 'var(--bg)',
          }}
        >
          <DrawerSection label="Details">
            <div
              className="field-row-hover"
              style={textRowStyle}
              onClick={() => nameRef.current?.focus()}
            >
              <span style={asteriskStyle}>*</span>
              <TextT size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Name</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                style={inputStyle}
              />
            </div>
            <div
              className="field-row-hover"
              style={{ ...textRowStyle, alignItems: 'flex-start' }}
              onClick={() => descRef.current?.focus()}
            >
              <span style={spacerStyle} />
              <span style={{ paddingTop: 2 }}>
                <AlignLeft size={16} color="var(--text-muted)" />
              </span>
              <span style={{ ...labelStyle, paddingTop: 2 }}>About</span>
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description…"
                rows={3}
                style={{ ...inputStyle, resize: 'none', lineHeight: 'var(--leading-normal)' }}
              />
            </div>
          </DrawerSection>

          <DrawerSection label="Leaders">
            <button
              className="field-row-hover"
              onClick={() => setShowLeaderPicker(true)}
              style={pickerRowStyle}
            >
              <span style={spacerStyle} />
              <Crown size={16} color="var(--blue)" />
              <span style={labelStyle}>Leaders</span>
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--text-14)',
                  color: selectedLeaders.length ? 'var(--text-primary)' : 'var(--text-muted)',
                  textAlign: 'left',
                }}
              >
                {selectedLeaders.length === 0
                  ? 'None'
                  : selectedLeaders.map((p) => p.preferredName).join(', ')}
              </span>
              <CaretRight size={14} color="var(--text-muted)" />
            </button>
          </DrawerSection>

          <DrawerSection label="Members">
            <button
              className="field-row-hover"
              onClick={() => setShowMemberPicker(true)}
              style={pickerRowStyle}
            >
              <span style={spacerStyle} />
              <UserList size={16} color="var(--text-muted)" />
              <span style={labelStyle}>Members</span>
              <span
                style={{ flex: 1, fontSize: 'var(--text-14)', color: 'var(--text-primary)', textAlign: 'left' }}
              >
                {memberIds.length} {memberIds.length === 1 ? 'person' : 'people'}
              </span>
              <CaretRight size={14} color="var(--text-muted)" />
            </button>
          </DrawerSection>
        </div>
      </BottomSheet>

      {showLeaderPicker && (
        <PeoplePickerSheet
          title="Leaders"
          people={data.people}
          selected={leaderIds}
          onConfirm={(ids) => {
            setLeaderIds(ids);
            setShowLeaderPicker(false);
          }}
          onBack={() => setShowLeaderPicker(false)}
        />
      )}

      {showMemberPicker && (
        <PeoplePickerSheet
          people={data.people}
          selected={memberIds}
          onConfirm={(ids) => {
            setMemberIds(ids);
            setShowMemberPicker(false);
          }}
          onBack={() => setShowMemberPicker(false)}
        />
      )}
    </>
  );
}

function PeoplePickerSheet({
  title,
  people,
  selected,
  onConfirm,
  onBack,
}: {
  title?: string;
  people: Person[];
  selected: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>(selected);

  const filtered = people.filter(
    (p) =>
      search === '' ||
      fullName(p).toLowerCase().includes(search.toLowerCase()) ||
      (p.alternativeName ?? '').includes(search)
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <BottomSheet onClose={onBack} zIndex={Z_SHEET}>
      <ModalHeader
        title={title ?? 'Members'}
        onCancel={onBack}
        cancelLabel="Back"
        onAction={() => onConfirm(selectedIds)}
        actionLabel={selectedIds.length > 0 ? `Done (${selectedIds.length})` : 'Done'}
        actionVariant="pill"
      />

      <div
        style={{
          padding: '0.625rem 1rem',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
        }}
      >
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border)',
            fontSize: 'var(--text-14)',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((p) => {
          const isSel = selectedIds.includes(p.id);
          const initials = fullName(p)
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
                padding: '0.625rem 1.25rem',
                background: isSel ? 'var(--sage-light)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-light)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isSel ? 'var(--sage)' : 'var(--sage-light)',
                  color: isSel ? 'var(--on-sage)' : 'var(--sage)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-12)',
                  fontWeight: 'var(--font-bold)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 'var(--text-14)',
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {fullName(p)}
                </span>
                {p.alternativeName && (
                  <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)', marginLeft: 6 }}>
                    {p.alternativeName}
                  </span>
                )}
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  flexShrink: 0,
                  border: isSel ? 'none' : '0.09375rem solid var(--border)',
                  background: isSel ? 'var(--sage)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {isSel && <Check size={11} color="var(--on-sage)" weight="bold" />}
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

const textRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
  borderBottom: '1px solid var(--border-light)',
  cursor: 'text',
};

const pickerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
  border: 'none',
  borderBottom: '1px solid var(--border-light)',
  background: 'none',
  cursor: 'pointer',
  textAlign: 'left' as const,
  width: '100%',
};

const asteriskStyle: React.CSSProperties = {
  width: 10,
  fontSize: 'var(--text-14)',
  color: 'var(--red)',
  flexShrink: 0,
  lineHeight: 'var(--leading-none)',
};
const spacerStyle: React.CSSProperties = { width: 10, flexShrink: 0 };
const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-12)',
  color: 'var(--text-muted)',
  width: 60,
  flexShrink: 0,
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 'var(--text-14)',
  color: 'var(--text-primary)',
};
