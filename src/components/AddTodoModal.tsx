'use client';

import { useState, useRef } from 'react';
import { CaretRight, Trash, User, CalendarBlank, ArrowsClockwise, Bell, UserPlus, PlusCircle, CalendarPlus } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { TodoRepeat, TodoAlert, Todo } from '@/lib/types';
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
  { value: 'none',      label: 'Never' },
  { value: 'daily',     label: 'Every day' },
  { value: 'weekly',    label: 'Every week' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Every month' },
  { value: 'yearly',    label: 'Every year' },
];

const ALERT_OPTIONS: { value: TodoAlert; label: string }[] = [
  { value: 'none',     label: 'No alert' },
  { value: 'on-time',  label: 'At time of event' },
  { value: '5min',     label: '5 minutes before' },
  { value: '15min',    label: '15 minutes before' },
  { value: '30min',    label: '30 minutes before' },
  { value: '1hour',    label: '1 hour before' },
  { value: '1day',     label: '1 day before' },
  { value: '2days',    label: '2 days before' },
];

export default function AddTodoModal({ onClose, prefillFamilyId, prefillPersonId, todo }: AddTodoModalProps) {
  const { data, addTodo, updateTodo, deleteTodo } = useApp();
  const { showToast } = useToast();
  const isEditing = !!todo;

  const [title, setTitle] = useState(todo?.title ?? '');
  const [familyIds, setFamilyIds] = useState<string[]>(
    todo?.familyId ? [todo.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = useState<string[]>(
    todo?.personId ? [todo.personId] : prefillPersonId ? [prefillPersonId] : []
  );
  const [dateStr, setDateStr] = useState(() => {
    if (todo?.dueDate) return todo.dueDate.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  });
  const [timeStr, setTimeStr] = useState(() => {
    if (todo?.dueDate && todo.dueDate.length >= 16) return todo.dueDate.slice(11, 16);
    return '12:00';
  });
  const [includeTime, setIncludeTime] = useState(() => {
    if (!todo?.dueDate || todo.dueDate.length < 16) return false;
    const t = todo.dueDate.slice(11, 16);
    return t !== '' && t !== '00:00';
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [repeat, setRepeat] = useState<TodoRepeat>(todo?.repeat ?? 'none');
  const [alert, setAlert] = useState<TodoAlert>(todo?.alert ?? 'none');

  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showAlertPicker, setShowAlertPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const alertBtnRef = useRef<HTMLButtonElement>(null);
  const repeatBtnRef = useRef<HTMLButtonElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const whoNames = [
    ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
    ...personIds.map((id) => data.people.find((p) => p.id === id)?.englishName ?? ''),
  ].filter(Boolean);
  const whoLabel = (() => {
    if (whoNames.length === 0) return null;
    // ~24 chars/line at 14px in the available field width (~180px); 3 lines ≈ 72 chars
    const MAX_CHARS = 72;
    let running = 0;
    const shown: string[] = [];
    for (const name of whoNames) {
      const cost = shown.length === 0 ? name.length : 2 + name.length;
      if (running + cost > MAX_CHARS && shown.length > 0) break;
      shown.push(name);
      running += cost;
    }
    const hidden = whoNames.length - shown.length;
    return shown.join(', ') + (hidden > 0 ? ` +${hidden}` : '');
  })();

  const handleSave = () => {
    if (!title.trim()) return;
    const dueDateValue = `${dateStr}T${includeTime ? timeStr : '00:00'}:00`;
    const base = {
      title: title.trim(),
      dueDate: dueDateValue,
      repeat: repeat !== 'none' ? repeat : undefined,
      alert: alert !== 'none' ? alert : undefined,
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

  function fmtDate() {
    const d = new Date(dateStr + 'T12:00:00');
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!includeTime) return datePart;
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${datePart}, ${h12}:${mStr} ${ampm}`;
  }

  const repeatLabel = REPEAT_OPTIONS.find((r) => r.value === repeat)?.label ?? 'Never';
  const alertLabel  = ALERT_OPTIONS.find((a) => a.value === alert)?.label ?? 'No alert';

return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 430,
            height: 'calc(100dvh - 48px)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Floating delete button */}
          {isEditing && todo && !showWhoPicker && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                position: 'absolute', bottom: 28, left: 24,
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--red-light)', border: '1.5px solid var(--red-border)',
                color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
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
                onConfirm={(fIds, pIds) => { setFamilyIds(fIds); setPersonIds(pIds); setShowWhoPicker(false); }}
                onBack={() => setShowWhoPicker(false)}
              />
            </div>
          )}

          {!showWhoPicker && (
            <>
              {/* Header — fixed */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
                <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{isEditing ? 'Edit to-do' : 'Add to-do'}</span>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  style={{ height: 32, padding: '0 14px', borderRadius: 8, background: title.trim() ? 'var(--sage)' : 'var(--border)', color: title.trim() ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, border: 'none', cursor: title.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}
                >Save</button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: `16px 20px ${isEditing ? 80 : 16}px`, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
                {/* Field rows */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden', padding: '0 16px', flexShrink: 0 }}>
                <div className="no-last-border" style={{ display: 'flex', flexDirection: 'column' }}>

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
                    value={fmtDate()}
                    onClick={() => setShowDatePicker(true)}
                  />

                  {/* Add to Calendar */}
                  <FieldRow
                    icon={<CalendarPlus size={16} />}
                    label="Calendar"
                    value="Add to calendar"
                    valueColor="var(--text-muted)"
                    onClick={() => setShowCalendarPicker(true)}
                  />

                  {/* Alert */}
                  <FieldRow
                    btnRef={alertBtnRef}
                    icon={<Bell size={16} />}
                    label="Alert"
                    value={alertLabel}
                    valueColor={alert === 'none' ? 'var(--text-muted)' : undefined}
                    onClick={() => setShowAlertPicker(true)}
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
                  {isEditing && todo && (() => {
                    const creator = data.personas.find((p) => p.id === todo.createdBy);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 12 }}>
                        <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                          <UserPlus size={16} />
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>Created by</span>
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{creator?.name ?? 'Unknown'}</span>
                      </div>
                    );
                  })()}
                </div>
                </div>

                {/* Title */}
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done…"
                  autoFocus
                  style={{
                    flex: 1, width: '100%', marginTop: 16,
                    padding: 12, minHeight: 220,
                    background: 'var(--surface)', border: '1px solid var(--border-light)',
                    borderRadius: 10, fontSize: 15, color: 'var(--text-primary)',
                    resize: 'vertical', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showDatePicker && (
        <DatePickerSheet
          date={dateStr}
          time={timeStr}
          includeTime={includeTime}
          onConfirm={(d, t, it) => { setDateStr(d); setTimeStr(t); setIncludeTime(it); setShowDatePicker(false); }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      {showAlertPicker && (
        <PickerMenu
          anchorRef={alertBtnRef}
          title="Alert"
          options={ALERT_OPTIONS}
          value={alert}
          onSelect={(v) => setAlert(v as TodoAlert)}
          onClose={() => setShowAlertPicker(false)}
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
          onConfirm={() => { deleteTodo(todo.id); onClose(); }}
        />
      )}
      {showCalendarPicker && (
        <CalendarPicker
          title={title.trim() || 'To-do'}
          dueDate={`${dateStr}T${includeTime ? timeStr : '00:00'}:00`}
          allDay={!includeTime}
          onClose={() => setShowCalendarPicker(false)}
        />
      )}
    </>
  );
}

function CalendarPicker({ title, dueDate, allDay, onClose }: { title: string; dueDate: string; allDay: boolean; onClose: () => void }) {
  const start = new Date(dueDate);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour (only used for timed events)

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

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 10,
    background: 'var(--surface)', border: '1px solid var(--border-light)',
    fontSize: 15, color: 'var(--text-primary)', cursor: 'pointer',
    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 70 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 71,
          display: 'flex', justifyContent: 'center',
        }}
      >
      <div
        className="animate-slide-up"
        style={{
          width: '100%', maxWidth: 430,
          background: 'var(--bg)', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Add to Calendar
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={handleGoogleCalendar} style={btnStyle}>
            <CalendarBlank size={18} color="var(--sage)" />
            Google Calendar
          </button>
          <button onClick={handleIcsDownload} style={btnStyle}>
            <CalendarBlank size={18} color="var(--text-muted)" />
            <span>
              Apple / Other Calendar
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>(.ics)</span>
            </span>
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 12, width: '100%', padding: '13px 16px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--border-light)',
            fontSize: 15, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Cancel
        </button>
      </div>
      </div>
    </>
  );
}

function FieldRow({ btnRef, icon, label, value, valueColor, onClick, trailingIcon }: {
  btnRef?: React.RefObject<HTMLButtonElement | null>; icon: React.ReactNode; label: string; value: string; valueColor?: string; onClick: () => void; trailingIcon?: React.ReactNode;
}) {
  return (
    <button
      ref={btnRef}
      className="field-row-hover"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingTop: 12, paddingBottom: 12,
        background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)',
        cursor: 'pointer', textAlign: 'left' as const,
      }}
    >
      <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 14, color: valueColor ?? 'var(--text-primary)', flex: 1,
        wordBreak: 'break-word',
      }}>{value}</span>
      {trailingIcon ?? <CaretRight size={14} color="var(--text-muted)" />}
    </button>
  );
}

