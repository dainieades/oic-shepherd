import type { HomeSortKey } from '@/lib/context';
import type { ReferralSource, Interest } from '@/lib/types';

export const SORT_OPTIONS: Array<{ key: HomeSortKey; label: string }> = [
  { key: 'last-contacted', label: 'Logged longest ago' },
  { key: 'last-contacted-recent', label: 'Logged most recently' },
  { key: 'name', label: 'First Name A → Z' },
  { key: 'name-desc', label: 'First Name Z → A' },
  { key: 'last-name', label: 'Last Name A → Z' },
  { key: 'last-name-desc', label: 'Last Name Z → A' },
];
export const SHEET_MAX_WIDTH = 430;
export const SHEET_BORDER_RADIUS = '1.25rem 1.25rem 0 0';
export const BACKDROP_COLOR = 'var(--backdrop)';

export const Z_SUBHEADER = 39;
export const Z_HEADER = 40;
export const Z_DROPDOWN = 50;
export const Z_MODAL = 60;
export const Z_SHEET = 70;
export const Z_NESTED = 80;
export const Z_FLOAT = 90;
export const Z_TOAST = 200;

export const MEMBER_AVATAR_PALETTE: Array<{ bg: string; color: string }> = [
  { bg: 'var(--avatar-m1-bg)', color: 'var(--avatar-m1-text)' },
  { bg: 'var(--avatar-m2-bg)', color: 'var(--avatar-m2-text)' },
  { bg: 'var(--avatar-m3-bg)', color: 'var(--avatar-m3-text)' },
  { bg: 'var(--avatar-m4-bg)', color: 'var(--avatar-m4-text)' },
  { bg: 'var(--avatar-m5-bg)', color: 'var(--avatar-m5-text)' },
  { bg: 'var(--avatar-m6-bg)', color: 'var(--avatar-m6-text)' },
];

export const SAVE_ERROR_MSG = 'Failed to save changes. Try again.';

export const archiveConfirmCopy = (firstName: string, isArchived: boolean) => ({
  title: `${isArchived ? 'Unarchive' : 'Archive'} ${firstName}?`,
  description: isArchived
    ? 'They will be visible in the directory again.'
    : "They'll be hidden from the default directory. You can unarchive them anytime — nothing is deleted.",
  confirmLabel: isArchived ? 'Unarchive' : 'Archive',
});

export const deletePersonConfirmCopy = (firstName: string) => ({
  title: `Delete ${firstName}?`,
  description: `This will permanently remove ${firstName} and all their logs and to-dos. This cannot be undone.`,
  confirmLabel: 'Delete permanently',
});

export const NOTICE_VISIBILITY_WARNING_STORAGE_KEY =
  'shepherd-app-notice-visibility-warning-dismissed-at';
export const NOTICE_VISIBILITY_WARNING_DISMISS_DAYS = 30;

export const REFERRAL_LABELS: Record<ReferralSource, string> = {
  flyer: 'Flyer',
  online: 'Online',
  'drive-by': 'Drive-by',
  school: 'School',
  friend: 'Friend',
  other: 'Other',
};

export const INTEREST_LABELS: Record<Interest, string> = {
  salvation: 'Salvation',
  growth: 'Growth in Christ',
  serving: 'Serving',
  'small-groups': 'Small Groups',
};

export const SHEPHERD_AVATAR_PALETTE: Array<{ bg: string; color: string }> = [
  { bg: 'var(--avatar-s1-bg)', color: 'var(--avatar-s1-text)' },
  { bg: 'var(--avatar-s2-bg)', color: 'var(--avatar-s2-text)' },
  { bg: 'var(--avatar-s3-bg)', color: 'var(--avatar-s3-text)' },
  { bg: 'var(--avatar-s4-bg)', color: 'var(--avatar-s4-text)' },
];
