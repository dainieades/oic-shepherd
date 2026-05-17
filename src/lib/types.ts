export type ThemePreference = 'light' | 'dark' | 'system';

export type Role = 'admin' | 'shepherd';
export type AppRole = 'admin' | 'shepherd' | 'no-access';

export interface NotificationPreferences {
  personAdded: boolean;
  noticeAdded: boolean;
  shepherdAssigned: boolean;
  personUpdated: boolean;
  todoCreated: boolean;
}

/** @deprecated No longer read by UI — ICS feeds are stateless, app cannot verify which client subscribed. DB column retained until a future cleanup migration. */
export type CalendarConnectedApp = 'apple' | 'google' | 'other';

export interface Persona {
  id: string;
  name: string;
  role: Role;
  assignedPeopleIds: string[];
  personId?: string; // links to a Person in data
  userId?: string; // Supabase auth user ID
  email?: string;
  themePreference?: ThemePreference;
  mapProvider?: 'apple' | 'google' | 'waze';
  notificationPrefs?: NotificationPreferences;
  calendarSyncEnabled?: boolean;
  calendarFeedToken?: string | null;
  /** @deprecated No longer used by UI — see CalendarConnectedApp. */
  calendarConnectedApp?: CalendarConnectedApp | null;
  /** Derived from the linked person's flag at load time. Lets a shepherd review pending newcomer submissions. */
  canTriageVisitors?: boolean;
  isTest?: boolean;
}

export type MembershipStatus = 'member' | 'non-member' | 'membership-track';

export type ChurchAttendance =
  | 'visitor'
  | 'regular'
  | 'on-leave'
  | 'fellowship-group-only'
  | 'archived';

export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'widowed' | 'divorced';

export const CHURCH_POSITIONS = [
  'Admin',
  'Children',
  'Coffee',
  'Communication Team',
  'Deacon',
  'Elder',
  'Finance',
  'IT Team',
  'Kitchen',
  'Livestream',
  'Mission',
  'Nursery',
  'Operation',
  'Pastor',
  'PEP',
  'Safety Team',
  'Staff',
  'Welcome Team',
  'Word',
  'Worship Team',
  'Youth',
] as const;

export interface Person {
  id: string;
  preferredName: string;
  lastName?: string;
  alternativeName?: string;
  photo?: string;
  originalPhoto?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  birthday?: string; // YYYY-MM-DD
  baptized?: boolean;
  baptismDate?: string; // YYYY-MM-DD
  membershipDate?: string; // YYYY-MM-DD (member only)
  anniversary?: string; // YYYY-MM-DD (married only)
  phone?: string;
  homePhone?: string;
  email?: string;
  homeAddress?: string;
  isShepherd?: boolean;
  isBeingDiscipled?: boolean;
  appRole?: AppRole;
  /** Shepherd-only flag — grants access to the pending newcomer submissions queue. */
  canTriageVisitors?: boolean;
  churchPositions?: string[];
  isStudent?: boolean;
  membershipStatus: MembershipStatus;
  churchAttendance: ChurchAttendance;
  language: string[];
  assignedShepherdIds: string[];
  familyId?: string;
  groupIds: string[];
  lastContactDate?: string; // ISO date
  createdAt: string;
  createdBy?: string; // persona ID
  lastEditedAt?: string;
  lastEditedByName?: string;
  isTest?: boolean;
}

export interface Family {
  id: string;
  label: string;
  photo?: string;
  originalPhoto?: string;
  tags: string[];
  memberIds: string[]; // adult members
  childCount?: number; // number of children — names are never stored
  primaryContactId?: string;
  createdAt?: string;
  createdBy?: string; // persona ID
  lastEditedAt?: string;
  isTest?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  leaderIds: string[];
  memberIds: string[];
  relatedFamilyIds: string[];
  isTest?: boolean;
}

export type NoteType = 'check-in' | 'prayer-request' | 'event' | 'general';
export type ContactMethod = 'call' | 'text' | 'in-person' | 'wechat';
export type NoteVisibility = 'private' | 'public';

export interface Note {
  id: string;
  personId?: string;
  familyId?: string;
  todoId?: string;
  type: NoteType;
  visibility: NoteVisibility;
  content?: string;
  mentions?: string[]; // person IDs
  createdBy: string; // persona ID
  createdAt: string; // ISO datetime
}

export type TodoType = 'check-in' | 'task' | 'meeting' | 'message' | 'birthday' | 'anniversary';
export type TodoRepeat = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type TodoReminder =
  | 'none'
  // Timed-event options (relative to event start)
  | '30_min_before'
  | '1_hour_before'
  | '1_day_before'
  // Date-only options (specific time on a relative day)
  | 'same_day_9am'
  | 'day_before_9am'
  | 'day_before_5pm'
  | '2_days_before_9am'
  | '1_week_before_9am';

export interface Todo {
  id: string;
  personId?: string;
  familyId?: string;
  title: string;
  dueDate?: string; // ISO datetime
  endDate?: string; // ISO datetime
  repeat?: TodoRepeat;
  reminder?: TodoReminder;
  reminderDueAt?: string | null;
  reminderSentAt?: string | null;
  completed: boolean;
  completedAt?: string; // ISO datetime
  createdBy: string; // persona ID
  createdAt: string; // ISO datetime
}

export type NoticeCategory =
  | 'physical-need'
  | 'spiritual-need'
  | 'social-need'
  | 'psychological-need'
  | 'other';
export type NoticeUrgency = 'urgent' | 'moderate' | 'ongoing';
export type NoticePrivacy = 'pastor-only' | 'pastor-and-shepherds' | 'everyone';

export interface Notice {
  id: string;
  personId?: string;
  familyId?: string;
  categories: NoticeCategory[];
  urgency: NoticeUrgency;
  privacy: NoticePrivacy;
  content: string;
  createdBy: string; // persona ID
  createdAt: string; // ISO datetime
}

export interface AuditLog {
  id: string;
  personId: string;
  changedByPersonaId: string;
  changedByName: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export type ReferralSource = 'flyer' | 'online' | 'drive-by' | 'school' | 'friend' | 'other';
export const REFERRAL_SOURCES: readonly ReferralSource[] = [
  'flyer',
  'online',
  'drive-by',
  'school',
  'friend',
  'other',
] as const;

export type Interest = 'salvation' | 'growth' | 'serving' | 'small-groups';
export const INTERESTS: readonly Interest[] = [
  'salvation',
  'growth',
  'serving',
  'small-groups',
] as const;

export type VisitorSubmissionSource = 'app' | 'qr';
export type VisitorSubmissionStatus = 'pending' | 'promoted' | 'discarded';

export interface VisitorSubmission {
  id: string;
  submittedAt: string; // ISO datetime
  submittedBy?: string | null; // persona ID; null for QR path
  source: VisitorSubmissionSource;
  status: VisitorSubmissionStatus;
  personId?: string | null;
  preferredName: string;
  lastName?: string;
  alternativeName?: string;
  phone?: string;
  email?: string;
  isStudent: boolean;
  languages: string[];
  referralSource?: ReferralSource;
  referralDetail?: string;
  interests: Interest[];
  prayerRequest?: string;
}

export interface AppData {
  people: Person[];
  families: Family[];
  groups: Group[];
  notes: Note[];
  todos: Todo[];
  notices: Notice[];
  personas: Persona[];
}
