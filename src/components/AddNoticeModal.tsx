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
  NOTICE_VISIBILITY_WARNING_DISMISS_DAYS,
  NOTICE_VISIBILITY_WARNING_STORAGE_KEY,
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
  { value: 'pastor-only', label: 'Pastor and You', icon: <Lock size={16} /> },
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
          <div className="flex-1 overflow-hidden flex flex-col">
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
            className="absolute bottom-7 left-6 w-11 h-11 rounded-full bg-red-light border border-red-border text-red flex items-center justify-center cursor-pointer shadow-[var(--shadow-card)]"
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
              className="flex-1 overflow-y-auto bg-bg flex flex-col"
              style={{ padding: `1rem 1.25rem ${isEditing && !readOnly ? 80 : 16}px` }}
            >
              {/* Fields card */}
              <div className="bg-surface rounded border border-border-light overflow-hidden px-4 mb-4 shrink-0">
                <div className="no-last-border flex flex-col">
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
                    className={`flex items-center gap-2.5 py-3 bg-transparent border-none border-b border-border-light text-left${readOnly ? ' cursor-not-allowed' : ' cursor-pointer'}${readOnly ? '' : ' field-row-hover'}`}
                    onClick={readOnly ? undefined : () => setShowUrgencyPicker((v) => !v)}
                    disabled={readOnly}
                  >
                    <span className="w-6 flex justify-center shrink-0 text-text-muted">
                      <Warning size={16} />
                    </span>
                    <span className="text-12 text-text-muted w-[60px] shrink-0">
                      Urgency
                    </span>
                    <span className="flex-1">
                      <span
                        className="text-12 font-semibold rounded-pill border"
                        style={{
                          padding: '0.1875rem 0.5625rem',
                          background: urgencyStyle.bg,
                          color: urgencyStyle.color,
                          borderColor: urgencyStyle.border,
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
                        <div className="flex items-center gap-2.5 py-3">
                          <span className="w-6 flex justify-center shrink-0 text-text-muted">
                            <UserPlus size={16} />
                          </span>
                          <span className="text-12 text-text-muted w-[60px] shrink-0">
                            Added by
                          </span>
                          <span className="flex-1 text-14 text-text-secondary">
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
                className="flex-1 w-full p-3 min-h-[200px] bg-surface border border-border-light rounded-sm text-14 text-text-primary resize-y outline-none leading-normal box-border"
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
    <div className="flex items-center justify-between py-[0.875rem] px-5 pb-3 shrink-0 border-b border-border-light gap-3">
      <span className="w-[60px] shrink-0" />
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-15 font-semibold text-text-primary">
          Notice
        </span>
        <span className="inline-flex items-center gap-1 text-11 font-semibold py-0.5 px-2 rounded-pill bg-[var(--border-light)] text-text-muted tracking-wide-2">
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
  const cursorClass = interactive ? 'cursor-pointer' : readOnly ? 'cursor-not-allowed' : 'cursor-default';
  return (
    <button
      ref={btnRef}
      className={`flex items-center gap-2.5 py-3 bg-transparent border-none border-b border-border-light text-left ${cursorClass}${interactive ? ' field-row-hover' : ''}`}
      onClick={onClick}
      disabled={!interactive}
    >
      <span className="w-6 flex justify-center shrink-0 text-text-muted">
        {icon}
      </span>
      <span className="text-12 text-text-muted w-[60px] shrink-0">
        {label}
      </span>
      <span
        className="text-14 flex-1 break-words"
        style={{
          color: valueColor ?? 'var(--text-primary)',
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
    privacy === 'everyone' ? 'everyone with access' : 'the pastor and you';
  const peopleLabel = audienceCount === 1 ? '1 person' : `${audienceCount} people`;
  const Icon = privacy === 'everyone' ? Globe : Users;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-8 z-nested bg-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-surface rounded-[16px] w-full max-w-[360px] overflow-hidden">
        <div className="px-5 pt-6 pb-4 text-center">
          <div className="w-11 h-11 rounded-full bg-amber-light text-amber flex items-center justify-center mx-auto mb-3">
            <Icon size={22} weight="bold" />
          </div>
          <p className="text-16 font-semibold text-text-primary mt-0 mb-2">
            Post this notice?
          </p>
          <p className="text-14 text-text-secondary mt-0 mb-2 leading-semi">
            It will be visible to{' '}
            <strong className="text-text-primary">
              {audienceLabel} ({peopleLabel})
            </strong>
            .
          </p>
          <p className="text-13 text-text-muted m-0 leading-semi">
            They may receive an email notification when you post it.
          </p>
        </div>
        <div className="px-5 pb-3 flex justify-center">
          <CheckRow checked={dontShowAgain} onToggle={() => setDontShowAgain((v) => !v)}>
            Don&rsquo;t show this warning for {NOTICE_VISIBILITY_WARNING_DISMISS_DAYS} days
          </CheckRow>
        </div>
        <div className="border-t border-border-light flex">
          <button
            onClick={onCancel}
            className="flex-1 h-[50px] bg-transparent border-none border-r border-border-light text-15 text-text-secondary cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(dontShowAgain)}
            className="flex-1 h-[50px] bg-transparent border-none text-15 text-sage cursor-pointer font-semibold"
          >
            Post notice
          </button>
        </div>
      </div>
    </div>
  );
}
