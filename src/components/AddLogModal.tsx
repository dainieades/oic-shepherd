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
import { BACKDROP_COLOR, Z_NESTED } from '@/lib/constants';

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
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
            style={{
              position: 'absolute',
              bottom: 28,
              left: 24,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--red-light)',
              border: '0.09375rem solid var(--red-border)',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
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
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: `1rem 1.25rem ${isEditing ? 80 : 16}px`,
                background: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {linkedTodo &&
                (() => {
                  const interactive = !!onOpenTodo;
                  const chipStyle: React.CSSProperties = {
                    display: 'inline-flex',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: 6,
                    padding: '0.375rem 0.625rem',
                    marginBottom: 12,
                    background: 'var(--sage-light)',
                    color: 'var(--sage)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--text-12)',
                    fontWeight: 'var(--font-semibold)',
                    maxWidth: '100%',
                    border: 'none',
                    cursor: interactive ? 'pointer' : 'default',
                    textAlign: 'left',
                  };
                  const contents = (
                    <>
                      <ListChecks size={13} weight="bold" />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        From to-do: {linkedTodo.title}
                      </span>
                      {interactive && <CaretRight size={12} weight="bold" />}
                    </>
                  );
                  return interactive ? (
                    <button
                      type="button"
                      onClick={() => onOpenTodo!(linkedTodo.id)}
                      style={chipStyle}
                    >
                      {contents}
                    </button>
                  ) : (
                    <div style={chipStyle}>{contents}</div>
                  );
                })()}

              {/* Fields */}
              <div
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-light)',
                  overflow: 'hidden',
                  padding: '0 1rem',
                  marginBottom: 16,
                  flexShrink: 0,
                }}
              >
                <div
                  className="no-last-border"
                  style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
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
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            paddingTop: 12,
                            paddingBottom: 12,
                          }}
                        >
                          <span
                            style={{
                              width: 24,
                              display: 'flex',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: 'var(--text-muted)',
                            }}
                          >
                            <UserPlus size={16} />
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--text-12)',
                              color: 'var(--text-muted)',
                              width: 60,
                              flexShrink: 0,
                            }}
                          >
                            Created by
                          </span>
                          <span style={{ flex: 1, fontSize: 'var(--text-14)', color: 'var(--text-secondary)' }}>
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
                style={{
                  flex: 1,
                  width: '100%',
                  marginTop: 0,
                  padding: 12,
                  minHeight: 220,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-14)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 'var(--leading-normal)',
                  boxSizing: 'border-box',
                }}
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
      className="field-row-hover"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingTop: 12,
        paddingBottom: 12,
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer',
        textAlign: 'left' as const,
      }}
    >
      <span
        style={{
          width: 24,
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--text-muted)',
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--text-14)',
          color: valueColor ?? 'var(--text-primary)',
          flex: 1,
          wordBreak: 'break-word',
        }}
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_NESTED,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 320,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.5rem 1.25rem 1rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 'var(--text-16)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
            }}
          >
            {label}
          </p>
          <p style={{ fontSize: 'var(--text-14)', color: 'var(--text-muted)', margin: 0 }}>
            This action cannot be undone.
          </p>
        </div>
        <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 50,
              background: 'none',
              border: 'none',
              borderRight: '1px solid var(--border-light)',
              fontSize: 'var(--text-15)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 50,
              background: 'none',
              border: 'none',
              fontSize: 'var(--text-15)',
              color: 'var(--red)',
              cursor: 'pointer',
              fontWeight: 'var(--font-semibold)',
            }}
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
