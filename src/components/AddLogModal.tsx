'use client';

import { useState, useRef } from 'react';
import { CheckCircle, HandsPraying, CalendarBlank, NotePencil, CaretRight } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { NoteType, Note } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';

interface AddLogModalProps {
  onClose: () => void;
  prefillFamilyId?: string;
  prefillPersonId?: string;
  prefillContent?: string;
  prefillType?: NoteType;
  note?: Note;
}

const NOTE_TYPES: { value: NoteType; label: string; icon: React.ReactNode }[] = [
  { value: 'check-in',       label: 'Check-in',      icon: <CheckCircle size={16} /> },
  { value: 'prayer-request', label: 'Prayer request', icon: <HandsPraying size={16} /> },
  { value: 'event',          label: 'Event',          icon: <CalendarBlank size={16} /> },
  { value: 'general',        label: 'General note',   icon: <NotePencil size={16} /> },
];

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

function nowDatetimeLocal() {
  return toDatetimeLocal(new Date().toISOString());
}

function fmtDatetimeLocal(value: string) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AddLogModal({ onClose, prefillFamilyId, prefillPersonId, prefillContent, prefillType, note }: AddLogModalProps) {
  const { data, addNote, updateNote, deleteNote } = useApp();
  const isEditing = !!note;

  const [type, setType] = useState<NoteType>(note?.type ?? prefillType ?? 'check-in');
  const [familyIds, setFamilyIds] = useState<string[]>(
    note?.familyId ? [note.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = useState<string[]>(
    note?.personId ? [note.personId] : prefillPersonId ? [prefillPersonId] : []
  );
  const [content, setContent] = useState(note?.content ?? prefillContent ?? '');
  const [logDate, setLogDate] = useState(note?.createdAt ? toDatetimeLocal(note.createdAt) : nowDatetimeLocal());

  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const logDateRef = useRef<HTMLInputElement>(null);

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
    const createdAt = logDate ? new Date(logDate).toISOString() : new Date().toISOString();
    if (isEditing && note) {
      updateNote(note.id, {
        type,
        content: content || undefined,
        familyId: familyIds[0],
        personId: personIds[0],
        createdAt,
      });
    } else {
      if (familyIds.length === 0 && personIds.length === 0) return;
      for (const familyId of familyIds) {
        addNote({ type, familyId, content: content || undefined, visibility: 'public', createdAt });
      }
      for (const personId of personIds) {
        addNote({ type, personId, content: content || undefined, visibility: 'public', createdAt });
      }
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
          {/* Drag handle — fixed */}
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 0', flexShrink: 0 }} />

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
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
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
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden', padding: '0 16px', marginBottom: 16 }}>
                <div className="no-last-border" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* Type */}
                  <FieldRow
                    icon={typeItem.icon}
                    label="Type"
                    value={typeItem.label}
                    onClick={() => setShowTypePicker(true)}
                  />

                  {/* Who */}
                  <FieldRow
                    icon={<PersonIcon />}
                    label="Who"
                    value={whoLabel ?? 'Select…'}
                    valueColor={!whoLabel ? 'var(--text-muted)' : undefined}
                    onClick={() => setShowWhoPicker(true)}
                  />

                  {/* Date & Time */}
                  <button
                    className="field-row-hover"
                    onClick={() => logDateRef.current?.showPicker()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      paddingTop: 12, paddingBottom: 12,
                      background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer', textAlign: 'left' as const, position: 'relative',
                    }}
                  >
                    <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                      <CalendarIcon />
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>Date</span>
                    <span style={{ flex: 1, fontSize: 14, color: logDate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {logDate ? fmtDatetimeLocal(logDate) : 'Not set'}
                    </span>
                    <CaretRight size={14} color="var(--text-muted)" />
                    <input
                      ref={logDateRef}
                      type="datetime-local"
                      value={logDate}
                      max={nowDatetimeLocal()}
                      onChange={(e) => setLogDate(e.target.value)}
                      style={{ position: 'absolute', left: 0, top: '50%', width: '100%', opacity: 0, pointerEvents: 'none', height: 1 }}
                    />
                  </button>

                  {/* Created by — edit mode only */}
                  {isEditing && note && (() => {
                    const creator = data.personas.find((p) => p.id === note.createdBy);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 12 }}>
                        <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                          <PersonIcon />
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
                  placeholder="What happened or what was shared…"
                  style={{
                    flex: 1, width: '100%', marginTop: 0,
                    padding: 12, minHeight: 120,
                    background: 'var(--surface)', border: '1px solid var(--border-light)',
                    borderRadius: 10, fontSize: 14, color: 'var(--text-primary)',
                    resize: 'none', outline: 'none', lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showTypePicker && (
        <PickerMenu
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

function PersonIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
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
