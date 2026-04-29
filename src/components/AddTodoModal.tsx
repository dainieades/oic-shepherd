'use client';

import { addHours, format } from 'date-fns';
import { Z_NESTED } from '@/lib/constants';
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
  Bell,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { type TodoRepeat, type TodoReminder, type Todo } from '@/lib/types';
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

const REMINDER_OPTIONS_TIMED: { value: TodoReminder; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'at_start', label: 'When it starts' },
  { value: '5_min_before', label: '5 minutes before' },
  { value: '10_min_before', label: '10 minutes before' },
  { value: '15_min_before', label: '15 minutes before' },
  { value: '30_min_before', label: '30 minutes before' },
  { value: '1_hour_before', label: '1 hour before' },
  { value: '1_day_before', label: '1 day before' },
];

const REMINDER_OPTIONS_DATE_ONLY: { value: TodoReminder; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'same_day_9am', label: 'Same day at 9 AM' },
  { value: 'day_before_9am', label: 'Day before at 9 AM' },
  { value: 'day_before_5pm', label: 'Day before at 5 PM' },
  { value: '2_days_before_9am', label: '2 days before at 9 AM' },
  { value: '1_week_before_9am', label: '1 week before at 9 AM' },
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
  const [endDateStr, setEndDateStr] = React.useState(todo?.endDate?.slice(0, 10) ?? '');
  const [includeEndDate, setIncludeEndDate] = React.useState(!!todo?.endDate);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [repeat, setRepeat] = React.useState<TodoRepeat>(todo?.repeat ?? 'none');
  const [reminder, setReminder] = React.useState<TodoReminder>(todo?.reminder ?? 'none');

  const [showWhoPicker, setShowWhoPicker] = React.useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = React.useState(false);
  const [showReminderPicker, setShowReminderPicker] = React.useState(false);

  const repeatBtnRef = React.useRef<HTMLButtonElement>(null);
  const reminderBtnRef = React.useRef<HTMLButtonElement>(null);
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
      endDate: includeEndDate && endDateStr ? `${endDateStr}T00:00:00` : undefined,
      repeat: repeat !== 'none' ? repeat : undefined,
      reminder: reminder !== 'none' ? reminder : undefined,
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
  const reminderOptions = includeTime ? REMINDER_OPTIONS_TIMED : REMINDER_OPTIONS_DATE_ONLY;
  const reminderLabel = reminderOptions.find((r) => r.value === reminder)?.label ?? 'None';

  return (
    <>
      <BottomSheet onClose={onClose} aria-labelledby="add-todo-title">
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
                border: '0.09375rem solid var(--red-border)',
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
                titleId="add-todo-title"
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
                  padding: `1rem 1.25rem ${isEditing ? 80 : 16}px`,
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
                    padding: '0 1rem',
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
                      value={
                        includeEndDate && endDateStr
                          ? `${fmtDateTime(dateStr, timeStr, includeTime)} → ${fmtDateTime(endDateStr, '00:00', false)}`
                          : fmtDateTime(dateStr, timeStr, includeTime)
                      }
                      onClick={() => setShowDatePicker(true)}
                    />

                    {/* Reminder */}
                    <FieldRow
                      btnRef={reminderBtnRef}
                      icon={<Bell size={16} />}
                      label="Reminder"
                      value={reminderLabel}
                      valueColor={reminder === 'none' ? 'var(--text-muted)' : undefined}
                      onClick={() => setShowReminderPicker(true)}
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
          endDate={endDateStr || dateStr}
          includeEndDate={includeEndDate}
          allowFuture
          onConfirm={(d, t, it, ed, _et) => {
            if (it !== includeTime) setReminder('none');
            setDateStr(d);
            setTimeStr(t);
            setIncludeTime(it);
            setEndDateStr(ed ?? '');
            setIncludeEndDate(!!ed);
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
      {showReminderPicker && (
        <PickerMenu
          anchorRef={reminderBtnRef}
          title="Reminder"
          options={reminderOptions}
          value={reminder}
          onSelect={(v) => setReminder(v as TodoReminder)}
          onClose={() => setShowReminderPicker(false)}
        />
      )}
      {showCalendarPicker && (
        <CalendarPickerMenu
          anchorRef={calendarBtnRef}
          title={title.trim() || 'To-do'}
          dueDate={`${dateStr}T${includeTime ? timeStr : '00:00'}:00`}
          allDay={!includeTime}
          repeat={repeat !== 'none' ? repeat : undefined}
          reminder={reminder !== 'none' ? reminder : undefined}
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
  repeat,
  reminder,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  dueDate: string;
  allDay: boolean;
  repeat?: TodoRepeat;
  reminder?: TodoReminder;
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
    window.open(buildGoogleCalendarUrl(title, start, end, allDay, repeat), '_blank', 'noopener,noreferrer');
    onClose();
  }

  function handleIcsDownload() {
    const uid = Date.now().toString(36);
    const content = buildIcsContent(title, uid, start, end, allDay, repeat, reminder);
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
    padding: '0.625rem 0.875rem',
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
        zIndex: Z_NESTED,
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
