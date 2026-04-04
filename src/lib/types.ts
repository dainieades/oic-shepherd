export type Role = 'admin' | 'shepherd' | 'welcome-team';
export type AppRole = 'admin' | 'shepherd' | 'welcome-team' | 'no-access';

export interface Persona {
  id: string;
  name: string;
  role: Role;
  assignedPeopleIds: string[];
  personId?: string; // links to a Person in data
  userId?: string;   // Supabase auth user ID
}

export type MembershipStatus =
  | 'member'
  | 'sunday-attendee'
  | 'fellowship-attendee'
  | 'membership-class'
  | 'archive';

export type Language = 'english' | 'chinese' | 'bilingual';
export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'widowed' | 'divorced';

export const CHURCH_POSITIONS = [
  'Elder', 'Deacon', 'Communication Team', 'Safety Team', 'IT Team',
  'Welcome Team', 'Operation', 'Finance', 'PEP', 'Admin', 'Mission', 'Coffee',
] as const;

export interface Person {
  id: string;
  englishName: string;
  chineseName?: string;
  photo?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  birthday?: string;       // YYYY-MM-DD
  baptismDate?: string;    // YYYY-MM-DD
  membershipDate?: string; // YYYY-MM-DD (member only)
  anniversary?: string;    // YYYY-MM-DD (married only)
  phone?: string;
  homePhone?: string;
  email?: string;
  homeAddress?: string;
  spiritualNeeds?: string;
  physicalNeeds?: string;
  isShepherd?: boolean;
  isBeingDiscipled?: boolean;
  appRole?: AppRole;
  churchPositions?: string[];
  membershipStatus: MembershipStatus;
  language: Language;
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
}

export interface Family {
  id: string;
  label: string;
  photo?: string;
  tags: string[];
  memberIds: string[];  // adult members
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
export type TodoAlert = 'none' | 'on-time' | '5min' | '15min' | '30min' | '1hour' | '1day' | '2days';
export type TodoRepeat = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Todo {
  id: string;
  personId?: string;
  familyId?: string;
  title: string;
  dueDate?: string; // ISO datetime
  repeat?: TodoRepeat;
  alert?: TodoAlert;
  completed: boolean;
  completedAt?: string; // ISO datetime
  createdBy: string; // persona ID
  createdAt: string; // ISO datetime
}

export interface AppData {
  people: Person[];
  families: Family[];
  groups: Group[];
  notes: Note[];
  todos: Todo[];
  personas: Persona[];
}
