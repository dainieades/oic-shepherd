'use client';

import { useState, useRef, useEffect } from 'react';
import { CaretRight, Trash, User, CalendarBlank, ArrowsClockwise, UserPlus, PlusCircle, CalendarPlus } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { TodoRepeat, Todo } from '@/lib/types';
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

  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const repeatBtnRef = useRef<HTMLButtonElement>(null);
  const calendarBtnRef = useRef<HTMLButtonElement>(null);
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
                  placeholder="To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on."
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

function CalendarPickerMenu({ anchorRef, title, dueDate, allDay, onClose }: { anchorRef: React.RefObject<HTMLButtonElement | null>; title: string; dueDate: string; allDay: boolean; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const start = new Date(dueDate);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
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

  const rect = anchorRef?.current?.getBoundingClientRect();
  const menuHeight = 41 * 2;
  const left   = rect ? rect.left : (window.innerWidth - Math.min(430, window.innerWidth - 32)) / 2;
  const width  = rect ? rect.width : Math.min(430, window.innerWidth - 32);
  const spaceBelow = rect ? window.innerHeight - rect.bottom - 8 : menuHeight + 1;
  const openAbove  = rect ? spaceBelow < menuHeight && rect.top > spaceBelow : false;
  const top = rect
    ? (openAbove ? rect.top - menuHeight - 4 : rect.bottom + 4)
    : (window.innerHeight - menuHeight) / 2;

  const itemStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)',
    fontSize: 14, cursor: 'pointer', textAlign: 'left',
    color: 'var(--text-primary)',
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed', top, left, width,
        background: 'var(--surface)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-light)',
        zIndex: 80,
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

