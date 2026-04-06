'use client';

import { useState, useRef } from 'react';
import { CaretRight, Trash, User, CalendarBlank, ArrowsClockwise, Bell, UserPlus } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { TodoRepeat, TodoAlert, Todo } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import { DeleteConfirmDialog } from './AddLogModal';

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
  const isEditing = !!todo;

  const [title, setTitle] = useState(todo?.title ?? '');
  const [familyIds, setFamilyIds] = useState<string[]>(
    todo?.familyId ? [todo.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = useState<string[]>(
    todo?.personId ? [todo.personId] : prefillPersonId ? [prefillPersonId] : []
  );
  const [dueDate, setDueDate] = useState(() => {
    if (todo?.dueDate) return todo.dueDate.slice(0, 16);
    const d = new Date(); d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [repeat, setRepeat] = useState<TodoRepeat>(todo?.repeat ?? 'none');
  const [alert, setAlert] = useState<TodoAlert>(todo?.alert ?? 'none');

  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showAlertPicker, setShowAlertPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dueDateRef = useRef<HTMLInputElement>(null);

  const whoLabel = (() => {
    const total = familyIds.length + personIds.length;
    if (total === 0) return null;
    const names = [
      ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
      ...personIds.map((id) => data.people.find((p) => p.id === id)?.englishName ?? ''),
    ].filter(Boolean);
    if (total === 1) return names[0];
    return `${names[0]} +${total - 1} more`;
  })();

  const handleSave = () => {
    if (!title.trim()) return;
    const base = {
      title: title.trim(),
      dueDate: dueDate || undefined,
      repeat: repeat !== 'none' ? repeat : undefined,
      alert: alert !== 'none' ? alert : undefined,
    };
    if (isEditing && todo) {
      updateTodo(todo.id, { ...base, familyId: familyIds[0], personId: personIds[0] });
    } else {
      if (familyIds.length === 0 && personIds.length === 0) {
        addTodo(base);
      } else {
        for (const familyId of familyIds) addTodo({ ...base, familyId });
        for (const personId of personIds) addTodo({ ...base, personId });
      }
    }
    onClose();
  };

  function fmtDatetimeLocal(value: string) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function nowDatetimeLocal() {
    const d = new Date(); d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
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
                  />

                  {/* Due date */}
                  <button
                    className="field-row-hover"
                    onClick={() => dueDateRef.current?.showPicker()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      paddingTop: 12, paddingBottom: 12,
                      background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer', textAlign: 'left' as const, position: 'relative',
                    }}
                  >
                    <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                      <CalendarBlank size={16} />
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>Due date</span>
                    <span style={{ flex: 1, fontSize: 14, color: dueDate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {dueDate ? fmtDatetimeLocal(dueDate) : 'Not set'}
                    </span>
                    <CaretRight size={14} color="var(--text-muted)" />
                    <input
                      ref={dueDateRef}
                      type="datetime-local"
                      value={dueDate}
                      min={nowDatetimeLocal()}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{ position: 'absolute', left: 0, top: '50%', width: '100%', opacity: 0, pointerEvents: 'none', height: 1 }}
                    />
                  </button>

                  {/* Alert */}
                  <FieldRow
                    icon={<Bell size={16} />}
                    label="Alert"
                    value={alertLabel}
                    valueColor={alert === 'none' ? 'var(--text-muted)' : undefined}
                    onClick={() => setShowAlertPicker(true)}
                  />

                  {/* Repeat */}
                  <FieldRow
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

      {showAlertPicker && (
        <PickerMenu
          title="Alert"
          options={ALERT_OPTIONS}
          value={alert}
          onSelect={(v) => setAlert(v as TodoAlert)}
          onClose={() => setShowAlertPicker(false)}
        />
      )}
      {showRepeatPicker && (
        <PickerMenu
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
    </>
  );
}

function FieldRow({ icon, label, value, valueColor, onClick }: {
  icon: React.ReactNode; label: string; value: string; valueColor?: string; onClick: () => void;
}) {
  return (
    <button
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
      <span style={{ fontSize: 14, color: valueColor ?? 'var(--text-primary)', flex: 1 }}>{value}</span>
      <CaretRight size={14} color="var(--text-muted)" />
    </button>
  );
}

