'use client';

import { addHours, format } from 'date-fns';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { fmtDateTime, truncateWhoLabel } from '@/lib/utils';
import React from 'react';
import { useFloating, autoUpdate, offset, flip, size } from '@floating-ui/react';
import {
  CaretRight,
  Trash,
  User,
  CalendarBlank,
  ArrowsClockwise,
  UserPlus,
  PlusCircle,
  CalendarPlus,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { type TodoRepeat, type Todo } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import DatePickerSheet from './DatePickerSheet';
import { DeleteConfirmDialog } from './AddLogModal';
import { buildGoogleCalendarUrl, buildIcsContent } from '@/lib/utils';

interface AddTodoModalProps {
  onClose: () => void;
  prefillFamilyId?: string;
  prefillPersonId?: string;
  todo?: Todo;
}

const REPEAT_OPTIONS: { value: TodoRepeat; label: string }[] = [
  { value: 'none', label: 'Never' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
];

export default function AddTodoModal({
  onClose,
  prefillFamilyId,
  prefillPersonId,
  todo,
}: AddTodoModalProps) {
  const { data, currentPersona, addTodo, updateTodo, deleteTodo } = useApp();
  const { showToast } = useToast();
  const isEditing = !!todo;

  const [title, setTitle] = React.useState(todo?.title ?? '');
  const [familyIds, setFamilyIds] = React.useState<string[]>(
    todo?.familyId ? [todo.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = React.useState<string[]>(
    todo?.personId ? [todo.personId] : prefillPersonId ? [prefillPersonId] : []
  );
  const [dateStr, setDateStr] = React.useState(() => {
    if (todo?.dueDate) return todo.dueDate.slice(0, 10);
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [timeStr, setTimeStr] = React.useState(() => {
    if (todo?.dueDate && todo.dueDate.length >= 16) return todo.dueDate.slice(11, 16);
    return '12:00';
  });
  const [includeTime, setIncludeTime] = React.useState(() => {
    if (!todo?.dueDate || todo.dueDate.length < 16) return false;
    const t = todo.dueDate.slice(11, 16);
    return t !== '' && t !== '00:00';
  });
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [repeat, setRepeat] = React.useState<TodoRepeat>(todo?.repeat ?? 'none');

  const [showWhoPicker, setShowWhoPicker] = React.useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = React.useState(false);

  const repeatBtnRef = React.useRef<HTMLButtonElement>(null);
  const calendarBtnRef = React.useRef<HTMLButtonElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = React.useState(false);

  const whoNames = [
    ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
    ...personIds.map((id) => data.people.find((p) => p.id === id)?.englishName ?? ''),
  ].filter(Boolean);
  const whoLabel = truncateWhoLabel(whoNames);

  const handleSave = () => {
    if (!title.trim()) return;
    const dueDateValue = `${dateStr}T${includeTime ? timeStr : '00:00'}:00`;
    const base = {
      title: title.trim(),
      dueDate: dueDateValue,
      repeat: repeat !== 'none' ? repeat : undefined,
    };
    if (isEditing && todo) {
      updateTodo(todo.id, { ...base, familyId: familyIds[0], personId: personIds[0] });
      showToast('Task updated');
    } else {
      if (familyIds.length === 0 && personIds.length === 0) {
        addTodo(base);
      } else {
        for (const familyId of familyIds) addTodo({ ...base, familyId });
        for (const personId of personIds) addTodo({ ...base, personId });
      }
      showToast('Task added');
    }
    onClose();
  };

  const repeatLabel = REPEAT_OPTIONS.find((r) => r.value === repeat)?.label ?? 'Never';

  return (
    <>
      <BottomSheet onClose={onClose}>
          {/* Floating delete button */}
          {isEditing && todo && !showWhoPicker && (
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
                border: '1.5px solid var(--red-border)',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
              }}
              title="Delete to-do"
            >
              <Trash size={18} />
            </button>
          )}

          {showWhoPicker && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <PersonFamilyPicker
                data={data}
                initialFamilyIds={familyIds}
                initialPersonIds={personIds}
                allowedPersonIds={currentPersona.role !== 'admin' ? currentPersona.assignedPeopleIds : undefined}
                onConfirm={(fIds, pIds) => {
                  setFamilyIds(fIds);
                  setPersonIds(pIds);
                  setShowWhoPicker(false);
                }}
                onBack={() => setShowWhoPicker(false)}
              />
            </div>
          )}

          {!showWhoPicker && (
            <>
              <ModalHeader
                title={isEditing ? 'Edit to-do' : 'Add to-do'}
                onCancel={onClose}
                onAction={handleSave}
                actionLabel="Save"
                actionDisabled={!title.trim()}
              />

              {/* Scrollable body */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: `16px 20px ${isEditing ? 80 : 16}px`,
                  background: 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Field rows */}
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    padding: '0 16px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="no-last-border"
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    {/* For */}
                    <FieldRow
                      icon={<User size={16} />}
                      label="For"
                      value={whoLabel ?? 'Select…'}
                      valueColor={!whoLabel ? 'var(--text-muted)' : undefined}
                      onClick={() => setShowWhoPicker(true)}
                      trailingIcon={<PlusCircle size={22} color="var(--sage)" weight="fill" />}
                    />

                    {/* Date */}
                    <FieldRow
                      icon={<CalendarBlank size={16} />}
                      label="Date"
                      value={fmtDateTime(dateStr, timeStr, includeTime)}
                      onClick={() => setShowDatePicker(true)}
                    />

                    {/* Add to Calendar */}
                    <FieldRow
                      btnRef={calendarBtnRef}
                      icon={<CalendarPlus size={16} />}
                      label="Calendar"
                      value="Add to calendar"
                      valueColor="var(--text-muted)"
                      onClick={() => setShowCalendarPicker(true)}
                    />

                    {/* Repeat */}
                    <FieldRow
                      btnRef={repeatBtnRef}
                      icon={<ArrowsClockwise size={16} />}
                      label="Repeat"
                      value={repeatLabel}
                      valueColor={repeat === 'none' ? 'var(--text-muted)' : undefined}
                      onClick={() => setShowRepeatPicker(true)}
                    />

                    {/* Created by — edit mode only */}
                    {isEditing &&
                      todo &&
                      (() => {
                        const creator = data.personas.find((p) => p.id === todo.createdBy);
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
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                width: 60,
                                flexShrink: 0,
                              }}
                            >
                              Created by
                            </span>
                            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>
                              {creator?.name ?? 'Unknown'}
                            </span>
                          </div>
                        );
                      })()}
                  </div>
                </div>

                {/* Title */}
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on."
                  autoFocus
                  style={{
                    flex: 1,
                    width: '100%',
                    marginTop: 16,
                    padding: 12,
                    minHeight: 220,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 15,
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5,
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
      {showRepeatPicker && (
        <PickerMenu
          anchorRef={repeatBtnRef}
          title="Repeat"
          options={REPEAT_OPTIONS}
          value={repeat}
          onSelect={(v) => setRepeat(v as TodoRepeat)}
          onClose={() => setShowRepeatPicker(false)}
        />
      )}
      {showDeleteConfirm && todo && (
        <DeleteConfirmDialog
          label="Delete this to-do?"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            deleteTodo(todo.id);
            onClose();
          }}
        />
      )}
      {showCalendarPicker && (
        <CalendarPickerMenu
          anchorRef={calendarBtnRef}
          title={title.trim() || 'To-do'}
          dueDate={`${dateStr}T${includeTime ? timeStr : '00:00'}:00`}
          allDay={!includeTime}
          onClose={() => setShowCalendarPicker(false)}
        />
      )}
    </>
  );
}

function CalendarPickerMenu({
  anchorRef,
  title,
  dueDate,
  allDay,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  dueDate: string;
  allDay: boolean;
  onClose: () => void;
}) {
  const start = new Date(dueDate);
  const end = addHours(start, 1);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const floating = refs.floating.current;
      if (
        floating &&
        !floating.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  function handleGoogleCalendar() {
    window.open(buildGoogleCalendarUrl(title, start, end, allDay), '_blank', 'noopener,noreferrer');
    onClose();
  }

  function handleIcsDownload() {
    const uid = Date.now().toString(36);
    const content = buildIcsContent(title, uid, start, end, allDay);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`;
        },
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    refs.setReference(anchorRef?.current ?? null);
  }, [anchorRef, refs]);

  const itemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--border-light)',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--text-primary)',
  };

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-elevated)',
        border: '1px solid var(--border-light)',
        zIndex: 'var(--z-nested)',
        overflow: 'hidden',
      }}
    >
      <button onClick={handleGoogleCalendar} style={itemStyle}>
        <CalendarBlank size={16} color="var(--sage)" />
        Google Calendar
      </button>
      <button onClick={handleIcsDownload} style={{ ...itemStyle, borderBottom: 'none' }}>
        <CalendarBlank size={16} color="var(--text-muted)" />
        Apple / Other Calendar
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2 }}>(.ics)</span>
      </button>
    </div>
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
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
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
