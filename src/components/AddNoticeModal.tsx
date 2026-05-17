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
import { Button } from './Button';
import {
  type Notice,
  type NoticeCategory,
  type NoticeUrgency,
  type NoticePrivacy,
} from '@/lib/types';
import { fullName } from '@/lib/utils';
import {
  BACKDROP_COLOR,
  NOTICE_VISIBILITY_WARNING_DISMISS_DAYS,
  NOTICE_VISIBILITY_WARNING_STORAGE_KEY,
  Z_NESTED,
} from '@/lib/constants';
import PersonFamilyPicker from './PersonFamilyPicker';
import PickerMenu from './PickerMenu';
import { CheckRow } from './CheckRow';
import { DeleteConfirmDialog } from './AddLogModal';

type ElevatedPrivacy = Exclude<NoticePrivacy, 'pastor-only'>;

function isElevatedPrivacy(privacy: NoticePrivacy): privacy is ElevatedPrivacy {
  return privacy === 'pastor-and-shepherds' || privacy === 'everyone';
}

function isVisibilityWarningDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(NOTICE_VISIBILITY_WARNING_STORAGE_KEY);
  if (!raw) return false;
  const dismissedAt = Date.parse(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const ageMs = Date.now() - dismissedAt;
  const windowMs = NOTICE_VISIBILITY_WARNING_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return ageMs < windowMs;
}

function rememberVisibilityWarningDismissal(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTICE_VISIBILITY_WARNING_STORAGE_KEY, new Date().toISOString());
}

interface AddNoticeModalProps {
  onClose: () => void;
  prefillPersonId?: string;
  prefillFamilyId?: string;
  notice?: Notice;
  readOnly?: boolean;
}

const CATEGORIES: {
  value: NoticeCategory;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
}[] = [
  {
    value: 'physical-need',
    label: 'Physical Need',
    icon: <FirstAid size={15} />,
    activeColor: 'var(--blue)',
    activeBg: 'var(--blue-light)',
  },
  {
    value: 'spiritual-need',
    label: 'Spiritual Need',
    icon: <HandsPraying size={15} />,
    activeColor: 'var(--sage)',
    activeBg: 'var(--sage-light)',
  },
  {
    value: 'social-need',
    label: 'Social Need',
    icon: <UsersThree size={15} />,
    activeColor: 'var(--amber)',
    activeBg: 'var(--amber-light)',
  },
  {
    value: 'psychological-need',
    label: 'Psychological Need',
    icon: <Brain size={15} />,
    activeColor: 'var(--teal)',
    activeBg: 'var(--teal-light)',
  },
  {
    value: 'other',
    label: 'Other',
    icon: <DotsThree size={15} />,
    activeColor: 'var(--text-muted)',
    activeBg: 'var(--border-light)',
  },
];

const PRIVACIES: { value: NoticePrivacy; label: string; icon: React.ReactNode }[] = [
  { value: 'pastor-only', label: 'Pastor only', icon: <Lock size={16} /> },
  { value: 'pastor-and-shepherds', label: 'Pastors and all shepherds', icon: <Users size={16} /> },
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

export const URGENCY_STYLE: Record<
  NoticeUrgency,
  { bg: string; color: string; border: string; pillBg: string }
> = {
  urgent: {
    bg: 'var(--surface)',
    color: 'var(--red)',
    border: 'var(--border-light)',
    pillBg: 'var(--red-light)',
  },
  moderate: {
    bg: 'var(--surface)',
    color: 'var(--amber)',
    border: 'var(--border-light)',
    pillBg: 'var(--amber-light)',
  },
  ongoing: {
    bg: 'var(--surface)',
    color: 'var(--blue)',
    border: 'var(--border-light)',
    pillBg: 'var(--blue-light)',
  },
};

export default function AddNoticeModal({
  onClose,
  prefillPersonId,
  prefillFamilyId,
  notice,
  readOnly = false,
}: AddNoticeModalProps) {
  const { data, addNotice, updateNotice, deleteNotice } = useApp();
  const { showToast } = useToast();
  const isEditing = !!notice;

  const [categories, setCategories] = React.useState<NoticeCategory[]>(notice?.categories ?? []);
  const [urgency, setUrgency] = React.useState<NoticeUrgency>(notice?.urgency ?? 'moderate');
  const [privacy, setPrivacy] = React.useState<NoticePrivacy>(
    notice?.privacy ?? 'pastor-and-shepherds'
  );
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
  const [showVisibilityWarning, setShowVisibilityWarning] = React.useState(false);

  const audienceCount = React.useMemo(() => {
    const real = data.personas.filter((p) => !p.isTest);
    if (privacy === 'everyone') return real.length;
    if (privacy === 'pastor-and-shepherds') {
      return real.filter((p) => p.role === 'admin' || p.role === 'shepherd').length;
    }
    return 0;
  }, [data.personas, privacy]);

  const categoryBtnRef = React.useRef<HTMLButtonElement>(null);
  const urgencyBtnRef = React.useRef<HTMLButtonElement>(null);
  const privacyBtnRef = React.useRef<HTMLButtonElement>(null);

  const whoNames = [
    ...familyIds.map((id) => data.families.find((f) => f.id === id)?.label ?? ''),
    ...personIds.map((id) => {
      const p = data.people.find((p) => p.id === id);
      return p ? fullName(p) : '';
    }),
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
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const persistNotice = () => {
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

  const handleSave = () => {
    if (!canSave) return;
    if (isElevatedPrivacy(privacy) && !isVisibilityWarningDismissed()) {
      setShowVisibilityWarning(true);
      return;
    }
    persistNotice();
  };
  const urgencyItem = URGENCIES.find((u) => u.value === urgency) ?? URGENCIES[1];
  const urgencyStyle = URGENCY_STYLE[urgency];
  const privacyItem = PRIVACIES.find((p) => p.value === privacy) ?? PRIVACIES[1];

  return (
    <>
      <BottomSheet onClose={onClose} variant="dialog">
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
        {isEditing && notice && !showWhoPicker && !readOnly && (
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
            {readOnly ? (
              <ReadOnlyNoticeHeader onClose={onClose} />
            ) : (
              <ModalHeader
                title={isEditing ? 'Edit notice' : 'Add notice'}
                onCancel={onClose}
                onAction={handleSave}
                actionLabel="Save"
                actionDisabled={!canSave}
              />
            )}

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: `1rem 1.25rem ${isEditing && !readOnly ? 80 : 16}px`,
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
                    onClick={readOnly ? undefined : () => setShowWhoPicker(true)}
                    trailingIcon={
                      readOnly ? null : (
                        <PlusCircle size={22} color="var(--sage)" weight="fill" />
                      )
                    }
                    readOnly={readOnly}
                  />

                  {/* Category */}
                  <FieldRow
                    btnRef={categoryBtnRef}
                    icon={
                      categories.length === 1 ? (
                        CATEGORIES.find((c) => c.value === categories[0])?.icon
                      ) : (
                        <DotsThree size={16} />
                      )
                    }
                    label="Category"
                    value={
                      categories.length === 0
                        ? 'Select…'
                        : categories.length === 1
                          ? (CATEGORIES.find((c) => c.value === categories[0])?.label ?? '')
                          : `${categories.length} selected`
                    }
                    valueColor={categories.length === 0 ? 'var(--text-muted)' : undefined}
                    onClick={readOnly ? undefined : () => setShowCategoryPicker((v) => !v)}
                    readOnly={readOnly}
                  />

                  {/* Urgency */}
                  <button
                    ref={urgencyBtnRef}
                    className={readOnly ? undefined : 'field-row-hover'}
                    onClick={readOnly ? undefined : () => setShowUrgencyPicker((v) => !v)}
                    disabled={readOnly}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      paddingBottom: 12,
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: readOnly ? 'not-allowed' : 'pointer',
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
                          userSelect: readOnly ? 'text' : undefined,
                          cursor: readOnly ? 'text' : undefined,
                        }}
                      >
                        {urgencyItem.label}
                      </span>
                    </span>
                    {!readOnly && <CaretRight size={14} color="var(--text-muted)" />}
                  </button>

                  {/* Privacy */}
                  <FieldRow
                    btnRef={privacyBtnRef}
                    icon={<Eye size={16} />}
                    label="Visible to"
                    value={privacyItem.label}
                    onClick={readOnly ? undefined : () => setShowPrivacyPicker((v) => !v)}
                    readOnly={readOnly}
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
                            {creator?.name ?? 'Unknown'} ·{' '}
                            {format(parseISO(notice.createdAt), 'MMM d, yyyy')}
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
                autoFocus={!isEditing && !readOnly}
                readOnly={readOnly}
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

      {showVisibilityWarning && isElevatedPrivacy(privacy) && (
        <NoticeVisibilityWarningDialog
          privacy={privacy}
          audienceCount={audienceCount}
          onCancel={() => setShowVisibilityWarning(false)}
          onConfirm={(dontShowAgain) => {
            if (dontShowAgain) rememberVisibilityWarningDismissal();
            setShowVisibilityWarning(false);
            persistNotice();
          }}
        />
      )}
    </>
  );
}

function ReadOnlyNoticeHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem 0.75rem',
        flexShrink: 0,
        borderBottom: '1px solid var(--border-light)',
        gap: 12,
      }}
    >
      <span style={{ width: 60, flexShrink: 0 }} />
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Notice
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            padding: '0.125rem 0.5rem',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--border-light)',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}
        >
          <Lock size={11} weight="bold" />
          View only
        </span>
      </span>
      <Button variant="primary" size="sm" onClick={onClose}>
        Close
      </Button>
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
  readOnly = false,
}: {
  btnRef?: React.RefObject<HTMLButtonElement | null>;
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  onClick?: () => void;
  trailingIcon?: React.ReactNode | null;
  readOnly?: boolean;
}) {
  const interactive = !!onClick;
  return (
    <button
      ref={btnRef}
      className={interactive ? 'field-row-hover' : undefined}
      onClick={onClick}
      disabled={!interactive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingTop: 12,
        paddingBottom: 12,
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border-light)',
        cursor: interactive ? 'pointer' : readOnly ? 'not-allowed' : 'default',
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
          userSelect: readOnly ? 'text' : undefined,
          cursor: readOnly ? 'text' : undefined,
        }}
      >
        {value}
      </span>
      {trailingIcon === null
        ? null
        : (trailingIcon ?? (interactive ? <CaretRight size={14} color="var(--text-muted)" /> : null))}
    </button>
  );
}

function NoticeVisibilityWarningDialog({
  privacy,
  audienceCount,
  onCancel,
  onConfirm,
}: {
  privacy: ElevatedPrivacy;
  audienceCount: number;
  onCancel: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const audienceLabel =
    privacy === 'everyone' ? 'everyone with app access' : 'all pastors and shepherds';
  const peopleLabel = audienceCount === 1 ? '1 person' : `${audienceCount} people`;
  const Icon = privacy === 'everyone' ? Globe : Users;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_NESTED,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 360,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.5rem 1.25rem 1rem', textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--amber-light)',
              color: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <Icon size={22} weight="bold" />
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
            }}
          >
            Post this notice?
          </p>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              margin: '0 0 0.5rem',
              lineHeight: 1.45,
            }}
          >
            It will be visible to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {audienceLabel} ({peopleLabel})
            </strong>
            .
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            They may receive an email notification when you post it.
          </p>
        </div>
        <div
          style={{
            padding: '0 1.25rem 0.75rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <CheckRow checked={dontShowAgain} onToggle={() => setDontShowAgain((v) => !v)}>
            Don&rsquo;t show this warning for {NOTICE_VISIBILITY_WARNING_DISMISS_DAYS} days
          </CheckRow>
        </div>
        <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 50,
              background: 'none',
              border: 'none',
              borderRight: '1px solid var(--border-light)',
              fontSize: 15,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(dontShowAgain)}
            style={{
              flex: 1,
              height: 50,
              background: 'none',
              border: 'none',
              fontSize: 15,
              color: 'var(--sage)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Post notice
          </button>
        </div>
      </div>
    </div>
  );
}
