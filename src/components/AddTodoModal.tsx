'use client';

import { addHours, format } from 'date-fns';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { fmtDateTime, truncateWhoLabel, fullName } from '@/lib/utils';
import React from 'react';
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
  CheckCircle,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { type TodoRepeat, type TodoReminder, type Todo } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import DatePickerSheet from './DatePickerSheet';
import { DeleteConfirmDialog } from './AddLogModal';
import CalendarSyncSheet from './CalendarSyncSheet';

interface AddTodoModalProps {
  onClose: () => void;
  prefillFamilyId?: string;
  prefillPersonId?: string;
  todo?: Todo;
  onBack?: () => void;
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
  { value: '30_min_before', label: '30 minutes before' },
  { value: '1_hour_before', label: '1 hour before' },
  { value: '1_day_before', label: '24 hours before' },
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
  onBack,
}: AddTodoModalProps) {
  const { data, currentPersona, addTodo, updateTodo, deleteTodo, calendarSyncEnabled } = useApp();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showCalendarSheet, setShowCalendarSheet] = React.useState(false);

  const whoNames = [
    ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
    ...personIds.map((id) => {
      const p = data.people.find((p) => p.id === id);
      return p ? fullName(p) : '';
    }),
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
      <BottomSheet onClose={onClose} variant="dialog" aria-labelledby="add-todo-title">
        {/* Floating delete button */}
        {isEditing && todo && !showWhoPicker && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute flex items-center justify-center cursor-pointer bg-red-light border border-red-border text-red rounded-full shadow-card"
            style={{
              bottom: 28,
              left: 24,
              width: 44,
              height: 44,
              borderWidth: '0.09375rem',
            }}
            title="Delete to-do"
          >
            <Trash size={18} />
          </button>
        )}

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

        {!showWhoPicker && (
          <>
            <ModalHeader
              title={isEditing ? 'Edit to-do' : 'Add to-do'}
              titleId="add-todo-title"
              onCancel={onBack ?? onClose}
              cancelLabel={onBack ? 'Back' : 'Cancel'}
              onAction={handleSave}
              actionLabel="Save"
              actionDisabled={!title.trim()}
            />

            {/* Scrollable body */}
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-bg flex flex-col"
              style={{ padding: `1rem 1.25rem ${isEditing ? 80 : 16}px` }}
            >
              {/* Field rows */}
              <div
                className="bg-surface rounded border border-border-light overflow-hidden px-4 shrink-0"
              >
                <div
                  className="no-last-border flex flex-col"
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
                    onClick={() => setShowReminderPicker((v) => !v)}
                  />

                  {/* Add to Calendar / Sync status */}
                  <FieldRow
                    icon={
                      calendarSyncEnabled ? (
                        <CheckCircle size={16} weight="fill" color="var(--sage)" />
                      ) : (
                        <CalendarPlus size={16} />
                      )
                    }
                    label="Calendar"
                    value={calendarSyncEnabled ? 'Synced to your calendar' : 'Add to calendar'}
                    valueColor={calendarSyncEnabled ? 'var(--sage)' : 'var(--text-muted)'}
                    onClick={() => setShowCalendarSheet(true)}
                  />

                  {/* Repeat */}
                  <FieldRow
                    btnRef={repeatBtnRef}
                    icon={<ArrowsClockwise size={16} />}
                    label="Repeat"
                    value={repeatLabel}
                    valueColor={repeat === 'none' ? 'var(--text-muted)' : undefined}
                    onClick={() => setShowRepeatPicker((v) => !v)}
                  />

                  {/* Created by — edit mode only */}
                  {isEditing &&
                    todo &&
                    (() => {
                      const creator = data.personas.find((p) => p.id === todo.createdBy);
                      return (
                        <div className="flex items-center gap-2.5 py-3">
                          <span className="w-6 flex justify-center shrink-0 text-text-muted">
                            <UserPlus size={16} />
                          </span>
                          <span className="text-12 text-text-muted w-[60px] shrink-0">
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

              {/* Title */}
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on."
                autoFocus
                className="flex-1 w-full mt-4 p-3 bg-surface border border-border-light rounded-sm text-15 text-text-primary leading-normal outline-none box-border resize-y min-h-[220px]"
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
      {showCalendarSheet &&
        (() => {
          const start = new Date(`${dateStr}T${includeTime ? timeStr : '00:00'}:00`);
          const end = addHours(start, 1);
          return (
            <CalendarSyncSheet
              onClose={() => setShowCalendarSheet(false)}
              singleEvent={{
                title: title.trim() || 'To-do',
                start,
                end,
                allDay: !includeTime,
                repeat: repeat !== 'none' ? repeat : undefined,
                reminder: reminder !== 'none' ? reminder : undefined,
              }}
            />
          );
        })()}
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
      className="field-row-hover flex items-center gap-2.5 py-3 bg-transparent border-0 border-b border-border-light cursor-pointer text-left"
      onClick={onClick}
    >
      <span className="w-6 flex justify-center shrink-0 text-text-muted">
        {icon}
      </span>
      <span className="text-12 text-text-muted w-[60px] shrink-0">
        {label}
      </span>
      <span
        className="flex-1 text-14 break-words"
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {value}
      </span>
      {trailingIcon ?? <CaretRight size={14} color="var(--text-muted)" />}
    </button>
  );
}
