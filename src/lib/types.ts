export type ThemePreference = 'light' | 'dark' | 'system';

export type Role = 'admin' | 'shepherd' | 'welcome-team';
export type AppRole = 'admin' | 'shepherd' | 'welcome-team' | 'no-access';

export interface Persona {
  id: string;
  name: string;
  role: Role;
  assignedPeopleIds: string[];
  personId?: string; // links to a Person in data
  userId?: string; // Supabase auth user ID
  themePreference?: ThemePreference;
  mapProvider?: 'apple' | 'google' | 'waze';
}

export type MembershipStatus = 'member' | 'non-member' | 'membership-track';

export type ChurchAttendance =
  | 'first-time-visitor'
  | 'regular'
  | 'on-leave'
  | 'fellowship-group-only'
  | 'archived';

export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'widowed' | 'divorced';

export const CHURCH_POSITIONS = [
  'Elder',
  'Deacon',
  'Communication Team',
  'Safety Team',
  'IT Team',
  'Welcome Team',
  'Operation',
  'Finance',
  'PEP',
  'Admin',
  'Mission',
  'Coffee',
] as const;

export interface Person {
  id: string;
  englishName: string;
  chineseName?: string;
  photo?: string;
  originalPhoto?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  birthday?: string; // YYYY-MM-DD
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
  churchPositions?: string[];
  membershipStatus: MembershipStatus;
  churchAttendance: ChurchAttendance;
  language: string[];
  assignedShepherdIds: string[];
  familyId?: string;
  groupIds: string[];
  followUpFrequencyDays: number;
  lastContactDate?: string; // ISO date
  nextFollowUpDate?: string; // ISO date
  isFirstTimeVisitor?: boolean;
  isChild?: boolean;
  createdAt: string;
  createdBy?: string; // persona ID
  lastEditedAt?: string;
  lastEditedByName?: string;
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
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  leaderIds: string[];
  shepherdIds: string[];
  memberIds: string[];
  relatedFamilyIds: string[];
}

export type NoteType = 'check-in' | 'prayer-request' | 'event' | 'general';
export type ContactMethod = 'call' | 'text' | 'in-person' | 'wechat';
export type NoteVisibility = 'private' | 'public';

export interface Note {
  id: string;
  personId?: string;
  familyId?: string;
  type: NoteType;
  visibility: NoteVisibility;
  content?: string;
  mentions?: string[]; // person IDs
  createdBy: string; // persona ID
  createdAt: string; // ISO datetime
}

export type TodoType = 'check-in' | 'task' | 'meeting' | 'message' | 'birthday' | 'anniversary';
export type TodoRepeat = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Todo {
  id: string;
  personId?: string;
  familyId?: string;
  title: string;
  dueDate?: string; // ISO datetime
  repeat?: TodoRepeat;
  completed: boolean;
  completedAt?: string; // ISO datetime
  createdBy: string; // persona ID
  createdAt: string; // ISO datetime
}

export type NoticeCategory = 'physical-need' | 'spiritual-need' | 'social-need' | 'psychological-need' | 'other';
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

export interface AppData {
  people: Person[];
  families: Family[];
  groups: Group[];
  notes: Note[];
  todos: Todo[];
  notices: Notice[];
  personas: Persona[];
}
