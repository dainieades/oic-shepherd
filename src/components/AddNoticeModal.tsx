'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  FirstAid,
  HandsPraying,
  DotsThree,
  CaretRight,
  Trash,
  UserPlus,
  PlusCircle,
  Warning,
  Minus,
  ArrowDown,
  User,
  Lock,
  Users,
  Globe,
  Eye,
  UsersThree,
  Brain,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { BottomSheet, ModalHeader } from './BottomSheet';
import {
  type Notice,
  type NoticeCategory,
  type NoticeUrgency,
  type NoticePrivacy,
} from '@/lib/types';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import { DeleteConfirmDialog } from './AddLogModal';

interface AddNoticeModalProps {
  onClose: () => void;
  prefillPersonId?: string;
  prefillFamilyId?: string;
  notice?: Notice;
}

const CATEGORIES: { value: NoticeCategory; label: string; icon: React.ReactNode; activeColor: string; activeBg: string }[] = [
  { value: 'physical-need', label: 'Physical Need', icon: <FirstAid size={15} />, activeColor: 'var(--blue)', activeBg: 'var(--blue-light)' },
  { value: 'spiritual-need', label: 'Spiritual Need', icon: <HandsPraying size={15} />, activeColor: 'var(--sage)', activeBg: 'var(--sage-light)' },
  { value: 'social-need', label: 'Social Need', icon: <UsersThree size={15} />, activeColor: 'var(--amber)', activeBg: 'var(--amber-light)' },
  { value: 'psychological-need', label: 'Psychological Need', icon: <Brain size={15} />, activeColor: 'var(--teal)', activeBg: 'var(--teal-light)' },
  { value: 'other', label: 'Other', icon: <DotsThree size={15} />, activeColor: 'var(--text-muted)', activeBg: 'var(--border-light)' },
];

const PRIVACIES: { value: NoticePrivacy; label: string; icon: React.ReactNode }[] = [
  { value: 'pastor-only', label: 'Pastor only', icon: <Lock size={16} /> },
  { value: 'pastor-and-shepherds', label: 'Pastor and all shepherds', icon: <Users size={16} /> },
  { value: 'everyone', label: 'Everyone with app access', icon: <Globe size={16} /> },
];

const URGENCIES: {
  value: NoticeUrgency;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Needs immediate attention from every shepherd',
    icon: <Warning size={16} />,
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Worth keeping in mind actively',
    icon: <Minus size={16} />,
  },
  {
    value: 'ongoing',
    label: 'Ongoing',
    description: 'Background awareness, no immediate action',
    icon: <ArrowDown size={16} />,
  },
];

export const URGENCY_STYLE: Record<NoticeUrgency, { bg: string; color: string; border: string; pillBg: string }> = {
  urgent: { bg: 'var(--surface)', color: 'var(--red)', border: 'var(--border-light)', pillBg: 'var(--red-light)' },
  moderate: { bg: 'var(--surface)', color: 'var(--amber)', border: 'var(--border-light)', pillBg: 'var(--amber-light)' },
  ongoing: { bg: 'var(--surface)', color: 'var(--blue)', border: 'var(--border-light)', pillBg: 'var(--blue-light)' },
};

export default function AddNoticeModal({
  onClose,
  prefillPersonId,
  prefillFamilyId,
  notice,
}: AddNoticeModalProps) {
  const { data, addNotice, updateNotice, deleteNotice } = useApp();
  const { showToast } = useToast();
  const isEditing = !!notice;

  const [categories, setCategories] = React.useState<NoticeCategory[]>(notice?.categories ?? []);
  const [urgency, setUrgency] = React.useState<NoticeUrgency>(notice?.urgency ?? 'moderate');
  const [privacy, setPrivacy] = React.useState<NoticePrivacy>(notice?.privacy ?? 'pastor-and-shepherds');
  const [content, setContent] = React.useState(notice?.content ?? '');
  const [familyIds, setFamilyIds] = React.useState<string[]>(
    notice?.familyId ? [notice.familyId] : prefillFamilyId ? [prefillFamilyId] : []
  );
  const [personIds, setPersonIds] = React.useState<string[]>(
    notice?.personId ? [notice.personId] : prefillPersonId ? [prefillPersonId] : []
  );

  const [showWhoPicker, setShowWhoPicker] = React.useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = React.useState(false);
  const [showPrivacyPicker, setShowPrivacyPicker] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const categoryBtnRef = React.useRef<HTMLButtonElement>(null);
  const urgencyBtnRef = React.useRef<HTMLButtonElement>(null);
  const privacyBtnRef = React.useRef<HTMLButtonElement>(null);

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

  const toggleCategory = (cat: NoticeCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    if (!canSave) return;
    if (isEditing && notice) {
      updateNotice(notice.id, {
        categories,
        urgency,
        privacy,
        content: content.trim(),
        familyId: familyIds[0],
        personId: personIds[0],
      });
      showToast('Notice updated');
    } else {
      for (const familyId of familyIds) {
        addNotice({ categories, urgency, privacy, content: content.trim(), familyId });
      }
      for (const personId of personIds) {
        addNotice({ categories, urgency, privacy, content: content.trim(), personId });
      }
      showToast('Notice added');
    }
    onClose();
  };
  const urgencyItem = URGENCIES.find((u) => u.value === urgency) ?? URGENCIES[1];
  const urgencyStyle = URGENCY_STYLE[urgency];
  const privacyItem = PRIVACIES.find((p) => p.value === privacy) ?? PRIVACIES[1];

  return (
    <>
      <BottomSheet onClose={onClose}>
          {showWhoPicker && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <PersonFamilyPicker
                data={data}
                initialFamilyIds={familyIds}
                initialPersonIds={personIds}
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
          {isEditing && notice && !showWhoPicker && (
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
              title="Delete notice"
            >
              <Trash size={18} />
            </button>
          )}

          {!showWhoPicker && (
            <>
              <ModalHeader
                title={isEditing ? 'Edit notice' : 'Add notice'}
                onCancel={onClose}
                onAction={handleSave}
                actionLabel="Save"
                actionDisabled={!canSave}
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
                {/* Fields card */}
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
                      icon={categories.length === 1 ? CATEGORIES.find((c) => c.value === categories[0])?.icon : <DotsThree size={16} />}
                      label="Category"
                      value={
                        categories.length === 0
                          ? 'Select…'
                          : categories.length === 1
                            ? (CATEGORIES.find((c) => c.value === categories[0])?.label ?? '')
                            : `${categories.length} selected`
                      }
                      valueColor={categories.length === 0 ? 'var(--text-muted)' : undefined}
                      onClick={() => setShowCategoryPicker(true)}
                    />

                    {/* Urgency */}
                    <button
                      ref={urgencyBtnRef}
                      className="field-row-hover"
                      onClick={() => setShowUrgencyPicker(true)}
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
                        <Warning size={16} />
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          width: 60,
                          flexShrink: 0,
                        }}
                      >
                        Urgency
                      </span>
                      <span style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '0.1875rem 0.5625rem',
                            borderRadius: 'var(--radius-pill)',
                            background: urgencyStyle.bg,
                            color: urgencyStyle.color,
                            border: `1px solid ${urgencyStyle.border}`,
                          }}
                        >
                          {urgencyItem.label}
                        </span>
                      </span>
                      <CaretRight size={14} color="var(--text-muted)" />
                    </button>

                    {/* Privacy */}
                    <FieldRow
                      btnRef={privacyBtnRef}
                      icon={<Eye size={16} />}
                      label="Visible to"
                      value={privacyItem.label}
                      onClick={() => setShowPrivacyPicker(true)}
                    />

                    {/* Created by — edit mode */}
                    {isEditing &&
                      notice &&
                      (() => {
                        const creator = data.personas.find((p) => p.id === notice.createdBy);
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
                              Added by
                            </span>
                            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>
                              {creator?.name ?? 'Unknown'} · {format(parseISO(notice.createdAt), 'MMM d, yyyy')}
                            </span>
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
                    flex: 1,
                    width: '100%',
                    padding: 12,
                    minHeight: 200,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
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

      {showCategoryPicker && (
        <PickerMenu
          anchorRef={categoryBtnRef}
          title="Category"
          options={CATEGORIES}
          value={categories}
          multiSelect
          onSelect={(v) => toggleCategory(v as NoticeCategory)}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      {showUrgencyPicker && (
        <PickerMenu
          anchorRef={urgencyBtnRef}
          title="Urgency level"
          options={URGENCIES.map((u) => ({
            value: u.value,
            label: u.label,
            description: u.description,
          }))}
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
          onConfirm={() => {
            deleteNotice(notice.id);
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
