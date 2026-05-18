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

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-12 bg-bg">
          <DrawerSection label="Details">
            <div
              className="field-row-hover flex items-center gap-2.5 py-3 border-b border-border-light cursor-text"
              onClick={() => nameRef.current?.focus()}
            >
              <span className="w-[10px] text-14 text-red shrink-0 leading-none">*</span>
              <TextT size={16} color="var(--text-muted)" />
              <span className="text-12 text-text-muted w-[60px] shrink-0">Name</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                className="flex-1 bg-transparent border-0 outline-none text-14 text-text-primary"
              />
            </div>
            <div
              className="field-row-hover flex items-start gap-2.5 py-3 border-b border-border-light cursor-text"
              onClick={() => descRef.current?.focus()}
            >
              <span className="w-[10px] shrink-0" />
              <span className="pt-[2px]">
                <AlignLeft size={16} color="var(--text-muted)" />
              </span>
              <span className="text-12 text-text-muted w-[60px] shrink-0 pt-[2px]">About</span>
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description…"
                rows={3}
                className="flex-1 bg-transparent border-0 outline-none text-14 text-text-primary leading-normal resize-none"
              />
            </div>
          </DrawerSection>

          <DrawerSection label="Leaders">
            <button
              className="field-row-hover flex items-center gap-2.5 py-3 border-b border-border-light border-x-0 border-t-0 bg-transparent cursor-pointer text-left w-full"
              onClick={() => setShowLeaderPicker(true)}
            >
              <span className="w-[10px] shrink-0" />
              <Crown size={16} color="var(--blue)" />
              <span className="text-12 text-text-muted w-[60px] shrink-0">Leaders</span>
              <span
                className="flex-1 text-14 text-left"
                style={{ color: selectedLeaders.length ? 'var(--text-primary)' : 'var(--text-muted)' }}
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
              className="field-row-hover flex items-center gap-2.5 py-3 border-b border-border-light border-x-0 border-t-0 bg-transparent cursor-pointer text-left w-full"
              onClick={() => setShowMemberPicker(true)}
            >
              <span className="w-[10px] shrink-0" />
              <UserList size={16} color="var(--text-muted)" />
              <span className="text-12 text-text-muted w-[60px] shrink-0">Members</span>
              <span className="flex-1 text-14 text-text-primary text-left">
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

      <div className="py-2.5 px-4 border-b border-border-light shrink-0">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full py-2 px-3 rounded-xs border border-border text-14 bg-bg text-text-primary outline-none box-border"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
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
              className="w-full flex items-center gap-3 py-2.5 px-5 border-b border-border-light border-x-0 border-t-0 cursor-pointer text-left"
              style={{ background: isSel ? 'var(--sage-light)' : 'transparent' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-12 font-bold shrink-0"
                style={{
                  background: isSel ? 'var(--sage)' : 'var(--sage-light)',
                  color: isSel ? 'var(--on-sage)' : 'var(--sage)',
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-14"
                  style={{
                    fontWeight: isSel ? 'var(--font-semibold)' : 'var(--font-normal)',
                    color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                  }}
                >
                  {fullName(p)}
                </span>
                {p.alternativeName && (
                  <span className="text-12 text-text-muted ml-1.5">
                    {p.alternativeName}
                  </span>
                )}
              </div>
              <div
                className="w-5 h-5 rounded-[5px] shrink-0 flex items-center justify-center transition-[background] duration-150"
                style={{
                  border: isSel ? 'none' : '0.09375rem solid var(--border)',
                  background: isSel ? 'var(--sage)' : 'transparent',
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

