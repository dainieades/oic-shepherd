'use client';

import { useState, useRef } from 'react';
import { CheckCircle, HandsPraying, CalendarBlank, NotePencil, CaretRight, Trash, User, UserPlus, PlusCircle } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { NoteType, Note } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import DatePickerSheet from './DatePickerSheet';

interface AddLogModalProps {
  onClose: () => void;
  prefillFamilyId?: string;
  prefillPersonId?: string;
  prefillContent?: string;
  prefillType?: NoteType;
  note?: Note;
}

const NOTE_TYPES: { value: NoteType; label: string; icon: React.ReactNode }[] = [
  { value: 'check-in',       label: 'Follow-up',     icon: <CheckCircle size={16} /> },
  { value: 'prayer-request', label: 'Prayer request', icon: <HandsPraying size={16} /> },
  { value: 'event',          label: 'Event',          icon: <CalendarBlank size={16} /> },
  { value: 'general',        label: 'General note',   icon: <NotePencil size={16} /> },
];

function fmtLogDate(dateStr: string, timeStr: string, includeTime: boolean) {
  const d = new Date(dateStr + 'T12:00:00');
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!includeTime) return datePart;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${datePart}, ${h12}:${mStr} ${ampm}`;
}

export default function AddLogModal({ onClose, prefillFamilyId, prefillPersonId, prefillContent, prefillType, note }: AddLogModalProps) {
  const { data, addNote, updateNote, deleteNote } = useApp();
  const { showToast } = useToast();
  const isEditing = !!note;

  const [type, setType] = useState<NoteType>(note?.type ?? prefillType ?? 'check-in');
  const [familyIds, setFamilyIds] = useState<string[]>(
    note?.familyId ? [note.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = useState<string[]>(
    note?.personId ? [note.personId] : prefillPersonId ? [prefillPersonId] : []
  );
  const [content, setContent] = useState(note?.content ?? prefillContent ?? '');
  const [dateStr, setDateStr] = useState(() => {
    if (note?.createdAt) return note.createdAt.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  });
  const [timeStr, setTimeStr] = useState(() => {
    if (note?.createdAt) return note.createdAt.slice(11, 16);
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [includeTime, setIncludeTime] = useState(true);

  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const typeBtnRef = useRef<HTMLButtonElement>(null);

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
        addNote({ type, familyId, content: content || undefined, visibility: 'public', createdAt });
      }
      for (const personId of personIds) {
        addNote({ type, personId, content: content || undefined, visibility: 'public', createdAt });
      }
      showToast('Log saved');
    }
    onClose();
  };

  const typeItem = NOTE_TYPES.find((t) => t.value === type) ?? NOTE_TYPES[0];

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

          {/* Floating delete button */}
          {isEditing && note && !showWhoPicker && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                position: 'absolute', bottom: 28, left: 24,
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--red-light)', border: '1.5px solid var(--red-border)',
                color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
              title="Delete log"
            >
              <Trash size={18} />
            </button>
          )}

          {!showWhoPicker && (
            <>
              {/* Header — fixed */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
                <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{isEditing ? 'Edit log' : 'Add log'}</span>
                <button onClick={handleSave} style={{ height: 32, padding: '0 14px', borderRadius: 8, background: 'var(--sage)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Save</button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: `16px 20px ${isEditing ? 80 : 16}px`, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
                {/* Fields */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden', padding: '0 16px', marginBottom: 16, flexShrink: 0 }}>
                <div className="no-last-border" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* Type */}
                  <FieldRow
                    btnRef={typeBtnRef}
                    icon={typeItem.icon}
                    label="Type"
                    value={typeItem.label}
                    onClick={() => setShowTypePicker(true)}
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
                    value={fmtLogDate(dateStr, timeStr, includeTime)}
                    onClick={() => setShowDatePicker(true)}
                  />

                  {/* Created by — edit mode only */}
                  {isEditing && note && (() => {
                    const creator = data.personas.find((p) => p.id === note.createdBy);
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

                {/* Note content */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Logs capture past interactions — a conversation, a check-in, a prayer request, or a moment you shared together."
                  style={{
                    flex: 1, width: '100%', marginTop: 0,
                    padding: 12, minHeight: 220,
                    background: 'var(--surface)', border: '1px solid var(--border-light)',
                    borderRadius: 10, fontSize: 14, color: 'var(--text-primary)',
                    resize: 'vertical', outline: 'none', lineHeight: 1.5,
                    boxSizing: 'border-box',
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
          onConfirm={() => { deleteNote(note.id); onClose(); }}
        />
      )}
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


export function DeleteConfirmDialog({ label, onCancel, onConfirm }: {
  label: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(30,26,24,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 320, overflow: 'hidden' }}>
        <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>{label}</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>This action cannot be undone.</p>
        </div>
        <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, height: 50, background: 'none', border: 'none', borderRight: '1px solid var(--border-light)', fontSize: 15, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, height: 50, background: 'none', border: 'none', fontSize: 15, color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}
