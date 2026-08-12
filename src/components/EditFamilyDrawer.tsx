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

  // Capture initial state once for dirty tracking
  const initialStateRef = React.useRef({
    label: family.label.replace(/ Family$/i, ''),
    memberIds: [...family.memberIds],
    groupIds: Array.from(
      new Set(data.people.filter((p) => family.memberIds.includes(p.id)).flatMap((m) => m.groupIds))
    ),
    shepherdIds: Array.from(
      new Set(
        data.people
          .filter((p) => family.memberIds.includes(p.id))
          .flatMap((m) => m.assignedShepherdIds)
      )
    ),
  });

  // State
  const [label, setLabel] = React.useState(family.label.replace(/ Family$/i, ''));
  const [memberIds, setMemberIds] = React.useState<string[]>(family.memberIds);
  const [groupIds, setGroupIds] = React.useState<string[]>(initialStateRef.current.groupIds);
  const [shepherdIds, setShepherdIds] = React.useState<string[]>(
    initialStateRef.current.shepherdIds
  );

  // Picker open state
  const [showMemberPicker, setShowMemberPicker] = React.useState(false);
  const [showGroupPicker, setShowGroupPicker] = React.useState(false);
  const [showShepherdPicker, setShowShepherdPicker] = React.useState(false);

  const labelRef = React.useRef<HTMLInputElement>(null);

  // Derived
  const currentMembers = data.people.filter((p) => memberIds.includes(p.id));

  const canSave = React.useMemo(() => {
    if (!label.trim()) return false;
    const sorted = (arr: string[]) => [...arr].sort().join('\0');
    const init = initialStateRef.current;
    return (
      label.trim() !== init.label ||
      sorted(memberIds) !== sorted(init.memberIds) ||
      sorted(groupIds) !== sorted(init.groupIds) ||
      sorted(shepherdIds) !== sorted(init.shepherdIds)
    );
  }, [label, memberIds, groupIds, shepherdIds]);

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
      subtitle: p.role === 'admin' ? 'Admin' : 'User',
      photo: p.personId ? data.people.find((person) => person.id === p.personId)?.photo : undefined,
    }));
  const selectedShepherds = shepherdEntries.filter((e) => shepherdIds.includes(e.id));

  return (
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
        actionDisabled={!canSave}
      />

      {/* Scrollable body */}
      <div className="bg-bg flex-1 overflow-y-auto" style={{ padding: '1.25rem 1.25rem 3rem' }}>
        {/* ── BASIC ── */}
        <DrawerSection label="Basic">
          <div
            className="field-row-hover border-border-light flex cursor-text items-center gap-2.5 border-b pt-3 pb-3"
            onClick={() => labelRef.current?.focus()}
          >
            <span className="text-14 text-red w-2.5 shrink-0 leading-none">*</span>
            <House size={16} color="var(--text-muted)" />
            <span className="text-12 text-text-muted w-[60px] shrink-0">Last name</span>
            <input
              ref={labelRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Chen"
              className="text-14 text-text-primary flex-1 border-none bg-transparent outline-none"
            />
            <span className="text-15 text-text-muted whitespace-nowrap">Family</span>
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
                className="field-row-hover border-border-light flex items-center gap-2.5 border-b pt-2.5 pb-2.5"
              >
                <div
                  className="text-11 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold"
                  style={{ background: palette.bg, color: palette.color }}
                >
                  {inits}
                </div>
                <span className="text-14 text-text-primary flex-1">{fullName(m)}</span>
                <button
                  onClick={() => {
                    setMemberIds(memberIds.filter((x) => x !== m.id));
                  }}
                  className="bg-red-light flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-none"
                  aria-label={`Remove ${fullName(m)}`}
                >
                  <X size={12} color="#EF4444" />
                </button>
              </div>
            );
          })}
          {/* Add / edit members row */}
          <button
            className="field-row-hover border-border-light flex w-full cursor-pointer items-center gap-2.5 border-b border-none bg-transparent pt-3 pb-3 text-left"
            onClick={() => setShowMemberPicker(true)}
          >
            <span className="w-2.5 shrink-0" />
            <Plus size={16} color="var(--sage)" />
            <span className="text-14 text-sage font-medium">Add member</span>
          </button>
        </DrawerSection>

        {/* ── CHURCH ── */}
        <DrawerSection label="Church">
          {/* Fellowship Groups */}
          <button
            className="field-row-hover border-border-light flex w-full cursor-pointer items-center gap-2.5 border-b border-none bg-transparent pt-3 pb-3 text-left"
            onClick={() => setShowGroupPicker((v) => !v)}
          >
            <span className="w-2.5 shrink-0" />
            <UsersFour size={16} color="var(--text-muted)" />
            <span className="text-12 text-text-muted w-[60px] shrink-0">Groups</span>
            <div className="flex flex-1 flex-wrap gap-1">
              {selectedGroups.length > 0 ? (
                selectedGroups.map((g) => (
                  <span
                    key={g.id}
                    className="text-11 rounded-pill bg-blue-light text-blue shrink-0 font-medium"
                    style={{ padding: '0.125rem 0.5rem' }}
                  >
                    {g.name}
                  </span>
                ))
              ) : (
                <span className="text-14 text-text-muted">None</span>
              )}
            </div>
            <CaretRight size={14} color="var(--text-muted)" />
          </button>

          {/* Shepherds */}
          <button
            className="field-row-hover border-border-light flex w-full cursor-pointer items-center gap-2.5 border-b border-none bg-transparent pt-3 pb-3 text-left"
            onClick={() => setShowShepherdPicker(true)}
          >
            <span className="w-2.5 shrink-0" />
            <HandHeart size={16} color="var(--text-muted)" />
            <span className="text-12 text-text-muted w-[60px] shrink-0">Shepherd</span>
            <div className="flex flex-1 flex-wrap gap-1">
              {selectedShepherds.length > 0 ? (
                selectedShepherds.map((p) => (
                  <span
                    key={p.id}
                    className="text-11 rounded-pill bg-sage-light text-sage shrink-0 font-medium"
                    style={{ padding: '0.125rem 0.5rem' }}
                  >
                    {p.name}
                  </span>
                ))
              ) : (
                <span className="text-14 text-text-muted">None</span>
              )}
            </div>
            <CaretRight size={14} color="var(--text-muted)" />
          </button>
        </DrawerSection>
      </div>

      {/* Picker SubPanels — must be inside BottomSheet so position:absolute overlays the panel */}
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
      {showShepherdPicker && (
        <ShepherdPickerSheet
          entries={shepherdEntries}
          currentIds={shepherdIds}
          title={`Shepherd of ${family.label}`}
          onConfirm={(ids) => {
            setShepherdIds(ids);
            setShowShepherdPicker(false);
          }}
          onBack={() => setShowShepherdPicker(false)}
        />
      )}
    </BottomSheet>
  );
}

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
      <div className="border-border-light shrink-0 border-b px-5 py-3">
        <div
          className="bg-bg border-border flex items-center gap-2 rounded-sm border"
          style={{ padding: '0.5625rem 0.75rem' }}
        >
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="text-14 text-text-primary flex-1 border-none bg-transparent outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-text-muted text-18 cursor-pointer border-none bg-transparent p-0 leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
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
              className="border-border-light flex w-full cursor-pointer items-center gap-3 border-b border-none px-5 py-3 text-left"
              style={{ background: isSel ? 'var(--sage-light)' : 'transparent' }}
            >
              <div
                className="text-12 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold"
                style={{ background: palette.bg, color: palette.color }}
              >
                {inits}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-14 text-text-primary m-0 ${isSel ? 'font-semibold' : 'font-normal'}`}
                >
                  {fullName(p)}
                </p>
                {p.alternativeName && (
                  <p className="text-12 text-text-muted m-0">{p.alternativeName}</p>
                )}
              </div>
              <MemberCheckCircle selected={isSel} />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-13 text-text-muted px-5 py-6 text-center italic">No people found.</p>
        )}
      </div>
    </SubPanel>
  );
}

function MemberCheckCircle({ selected }: { selected: boolean }) {
  return (
    <div
      className="flex h-5 w-5 shrink-0 items-center justify-center [transition:background_0.15s]"
      style={{
        borderRadius: 5,
        border: selected ? 'none' : '0.09375rem solid var(--border)',
        background: selected ? 'var(--sage)' : 'transparent',
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
      <div className="border-border-light shrink-0 border-b px-5 py-3">
        <div
          className="bg-bg border-border flex items-center gap-2 rounded-sm border"
          style={{ padding: '0.5625rem 0.75rem' }}
        >
          <MagnifyingGlass size={14} color="var(--text-muted)" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="text-14 text-text-primary flex-1 border-none bg-transparent outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-text-muted text-18 cursor-pointer border-none bg-transparent p-0 leading-none"
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
              className="border-border-light flex w-full cursor-pointer items-center gap-3 border-b border-none px-5 py-3 text-left"
              style={{ background: isSel ? 'var(--blue-light)' : 'transparent' }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`text-14 m-0 ${isSel ? 'text-blue font-semibold' : 'text-text-primary font-normal'}`}
                >
                  {g.name}
                </p>
              </div>
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center [transition:background_0.15s]"
                style={{
                  borderRadius: 5,
                  border: isSel ? 'none' : '0.09375rem solid var(--border)',
                  background: isSel ? 'var(--blue)' : 'transparent',
                }}
              >
                {isSel && <Check size={11} color="var(--surface)" weight="bold" />}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-13 text-text-muted px-5 py-6 text-center italic">No groups found.</p>
        )}
      </div>
    </SubPanel>
  );
}
