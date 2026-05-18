'use client';

import { format } from 'date-fns';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  HandsPraying,
  CalendarBlank,
  NotePencil,
  CaretRight,
  Trash,
  User,
  UserPlus,
  PlusCircle,
  ListChecks,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { type NoteType, type Note } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import DatePickerSheet from './DatePickerSheet';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { fmtDateTime, truncateWhoLabel, fullName } from '@/lib/utils';
import { Z_NESTED } from '@/lib/constants';

interface AddLogModalProps {
  onClose: () => void;
  prefillFamilyId?: string;
  prefillPersonId?: string;
  prefillContent?: string;
  prefillType?: NoteType;
  prefillTodoId?: string;
  prefillDate?: string;
  note?: Note;
  onOpenTodo?: (todoId: string) => void;
}

const NOTE_TYPES: { value: NoteType; label: string; icon: React.ReactNode }[] = [
  { value: 'check-in', label: 'Follow-up', icon: <CheckCircle size={16} /> },
  { value: 'prayer-request', label: 'Prayer request', icon: <HandsPraying size={16} /> },
  { value: 'event', label: 'Event', icon: <CalendarBlank size={16} /> },
  { value: 'general', label: 'General note', icon: <NotePencil size={16} /> },
];

export default function AddLogModal({
  onClose,
  prefillFamilyId,
  prefillPersonId,
  prefillContent,
  prefillType,
  prefillTodoId,
  prefillDate,
  note,
  onOpenTodo,
}: AddLogModalProps) {
  const { data, currentPersona, addNote, updateNote, deleteNote } = useApp();
  const { showToast } = useToast();
  const isEditing = !!note;

  const [type, setType] = React.useState<NoteType>(note?.type ?? prefillType ?? 'check-in');
  const [familyIds, setFamilyIds] = React.useState<string[]>(
    note?.familyId ? [note.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = React.useState<string[]>(
    note?.personId ? [note.personId] : prefillPersonId ? [prefillPersonId] : []
  );
  const [content, setContent] = React.useState(note?.content ?? prefillContent ?? '');
  const [dateStr, setDateStr] = React.useState(() => {
    if (note?.createdAt) return note.createdAt.slice(0, 10);
    if (prefillDate) return prefillDate.slice(0, 10);
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [timeStr, setTimeStr] = React.useState(() => {
    if (note?.createdAt) return note.createdAt.slice(11, 16);
    if (prefillDate && prefillDate.length >= 16) return prefillDate.slice(11, 16);
    return format(new Date(), 'HH:mm');
  });
  const [includeTime, setIncludeTime] = React.useState(true);

  const linkedTodoId = prefillTodoId ?? note?.todoId;
  const linkedTodo = linkedTodoId ? data.todos.find((t) => t.id === linkedTodoId) : undefined;

  const [showWhoPicker, setShowWhoPicker] = React.useState(false);
  const [showTypePicker, setShowTypePicker] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const typeBtnRef = React.useRef<HTMLButtonElement>(null);

  const whoNames = [
    ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
    ...personIds.map((id) => {
      const p = data.people.find((p) => p.id === id);
      return p ? fullName(p) : '';
    }),
  ].filter(Boolean);
  const whoLabel = truncateWhoLabel(whoNames);

  const handleSave = () => {
    const createdAt = new Date(`${dateStr}T${includeTime ? timeStr : '00:00'}:00`).toISOString();
    if (isEditing && note) {
      updateNote(note.id, {
        type,
        content: content || undefined,
        familyId: familyIds[0],
        personId: personIds[0],
        createdAt,
      });
      showToast('Log updated');
    } else {
      if (familyIds.length === 0 && personIds.length === 0) return;
      for (const familyId of familyIds) {
        addNote({
          type,
          familyId,
          content: content || undefined,
          visibility: 'public',
          createdAt,
          todoId: prefillTodoId,
        });
      }
      for (const personId of personIds) {
        addNote({
          type,
          personId,
          content: content || undefined,
          visibility: 'public',
          createdAt,
          todoId: prefillTodoId,
        });
      }
      showToast('Log saved');
    }
    onClose();
  };

  const typeItem = NOTE_TYPES.find((t) => t.value === type) ?? NOTE_TYPES[0];

  return (
    <>
      <BottomSheet onClose={onClose} variant="dialog" aria-labelledby="add-log-title">
        {showWhoPicker && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <PersonFamilyPicker
              data={data}
              initialFamilyIds={familyIds}
              initialPersonIds={personIds}
              allowedPersonIds={
                currentPersona.role !== 'admin' ? currentPersona.assignedPeopleIds : undefined
              }
              onConfirm={(fIds, pIds) => {
                setFamilyIds(fIds);
                setPersonIds(pIds);
                setShowWhoPicker(false);
              }}
              onBack={() => setShowWhoPicker(false)}
            />
          </div>
        )}

        {/* Floating delete button */}
        {isEditing && note && !showWhoPicker && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute w-11 h-11 rounded-full bg-red-light text-red flex items-center justify-center cursor-pointer shadow-card"
            style={{
              bottom: 28,
              left: 24,
              border: '0.09375rem solid var(--red-border)',
            }}
            title="Delete log"
          >
            <Trash size={18} />
          </button>
        )}

        {!showWhoPicker && (
          <>
            <ModalHeader
              title={isEditing ? 'Edit log' : 'Add log'}
              titleId="add-log-title"
              onCancel={onClose}
              onAction={handleSave}
              actionLabel="Save"
            />

            {/* Scrollable body */}
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-bg flex flex-col"
              style={{ padding: `1rem 1.25rem ${isEditing ? 80 : 16}px` }}
            >
              {linkedTodo &&
                (() => {
                  const interactive = !!onOpenTodo;
                  const chipClass = 'inline-flex items-center self-start gap-1.5 mb-3 bg-sage-light text-sage rounded-pill text-12 font-semibold max-w-full border-none text-left';
                  const chipStyle: React.CSSProperties = {
                    padding: '0.375rem 0.625rem',
                    cursor: interactive ? 'pointer' : 'default',
                  };
                  const contents = (
                    <>
                      <ListChecks size={13} weight="bold" />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        From to-do: {linkedTodo.title}
                      </span>
                      {interactive && <CaretRight size={12} weight="bold" />}
                    </>
                  );
                  return interactive ? (
                    <button
                      type="button"
                      onClick={() => onOpenTodo!(linkedTodo.id)}
                      className={chipClass}
                      style={chipStyle}
                    >
                      {contents}
                    </button>
                  ) : (
                    <div className={chipClass} style={chipStyle}>{contents}</div>
                  );
                })()}

              {/* Fields */}
              <div
                className="bg-surface rounded border border-border-light overflow-hidden px-4 mb-4 shrink-0"
              >
                <div
                  className="no-last-border flex flex-col"
                >
                  {/* Type */}
                  <FieldRow
                    btnRef={typeBtnRef}
                    icon={typeItem.icon}
                    label="Type"
                    value={typeItem.label}
                    onClick={() => setShowTypePicker((v) => !v)}
                  />

                  {/* For */}
                  <FieldRow
                    icon={<User size={16} />}
                    label="For"
                    value={whoLabel ?? 'Select…'}
                    valueColor={!whoLabel ? 'var(--text-muted)' : undefined}
                    onClick={() => setShowWhoPicker(true)}
                    trailingIcon={<PlusCircle size={22} color="var(--sage)" weight="fill" />}
                  />

                  {/* Date & Time */}
                  <FieldRow
                    icon={<CalendarBlank size={16} />}
                    label="Date"
                    value={fmtDateTime(dateStr, timeStr, includeTime)}
                    onClick={() => setShowDatePicker(true)}
                  />

                  {/* Created by — edit mode only */}
                  {isEditing &&
                    note &&
                    (() => {
                      const creator = data.personas.find((p) => p.id === note.createdBy);
                      return (
                        <div
                          className="flex items-center gap-2.5 py-3"
                        >
                          <span
                            className="w-6 flex justify-center shrink-0 text-text-muted"
                          >
                            <UserPlus size={16} />
                          </span>
                          <span
                            className="text-12 text-text-muted w-[60px] shrink-0"
                          >
                            Created by
                          </span>
                          <span className="flex-1 text-14 text-text-secondary">
                            {creator?.name ?? 'Unknown'}
                          </span>
                        </div>
                      );
                    })()}
                </div>
              </div>

              {/* Note content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Logs capture past interactions — a conversation, a check-in, a prayer request, or a moment you shared together."
                className="flex-1 w-full mt-0 p-3 bg-surface border border-border-light rounded-sm text-14 text-text-primary resize-y outline-none leading-normal box-border"
                style={{ minHeight: 220 }}
              />
            </div>
          </>
        )}
      </BottomSheet>

      {showDatePicker && (
        <DatePickerSheet
          date={dateStr}
          time={timeStr}
          includeTime={includeTime}
          onConfirm={(d, t, it) => {
            setDateStr(d);
            setTimeStr(t);
            setIncludeTime(it);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      {showTypePicker && (
        <PickerMenu
          anchorRef={typeBtnRef}
          title="Log type"
          options={NOTE_TYPES}
          value={type}
          onSelect={(v) => setType(v as NoteType)}
          onClose={() => setShowTypePicker(false)}
        />
      )}
      {showDeleteConfirm && note && (
        <DeleteConfirmDialog
          label="Delete this log?"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            deleteNote(note.id);
            onClose();
          }}
        />
      )}
    </>
  );
}

function FieldRow({
  btnRef,
  icon,
  label,
  value,
  valueColor,
  onClick,
  trailingIcon,
}: {
  btnRef?: React.RefObject<HTMLButtonElement | null>;
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  onClick: () => void;
  trailingIcon?: React.ReactNode;
}) {
  return (
    <button
      ref={btnRef}
      className="field-row-hover flex items-center gap-2.5 py-3 bg-transparent border-none border-b border-border-light cursor-pointer text-left w-full"
      onClick={onClick}
    >
      <span
        className="w-6 flex justify-center shrink-0 text-text-muted"
      >
        {icon}
      </span>
      <span className="text-12 text-text-muted w-[60px] shrink-0">
        {label}
      </span>
      <span
        className="text-14 flex-1 break-words"
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {value}
      </span>
      {trailingIcon ?? <CaretRight size={14} color="var(--text-muted)" />}
    </button>
  );
}

export function DeleteConfirmDialog({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = (
    <div
      className="fixed inset-0 flex items-center justify-center px-8 z-nested bg-backdrop"
      style={{ zIndex: Z_NESTED }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-surface w-full max-w-xs overflow-hidden"
        style={{ borderRadius: 16 }}
      >
        <div className="px-5 pt-6 pb-4 text-center">
          <p
            className="text-16 font-semibold text-text-primary"
            style={{ margin: '0 0 0.5rem' }}
          >
            {label}
          </p>
          <p className="text-14 text-text-muted m-0">
            This action cannot be undone.
          </p>
        </div>
        <div className="border-t border-border-light flex">
          <button
            onClick={onCancel}
            className="flex-1 h-[50px] bg-transparent border-none border-r border-border-light text-15 text-text-secondary cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-[50px] bg-transparent border-none text-15 text-red cursor-pointer font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
