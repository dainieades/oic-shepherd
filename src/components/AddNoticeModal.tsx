'use client';

import { useState, useRef } from 'react';
import { FirstAid, HandsPraying, DotsThree, CaretRight, Trash, UserPlus, PlusCircle, Warning, Minus, ArrowDown, User, Lock, Users, Globe } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { Notice, NoticeCategory, NoticeUrgency, NoticePrivacy } from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import { DeleteConfirmDialog } from './AddLogModal';

interface AddNoticeModalProps {
  onClose: () => void;
  prefillPersonId?: string;
  prefillFamilyId?: string;
  notice?: Notice;
}

const CATEGORIES: { value: NoticeCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'physical-need',  label: 'Physical Need',  icon: <FirstAid size={16} /> },
  { value: 'spiritual-need', label: 'Spiritual Need',  icon: <HandsPraying size={16} /> },
  { value: 'other',          label: 'Other',           icon: <DotsThree size={16} /> },
];

const PRIVACIES: { value: NoticePrivacy; label: string; icon: React.ReactNode }[] = [
  { value: 'pastor-only',          label: 'Pastor only',                icon: <Lock size={16} /> },
  { value: 'pastor-and-shepherds', label: 'Pastor and all shepherds',   icon: <Users size={16} /> },
  { value: 'everyone',             label: 'Everyone with app access',   icon: <Globe size={16} /> },
];

const URGENCIES: { value: NoticeUrgency; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'urgent',   label: 'Urgent',   description: 'Needs immediate attention from every shepherd', icon: <Warning size={16} /> },
  { value: 'moderate', label: 'Moderate', description: 'Worth keeping in mind actively',                icon: <Minus size={16} /> },
  { value: 'ongoing',  label: 'Ongoing',  description: 'Background awareness, no immediate action',     icon: <ArrowDown size={16} /> },
];

export const URGENCY_STYLE: Record<NoticeUrgency, { bg: string; color: string; border: string }> = {
  urgent:   { bg: 'var(--surface)', color: 'var(--red)',   border: 'var(--border-light)' },
  moderate: { bg: 'var(--surface)', color: 'var(--amber)', border: 'var(--border-light)' },
  ongoing:  { bg: 'var(--surface)', color: 'var(--blue)',  border: 'var(--border-light)' },
};

export default function AddNoticeModal({ onClose, prefillPersonId, prefillFamilyId, notice }: AddNoticeModalProps) {
  const { data, addNotice, updateNotice, deleteNotice } = useApp();
  const { showToast } = useToast();
  const isEditing = !!notice;

  const [category, setCategory] = useState<NoticeCategory>(notice?.category ?? 'physical-need');
  const [urgency, setUrgency] = useState<NoticeUrgency>(notice?.urgency ?? 'moderate');
  const [privacy, setPrivacy] = useState<NoticePrivacy>(notice?.privacy ?? 'pastor-and-shepherds');
  const [content, setContent] = useState(notice?.content ?? '');
  const [familyIds, setFamilyIds] = useState<string[]>(
    notice?.familyId ? [notice.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = useState<string[]>(
    notice?.personId ? [notice.personId] : prefillPersonId ? [prefillPersonId] : []
  );

  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categoryBtnRef = useRef<HTMLButtonElement>(null);
  const urgencyBtnRef = useRef<HTMLButtonElement>(null);
  const privacyBtnRef = useRef<HTMLButtonElement>(null);

  const whoNames = [
    ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
    ...personIds.map((id) => data.people.find((p) => p.id === id)?.englishName ?? ''),
  ].filter(Boolean);

  const whoLabel = (() => {
    if (whoNames.length === 0) return null;
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

  const canSave = content.trim().length > 0 && (familyIds.length > 0 || personIds.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    if (isEditing && notice) {
      updateNotice(notice.id, {
        category, urgency, privacy, content: content.trim(),
        familyId: familyIds[0],
        personId: personIds[0],
      });
      showToast('Notice updated');
    } else {
      for (const familyId of familyIds) {
        addNotice({ category, urgency, privacy, content: content.trim(), familyId });
      }
      for (const personId of personIds) {
        addNotice({ category, urgency, privacy, content: content.trim(), personId });
      }
      showToast('Notice added');
    }
    onClose();
  };

  const categoryItem = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];
  const urgencyItem = URGENCIES.find((u) => u.value === urgency) ?? URGENCIES[1];
  const urgencyStyle = URGENCY_STYLE[urgency];
  const privacyItem = PRIVACIES.find((p) => p.value === privacy) ?? PRIVACIES[1];

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
          {isEditing && notice && !showWhoPicker && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                position: 'absolute', bottom: 28, left: 24,
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--red-light)', border: '1.5px solid var(--red-border)',
                color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
              title="Delete notice"
            >
              <Trash size={18} />
            </button>
          )}

          {!showWhoPicker && (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
                <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{isEditing ? 'Edit notice' : 'Add notice'}</span>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  style={{ height: 32, padding: '0 14px', borderRadius: 8, background: canSave ? 'var(--sage)' : 'var(--border)', color: canSave ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, border: 'none', cursor: canSave ? 'pointer' : 'default' }}
                >Save</button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: `16px 20px ${isEditing ? 80 : 16}px`, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

                {/* Fields card */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden', padding: '0 16px', marginBottom: 16, flexShrink: 0 }}>
                  <div className="no-last-border" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                    {/* For whom — top row */}
                    <FieldRow
                      icon={<User size={16} />}
                      label="For"
                      value={whoLabel ?? 'Select…'}
                      valueColor={!whoLabel ? 'var(--text-muted)' : undefined}
                      onClick={() => setShowWhoPicker(true)}
                      trailingIcon={<PlusCircle size={22} color="var(--sage)" weight="fill" />}
                    />

                    {/* Category */}
                    <FieldRow
                      btnRef={categoryBtnRef}
                      icon={categoryItem.icon}
                      label="Category"
                      value={categoryItem.label}
                      onClick={() => setShowCategoryPicker(true)}
                    />

                    {/* Urgency */}
                    <button
                      ref={urgencyBtnRef}
                      className="field-row-hover"
                      onClick={() => setShowUrgencyPicker(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        paddingTop: 12, paddingBottom: 12,
                        background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer', textAlign: 'left' as const,
                      }}
                    >
                      <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: urgencyStyle.color }}>
                        {urgencyItem.icon}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>Urgency</span>
                      <span style={{ flex: 1 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: '999px',
                          background: urgencyStyle.bg, color: urgencyStyle.color,
                          border: `1px solid ${urgencyStyle.border}`,
                        }}>{urgencyItem.label}</span>
                      </span>
                      <CaretRight size={14} color="var(--text-muted)" />
                    </button>

                    {/* Privacy */}
                    <FieldRow
                      btnRef={privacyBtnRef}
                      icon={<Lock size={16} />}
                      label="Visible to"
                      value={privacyItem.label}
                      onClick={() => setShowPrivacyPicker(true)}
                    />

                    {/* Created by — edit mode */}
                    {isEditing && notice && (() => {
                      const creator = data.personas.find((p) => p.id === notice.createdBy);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 12 }}>
                          <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                            <UserPlus size={16} />
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>Added by</span>
                          <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{creator?.name ?? 'Unknown'}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Content textarea */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Notices are things worth flagging for your shepherds or pastor — a health condition, a difficult season, or anything that calls for collective awareness."
                  autoFocus={!isEditing}
                  style={{
                    flex: 1, width: '100%',
                    padding: 12, minHeight: 200,
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

      {showCategoryPicker && (
        <PickerMenu
          anchorRef={categoryBtnRef}
          title="Category"
          options={CATEGORIES}
          value={category}
          onSelect={(v) => setCategory(v as NoticeCategory)}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      {showUrgencyPicker && (
        <PickerMenu
          anchorRef={urgencyBtnRef}
          title="Urgency level"
          options={URGENCIES.map((u) => ({ value: u.value, label: u.label, icon: u.icon, description: u.description }))}
          value={urgency}
          onSelect={(v) => setUrgency(v as NoticeUrgency)}
          onClose={() => setShowUrgencyPicker(false)}
        />
      )}

      {showPrivacyPicker && (
        <PickerMenu
          anchorRef={privacyBtnRef}
          title="Visible to"
          options={PRIVACIES.map((p) => ({ value: p.value, label: p.label, icon: p.icon }))}
          value={privacy}
          onSelect={(v) => setPrivacy(v as NoticePrivacy)}
          onClose={() => setShowPrivacyPicker(false)}
        />
      )}

      {showDeleteConfirm && notice && (
        <DeleteConfirmDialog
          label="Delete this notice?"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => { deleteNotice(notice.id); onClose(); }}
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
      <span style={{ fontSize: 14, color: valueColor ?? 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>{value}</span>
      {trailingIcon ?? <CaretRight size={14} color="var(--text-muted)" />}
    </button>
  );
}
