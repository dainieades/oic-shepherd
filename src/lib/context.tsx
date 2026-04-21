'use client';

import { addDays, parseISO, formatISO } from 'date-fns';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  type AppData,
  type Persona,
  type Person,
  type Family,
  type Note,
  type Todo,
  type Notice,
  type AppRole,
  type ChurchAttendance,
  type MembershipStatus,
  type ThemePreference,
} from './types';
import {
  PersonRowSchema,
  FamilyRowSchema,
  PersonaRowSchema,
  NoteRowSchema,
  NoticeRowSchema,
  TodoRowSchema,
  type PersonRow,
  type FamilyRow,
  type NoteRow,
  type NoticeRow,
  type TodoRow,
  type GroupRow,
} from './schemas';

// ── Shared filter types (exported so pages can import them) ──────────────────

export type HomeSortKey = 'last-contacted' | 'last-contacted-recent' | 'name' | 'name-desc';

export interface HomeFilters {
  shepherds: string[];
  memberships: MembershipStatus[];
  attendances: ChurchAttendance[];
  groups: string[];
  archiveFilter: 'hide' | 'include' | 'only';
  discipleship: ('in' | 'not-in')[];
  appRoles: AppRole[];
  positions: string[];
  languages: string[];
}

export const HOME_DEFAULT_FILTERS: HomeFilters = {
  shepherds: ['mine'],
  memberships: [],
  attendances: [],
  groups: [],
  archiveFilter: 'hide',
  discipleship: [],
  appRoles: [],
  positions: [],
  languages: [],
};
import { initialData } from './data';
import { generateId } from './utils';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/Toast';
import { DEFAULT_FOLLOW_UP_DAYS } from '@/lib/constants';

interface AppContextType {
  data: AppData;
  currentPersona: Persona;
  accessDenied: boolean;
  switchPersona: (id: string) => void;
  loginWithSupabaseUser: (userId: string, name: string, email?: string, avatarUrl?: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }) => void;
  updateNote: (
    noteId: string,
    updates: Partial<
      Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>
    >
  ) => void;
  deleteNote: (noteId: string) => void;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>) => void;
  updateTodo: (
    todoId: string,
    updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'repeat' | 'familyId' | 'personId'>>
  ) => void;
  deleteTodo: (todoId: string) => void;
  toggleTodo: (todoId: string) => void;
  addPerson: (
    person: Omit<
      Person,
      'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds' | 'followUpFrequencyDays'
    >
  ) => Promise<string>;
  deletePerson: (personId: string) => void;
  addFamily: (label: string, memberIds: string[]) => void;
  updatePerson: (
    personId: string,
    updates: Partial<
      Pick<
        Person,
        | 'englishName'
        | 'chineseName'
        | 'photo'
        | 'phone'
        | 'homePhone'
        | 'email'
        | 'homeAddress'
        | 'membershipStatus'
        | 'churchAttendance'
        | 'membershipDate'
        | 'language'
        | 'gender'
        | 'maritalStatus'
        | 'birthday'
        | 'baptismDate'
        | 'anniversary'
        | 'followUpFrequencyDays'
        | 'spiritualNeeds'
        | 'physicalNeeds'
        | 'isShepherd'
        | 'isBeingDiscipled'
        | 'churchPositions'
        | 'appRole'
      >
    >
  ) => Promise<void>;
  assignShepherds: (personId: string, shepherdIds: string[]) => Promise<void>;
  updateFamily: (
    familyId: string,
    updates: Partial<Pick<Family, 'label' | 'photo' | 'primaryContactId' | 'childCount'>>
  ) => Promise<void>;
  updateFamilyMembers: (familyId: string, memberIds: string[]) => Promise<void>;
  addGroup: (name: string, description?: string) => void;
  updateGroup: (
    groupId: string,
    updates: Partial<
      Pick<import('./types').Group, 'name' | 'description' | 'leaderIds' | 'shepherdIds'>
    >
  ) => void;
  updateGroupMembers: (groupId: string, memberIds: string[]) => void;
  assignGroupsToPerson: (personId: string, groupIds: string[]) => Promise<void>;
  assignGroupsToFamily: (familyId: string, groupIds: string[]) => Promise<void>;
  assignShepherdsToFamily: (familyId: string, shepherdIds: string[]) => Promise<void>;
  setFollowUpFrequency: (personId: string, days: number) => void;
  canViewNote: (note: Note) => boolean;
  addNotice: (notice: Omit<Notice, 'id' | 'createdBy' | 'createdAt'>) => void;
  updateNotice: (
    noticeId: string,
    updates: Partial<
      Pick<Notice, 'categories' | 'urgency' | 'privacy' | 'content' | 'personId' | 'familyId'>
    >
  ) => void;
  deleteNotice: (noticeId: string) => void;
  // Persistent filter state (survives tab navigation within a session)
  homeFilters: HomeFilters;
  setHomeFilters: Dispatch<SetStateAction<HomeFilters>>;
  homeSortKey: HomeSortKey;
  setHomeSortKey: Dispatch<SetStateAction<HomeSortKey>>;
  todosShepherdFilter: string[];
  setTodosShepherdFilter: Dispatch<SetStateAction<string[]>>;
  logsShepherdFilter: string[];
  setLogsShepherdFilter: Dispatch<SetStateAction<string[]>>;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ── DB row → AppData mappers ──────────────────────────────────────────────

function mapPerson(
  row: Record<string, unknown>,
  shepherdIds: string[],
  groupIds: string[]
): Person {
  const r = PersonRowSchema.parse(row);
  return {
    id: r.id,
    englishName: r.english_name,
    chineseName: r.chinese_name ?? undefined,
    photo: r.photo ?? undefined,
    gender: r.gender ?? undefined,
    maritalStatus: r.marital_status ?? undefined,
    birthday: r.birthday ?? undefined,
    baptismDate: r.baptism_date ?? undefined,
    membershipDate: r.membership_date ?? undefined,
    anniversary: r.anniversary ?? undefined,
    phone: r.phone ?? undefined,
    homePhone: r.home_phone ?? undefined,
    email: r.email ?? undefined,
    homeAddress: r.home_address ?? undefined,
    spiritualNeeds: r.spiritual_needs ?? undefined,
    physicalNeeds: r.physical_needs ?? undefined,
    isShepherd: r.is_shepherd ?? undefined,
    isBeingDiscipled: r.is_being_discipled ?? undefined,
    appRole: r.app_role ?? 'no-access',
    churchPositions: r.church_positions ?? undefined,
    membershipStatus: r.membership_status,
    churchAttendance: r.church_attendance ?? 'regular',
    language: (() => {
      const raw = r.language;
      if (!raw) return ['English'];
      if (raw.startsWith('[')) {
        try {
          return JSON.parse(raw) as string[];
        } catch {
          return ['English'];
        }
      }
      const legacyMap: Record<string, string> = {
        english: 'English',
        chinese: 'Mandarin Chinese',
        bilingual: 'English',
      };
      return [legacyMap[raw] ?? 'English'];
    })(),
    familyId: r.family_id ?? undefined,
    followUpFrequencyDays: r.follow_up_frequency_days ?? DEFAULT_FOLLOW_UP_DAYS,
    lastContactDate: r.last_contact_date ?? undefined,
    nextFollowUpDate: r.next_follow_up_date ?? undefined,
    isFirstTimeVisitor: r.is_first_time_visitor ?? undefined,
    isChild: r.is_child ?? undefined,
    assignedShepherdIds: shepherdIds,
    groupIds,
    createdAt: r.created_at,
    createdBy: r.created_by ?? undefined,
  };
}

function mapFamily(row: Record<string, unknown>, memberIds: string[]): Family {
  const r = FamilyRowSchema.parse(row);
  return {
    id: r.id,
    label: r.label,
    photo: r.photo ?? undefined,
    tags: r.tags ?? [],
    childCount: r.child_count ?? undefined,
    primaryContactId: r.primary_contact_id ?? undefined,
    memberIds,
    createdAt: r.created_at ?? undefined,
    createdBy: r.created_by ?? undefined,
  };
}

function mapPersona(row: Record<string, unknown>, assignedPeopleIds: string[]): Persona {
  const r = PersonaRowSchema.parse(row);
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    personId: r.person_id ?? undefined,
    userId: r.user_id ?? undefined,
    assignedPeopleIds,
  };
}

/** Google profile pictures live on this domain — lets us distinguish from user-uploaded photos. */
function isGoogleAvatarUrl(url: string): boolean {
  return url.startsWith('https://lh3.googleusercontent.com/');
}

/**
 * Persist the Google profile picture into the linked person's photo field.
 * Only writes if the person has no photo yet or their current photo is a
 * Google avatar URL (i.e. not a custom upload). This lets the Google picture
 * auto-refresh on each sign-in while respecting user-uploaded overrides.
 */
async function syncGoogleAvatar(
  supabase: ReturnType<typeof createClient>,
  personId: string,
  avatarUrl: string,
  setData: React.Dispatch<React.SetStateAction<AppData>>
) {
  const { data: row } = await supabase
    .from('people')
    .select('photo')
    .eq('id', personId)
    .maybeSingle();
  if (row && (!row.photo || isGoogleAvatarUrl(row.photo))) {
    await supabase.from('people').update({ photo: avatarUrl }).eq('id', personId);
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === personId ? { ...p, photo: avatarUrl } : p)),
    }));
  }
}

function mapNote(row: Record<string, unknown>): Note {
  const r = NoteRowSchema.parse(row);
  return {
    id: r.id,
    personId: r.person_id ?? undefined,
    familyId: r.family_id ?? undefined,
    type: r.type,
    visibility: r.visibility,
    content: r.content ?? undefined,
    mentions: r.mentions ?? [],
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function mapNotice(row: Record<string, unknown>): Notice {
  const r = NoticeRowSchema.parse(row);
  return {
    id: r.id,
    personId: r.person_id ?? undefined,
    familyId: r.family_id ?? undefined,
    categories: r.categories,
    urgency: r.urgency,
    privacy: r.privacy ?? 'pastor-and-shepherds',
    content: r.content,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function mapTodo(row: Record<string, unknown>): Todo {
  const r = TodoRowSchema.parse(row);
  return {
    id: r.id,
    personId: r.person_id ?? undefined,
    familyId: r.family_id ?? undefined,
    title: r.title,
    dueDate: r.due_date ?? undefined,
    repeat: r.repeat ?? undefined,
    completed: r.completed ?? false,
    completedAt: r.completed_at ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

// ── AppProvider ───────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [data, setData] = useState<AppData>(initialData);
  const [currentPersona, setCurrentPersona] = useState<Persona>(initialData.personas[0]);
  const [loaded, setLoaded] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // ── Theme preference ─────────────────────────────────────────────────
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const stored = localStorage.getItem('shepherd-app-theme') as ThemePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemePreferenceState(stored);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (themePreference === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (themePreference === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
  }, [themePreference]);

  const setThemePreference = useCallback((pref: ThemePreference): void => {
    setThemePreferenceState(pref);
    localStorage.setItem('shepherd-app-theme', pref);
  }, []);

  // ── Persistent page filter state ─────────────────────────────────────
  const [homeFilters, setHomeFilters] = useState<HomeFilters>(HOME_DEFAULT_FILTERS);
  const [homeSortKey, setHomeSortKey] = useState<HomeSortKey>('last-contacted');
  const [todosShepherdFilter, setTodosShepherdFilter] = useState<string[]>(['mine']);
  const [logsShepherdFilter, setLogsShepherdFilter] = useState<string[]>(['mine']);

  // ── Load all data from Supabase on mount ─────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        { data: peopleRows },
        { data: familyRows },
        { data: familyMemberRows },
        { data: groupRows },
        { data: groupMemberRows },
        { data: personShepherdRows },
        { data: personaRows },
        { data: personaPeopleRows },
        { data: noteRows },
        { data: todoRows },
        { data: noticeRows },
      ] = await Promise.all([
        supabase.from('people').select('*'),
        supabase.from('families').select('*'),
        supabase.from('family_members').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('group_members').select('*'),
        supabase.from('person_shepherds').select('*'),
        supabase.from('personas').select('*'),
        supabase.from('persona_people').select('*'),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('todos').select('*').order('created_at', { ascending: false }),
        supabase.from('notices').select('*').order('created_at', { ascending: false }),
      ]);

      // If no data in Supabase yet, fall back to seed data (before migration is run)
      if (!peopleRows || peopleRows.length === 0) {
        setLoaded(true);
        return;
      }

      // Build lookup maps
      const shepherdsByPerson: Record<string, string[]> = {};
      for (const r of personShepherdRows ?? []) {
        const row = r as { person_id: string; shepherd_id: string };
        if (!shepherdsByPerson[row.person_id]) shepherdsByPerson[row.person_id] = [];
        shepherdsByPerson[row.person_id].push(row.shepherd_id);
      }

      const groupsByPerson: Record<string, string[]> = {};
      for (const r of groupMemberRows ?? []) {
        const row = r as { group_id: string; person_id: string };
        if (!groupsByPerson[row.person_id]) groupsByPerson[row.person_id] = [];
        groupsByPerson[row.person_id].push(row.group_id);
      }

      const membersByFamily: Record<string, string[]> = {};
      for (const r of familyMemberRows ?? []) {
        const row = r as { family_id: string; person_id: string };
        if (!membersByFamily[row.family_id]) membersByFamily[row.family_id] = [];
        membersByFamily[row.family_id].push(row.person_id);
      }

      const membersByGroup: Record<string, string[]> = {};
      for (const r of groupMemberRows ?? []) {
        const row = r as { group_id: string; person_id: string };
        if (!membersByGroup[row.group_id]) membersByGroup[row.group_id] = [];
        membersByGroup[row.group_id].push(row.person_id);
      }

      const assignedByPersona: Record<string, string[]> = {};
      for (const r of personaPeopleRows ?? []) {
        const row = r as { persona_id: string; person_id: string };
        if (!assignedByPersona[row.persona_id]) assignedByPersona[row.persona_id] = [];
        assignedByPersona[row.persona_id].push(row.person_id);
      }

      const people = (peopleRows as Record<string, unknown>[]).map((r) =>
        mapPerson(r, shepherdsByPerson[r.id as string] ?? [], groupsByPerson[r.id as string] ?? [])
      );

      const families = (familyRows as Record<string, unknown>[]).map((r) =>
        mapFamily(r, membersByFamily[r.id as string] ?? [])
      );

      const groups = (groupRows as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        description: r.description as string | undefined,
        leaderIds: (r.leader_ids as string[]) ?? [],
        shepherdIds: (r.shepherd_ids as string[]) ?? [],
        memberIds: membersByGroup[r.id as string] ?? [],
        relatedFamilyIds: (r.related_family_ids as string[]) ?? [],
      }));

      const personas = (personaRows as Record<string, unknown>[]).map((r) =>
        mapPersona(r, assignedByPersona[r.id as string] ?? [])
      );

      const notes = (noteRows as Record<string, unknown>[]).map(mapNote);
      const todos = (todoRows as Record<string, unknown>[]).map(mapTodo);
      const notices = ((noticeRows ?? []) as Record<string, unknown>[]).map(mapNotice);

      const loadedData: AppData = { people, families, groups, notes, todos, notices, personas };
      setData(loadedData);

      // Restore last active persona from localStorage (just the ID, not the data)
      const savedPersonaId = localStorage.getItem('shepherd-app-persona');
      if (savedPersonaId) {
        const persona = personas.find((p) => p.id === savedPersonaId);
        if (persona) setCurrentPersona(persona);
        else setCurrentPersona(personas[0] ?? initialData.personas[0]);
      } else {
        setCurrentPersona(personas[0] ?? initialData.personas[0]);
      }

      setLoaded(true);
    }

    load();
  }, []);

  // ── Persona switching ─────────────────────────────────────────────────
  const switchPersona = useCallback(
    (id: string) => {
      const persona = data.personas.find((p) => p.id === id);
      if (persona) {
        setCurrentPersona(persona);
        localStorage.setItem('shepherd-app-persona', id);
      }
    },
    [data.personas]
  );

  // Reset all page filters when the active persona changes
  useEffect(() => {
    const resetHome =
      currentPersona.role === 'welcome-team'
        ? { ...HOME_DEFAULT_FILTERS, shepherds: [] }
        : HOME_DEFAULT_FILTERS;
    setHomeFilters(resetHome);
    setHomeSortKey('last-contacted');
    setTodosShepherdFilter(['mine']);
    setLogsShepherdFilter(['mine']);
  }, [currentPersona.id]);

  // ── Supabase auth → persona sync ─────────────────────────────────────
  const loginWithSupabaseUser = useCallback(
    async (userId: string, name: string, email?: string, avatarUrl?: string) => {
      const supabase = createClient();

      // 0. Access gate — email must be on the approved list
      if (!email) {
        await supabase.auth.signOut();
        setAccessDenied(true);
        setLoaded(true);
        return;
      }
      const { data: approved } = await supabase
        .from('approved_emails')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      if (!approved) {
        await supabase.auth.signOut();
        setAccessDenied(true);
        setLoaded(true);
        return;
      }

      // 1. Look up existing persona by user_id (fastest path, already linked)
      const { data: existing } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { data: ppRows } = await supabase
          .from('persona_people')
          .select('person_id')
          .eq('persona_id', existing.id);
        const assignedPeopleIds = (ppRows ?? []).map((r: { person_id: string }) => r.person_id);
        const persona = mapPersona(existing as Record<string, unknown>, assignedPeopleIds);
        setCurrentPersona(persona);
        localStorage.setItem('shepherd-app-persona', persona.id);
        setData((prev) => {
          if (prev.personas.find((p) => p.id === persona.id)) return prev;
          return { ...prev, personas: [...prev.personas, persona] };
        });
        if (avatarUrl && persona.personId) {
          syncGoogleAvatar(supabase, persona.personId, avatarUrl, setData);
        }
        return;
      }

      // 2. No user_id match — try to auto-link via email → people → persona chain.
      //    This handles first-time sign-in for shepherds whose Person record already
      //    has their email address in the system.
      if (email) {
        const { data: personRow } = await supabase
          .from('people')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (personRow) {
          const { data: personaRow } = await supabase
            .from('personas')
            .select('*')
            .eq('person_id', personRow.id)
            .maybeSingle();

          if (personaRow) {
            // Persona found — stamp it with the auth user_id so future logins are instant
            await supabase.from('personas').update({ user_id: userId }).eq('id', personaRow.id);
            const linked = { ...personaRow, user_id: userId };
            const { data: ppRows } = await supabase
              .from('persona_people')
              .select('person_id')
              .eq('persona_id', personaRow.id);
            const assignedPeopleIds = (ppRows ?? []).map((r: { person_id: string }) => r.person_id);
            const persona = mapPersona(linked as Record<string, unknown>, assignedPeopleIds);
            setCurrentPersona(persona);
            localStorage.setItem('shepherd-app-persona', persona.id);
            setData((prev) => ({
              ...prev,
              personas: prev.personas.map((p) => (p.id === persona.id ? persona : p)),
            }));
            if (avatarUrl && persona.personId) {
              syncGoogleAvatar(supabase, persona.personId, avatarUrl, setData);
            }
            return;
          }
        }
      }

      // 3. Truly new user — create a fresh shepherd persona
      const { data: inserted } = await supabase
        .from('personas')
        .insert({ id: userId, user_id: userId, name, role: 'shepherd' })
        .select()
        .single();
      if (inserted) {
        const persona = mapPersona(inserted as Record<string, unknown>, []);
        setCurrentPersona(persona);
        localStorage.setItem('shepherd-app-persona', persona.id);
        setData((prev) => ({ ...prev, personas: [...prev.personas, persona] }));
      }
    },
    []
  );

  // ── Notes ─────────────────────────────────────────────────────────────
  const addNote = useCallback(
    async (noteData: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }): Promise<void> => {
      const note: Note = {
        ...noteData,
        id: generateId(),
        createdBy: currentPersona.id,
        createdAt: noteData.createdAt ?? new Date().toISOString(),
      };

      // Optimistic update
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        const newData = { ...prev, notes: [note, ...prev.notes] };
        if (note.personId) {
          newData.people = prev.people.map((p) => {
            if (p.id === note.personId) {
              const now = new Date();
              return {
                ...p,
                lastContactDate: formatISO(now),
                nextFollowUpDate: formatISO(addDays(now, p.followUpFrequencyDays)),
              };
            }
            return p;
          });
        }
        if (note.familyId) {
          const family = prev.families.find((f) => f.id === note.familyId);
          if (family) {
            newData.people = (newData.people || prev.people).map((p) => {
              if (family.memberIds.includes(p.id)) {
                const now = new Date();
                return {
                  ...p,
                  lastContactDate: formatISO(now),
                  nextFollowUpDate: formatISO(addDays(now, p.followUpFrequencyDays)),
                };
              }
              return p;
            });
          }
        }
        return newData;
      });

      // Persist to Supabase
      const supabase = createClient();
      try {
        await supabase.from('notes').insert({
          id: note.id,
          person_id: note.personId ?? null,
          family_id: note.familyId ?? null,
          type: note.type,
          visibility: note.visibility,
          content: note.content ?? null,
          mentions: note.mentions ?? [],
          created_by: note.createdBy,
          created_at: note.createdAt,
        });

        // Update last_contact_date in DB
        if (note.personId) {
          const person = (
            await supabase
              .from('people')
              .select('follow_up_frequency_days')
              .eq('id', note.personId)
              .single()
          ).data;
          if (person) {
            const days =
              (person as { follow_up_frequency_days: number }).follow_up_frequency_days ?? DEFAULT_FOLLOW_UP_DAYS;
            const now = new Date();
            await supabase
              .from('people')
              .update({
                last_contact_date: formatISO(now),
                next_follow_up_date: formatISO(addDays(now, days)),
              })
              .eq('id', note.personId);
          }
        }
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save log. Try again.', 'error');
      }
    },
    [currentPersona.id]
  );

  const updateNote = useCallback(
    async (
      noteId: string,
      updates: Partial<
        Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, notes: prev.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<NoteRow> = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
      if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
      try {
        await supabase.from('notes').update(dbUpdates).eq('id', noteId);
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save changes. Try again.', 'error');
      }
    },
    []
  );

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => { snapshot = prev; return { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }; });
    const supabase = createClient();
    try {
      await supabase.from('notes').delete().eq('id', noteId);
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to delete log. Try again.', 'error');
    }
  }, []);

  // ── Todos ─────────────────────────────────────────────────────────────
  const addTodo = useCallback(
    async (todoData: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>): Promise<void> => {
      const todo: Todo = {
        ...todoData,
        id: generateId(),
        completed: false,
        createdBy: currentPersona.id,
        createdAt: new Date().toISOString(),
      };
      let snapshot: AppData | undefined;
      setData((prev) => { snapshot = prev; return { ...prev, todos: [todo, ...prev.todos] }; });
      const supabase = createClient();
      try {
        await supabase.from('todos').insert({
          id: todo.id,
          person_id: todo.personId ?? null,
          family_id: todo.familyId ?? null,
          title: todo.title,
          due_date: todo.dueDate ?? null,
          repeat: todo.repeat ?? null,
          completed: false,
          created_by: todo.createdBy,
          created_at: todo.createdAt,
        });
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save to-do. Try again.', 'error');
      }
    },
    [currentPersona.id]
  );

  const updateTodo = useCallback(
    async (
      todoId: string,
      updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'repeat' | 'familyId' | 'personId'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, todos: prev.todos.map((t) => (t.id === todoId ? { ...t, ...updates } : t)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<TodoRow> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      try {
        await supabase.from('todos').update(dbUpdates).eq('id', todoId);
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save changes. Try again.', 'error');
      }
    },
    []
  );

  const deleteTodo = useCallback(async (todoId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => { snapshot = prev; return { ...prev, todos: prev.todos.filter((t) => t.id !== todoId) }; });
    const supabase = createClient();
    try {
      await supabase.from('todos').delete().eq('id', todoId);
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to delete to-do. Try again.', 'error');
    }
  }, []);

  const toggleTodo = useCallback(async (todoId: string): Promise<void> => {
    let newCompleted = false;
    let completedAt: string | undefined;
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return {
        ...prev,
        todos: prev.todos.map((t) => {
          if (t.id === todoId) {
            newCompleted = !t.completed;
            completedAt = newCompleted ? new Date().toISOString() : undefined;
            return { ...t, completed: newCompleted, completedAt };
          }
          return t;
        }),
      };
    });
    const supabase = createClient();
    try {
      await supabase
        .from('todos')
        .update({
          completed: newCompleted,
          completed_at: completedAt ?? null,
        })
        .eq('id', todoId);
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to update to-do. Try again.', 'error');
    }
  }, []);

  // ── People ────────────────────────────────────────────────────────────
  const addPerson = useCallback(
    async (
      personData: Omit<
        Person,
        'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds' | 'followUpFrequencyDays'
      >
    ): Promise<string> => {
      const person: Person = {
        ...personData,
        id: generateId(),
        assignedShepherdIds: [],
        groupIds: [],
        followUpFrequencyDays: DEFAULT_FOLLOW_UP_DAYS,
        createdAt: new Date().toISOString(),
        createdBy: currentPersona.id,
      };
      let snapshot: AppData | undefined;
      setData((prev) => { snapshot = prev; return { ...prev, people: [...prev.people, person] }; });
      const supabase = createClient();
      try {
        await supabase.from('people').insert({
          id: person.id,
          english_name: person.englishName,
          chinese_name: person.chineseName ?? null,
          photo: person.photo ?? null,
          gender: person.gender ?? null,
          marital_status: person.maritalStatus ?? null,
          birthday: person.birthday ?? null,
          baptism_date: person.baptismDate ?? null,
          membership_date: person.membershipDate ?? null,
          anniversary: person.anniversary ?? null,
          phone: person.phone ?? null,
          home_phone: person.homePhone ?? null,
          email: person.email ?? null,
          home_address: person.homeAddress ?? null,
          spiritual_needs: person.spiritualNeeds ?? null,
          physical_needs: person.physicalNeeds ?? null,
          is_shepherd: person.isShepherd ?? false,
          church_positions: person.churchPositions ?? [],
          membership_status: person.membershipStatus,
          church_attendance: person.churchAttendance,
          language: person.language,
          family_id: person.familyId ?? null,
          follow_up_frequency_days: DEFAULT_FOLLOW_UP_DAYS,
          created_at: person.createdAt,
          created_by: person.createdBy ?? null,
        });
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to add person. Try again.', 'error');
        throw new Error('Failed to add person');
      }
      return person.id;
    },
    [currentPersona.id]
  );

  const updatePerson = useCallback(
    async (
      personId: string,
      updates: Partial<
        Pick<
          Person,
          | 'englishName'
          | 'chineseName'
          | 'photo'
          | 'phone'
          | 'homePhone'
          | 'email'
          | 'homeAddress'
          | 'membershipStatus'
          | 'churchAttendance'
          | 'membershipDate'
          | 'language'
          | 'gender'
          | 'maritalStatus'
          | 'birthday'
          | 'baptismDate'
          | 'anniversary'
          | 'followUpFrequencyDays'
          | 'spiritualNeeds'
          | 'physicalNeeds'
          | 'isShepherd'
          | 'isBeingDiscipled'
          | 'churchPositions'
          | 'appRole'
        >
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, people: prev.people.map((p) => (p.id === personId ? { ...p, ...updates } : p)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<PersonRow> = {};
      if (updates.englishName !== undefined) dbUpdates.english_name = updates.englishName;
      if (updates.chineseName !== undefined) dbUpdates.chinese_name = updates.chineseName;
      if ('photo' in updates) dbUpdates.photo = updates.photo ?? null;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.homePhone !== undefined) dbUpdates.home_phone = updates.homePhone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.homeAddress !== undefined) dbUpdates.home_address = updates.homeAddress;
      if (updates.membershipStatus !== undefined)
        dbUpdates.membership_status = updates.membershipStatus;
      if (updates.churchAttendance !== undefined)
        dbUpdates.church_attendance = updates.churchAttendance;
      if (updates.membershipDate !== undefined) dbUpdates.membership_date = updates.membershipDate;
      if (updates.language !== undefined) dbUpdates.language = JSON.stringify(updates.language);
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.maritalStatus !== undefined) dbUpdates.marital_status = updates.maritalStatus;
      if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
      if (updates.baptismDate !== undefined) dbUpdates.baptism_date = updates.baptismDate;
      if (updates.anniversary !== undefined) dbUpdates.anniversary = updates.anniversary;
      if (updates.followUpFrequencyDays !== undefined)
        dbUpdates.follow_up_frequency_days = updates.followUpFrequencyDays;
      if (updates.spiritualNeeds !== undefined) dbUpdates.spiritual_needs = updates.spiritualNeeds;
      if (updates.physicalNeeds !== undefined) dbUpdates.physical_needs = updates.physicalNeeds;
      if (updates.isShepherd !== undefined) dbUpdates.is_shepherd = updates.isShepherd;
      if (updates.isBeingDiscipled !== undefined)
        dbUpdates.is_being_discipled = updates.isBeingDiscipled;
      if (updates.churchPositions !== undefined)
        dbUpdates.church_positions = updates.churchPositions;
      if (updates.appRole !== undefined) dbUpdates.app_role = updates.appRole;
      try {
        await supabase.from('people').update(dbUpdates).eq('id', personId);
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save changes. Try again.', 'error');
      }
    },
    []
  );

  const deletePerson = useCallback(async (personId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return {
        ...prev,
        people: prev.people.filter((p) => p.id !== personId),
        families: prev.families.map((f) => ({
          ...f,
          memberIds: f.memberIds.filter((id) => id !== personId),
        })),
        notes: prev.notes.filter((n) => n.personId !== personId),
        todos: prev.todos.filter((t) => t.personId !== personId),
      };
    });
    const supabase = createClient();
    try {
      await supabase.from('person_shepherds').delete().eq('person_id', personId);
      await supabase.from('family_members').delete().eq('person_id', personId);
      await supabase.from('notes').delete().eq('person_id', personId);
      await supabase.from('todos').delete().eq('person_id', personId);
      await supabase.from('people').delete().eq('id', personId);
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to delete person. Try again.', 'error');
    }
  }, []);

  const assignShepherds = useCallback(async (personId: string, shepherdIds: string[]): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return {
        ...prev,
        people: prev.people.map((p) =>
          p.id === personId ? { ...p, assignedShepherdIds: shepherdIds } : p
        ),
      };
    });
    const supabase = createClient();
    try {
      await supabase.from('person_shepherds').delete().eq('person_id', personId);
      if (shepherdIds.length > 0) {
        await supabase
          .from('person_shepherds')
          .insert(shepherdIds.map((sid) => ({ person_id: personId, shepherd_id: sid })));
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to assign shepherds. Try again.', 'error');
    }
  }, []);

  // ── Families ──────────────────────────────────────────────────────────
  const addFamily = useCallback(async (label: string, memberIds: string[]): Promise<void> => {
    const familyId = generateId();
    const family: Family = { id: familyId, label, tags: [], memberIds };
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return {
        ...prev,
        families: [...prev.families, family],
        people: prev.people.map((p) => (memberIds.includes(p.id) ? { ...p, familyId } : p)),
      };
    });
    const supabase = createClient();
    try {
      await supabase.from('families').insert({ id: familyId, label, tags: [] });
      if (memberIds.length > 0) {
        await supabase
          .from('family_members')
          .insert(memberIds.map((pid) => ({ family_id: familyId, person_id: pid })));
        for (const pid of memberIds) {
          await supabase.from('people').update({ family_id: familyId }).eq('id', pid);
        }
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to add family. Try again.', 'error');
    }
  }, []);

  const updateFamily = useCallback(
    async (
      familyId: string,
      updates: Partial<Pick<Family, 'label' | 'photo' | 'primaryContactId' | 'childCount'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, families: prev.families.map((f) => (f.id === familyId ? { ...f, ...updates } : f)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<FamilyRow> = {};
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if ('photo' in updates) dbUpdates.photo = updates.photo ?? null;
      if (updates.primaryContactId !== undefined)
        dbUpdates.primary_contact_id = updates.primaryContactId;
      if (updates.childCount !== undefined) dbUpdates.child_count = updates.childCount;
      try {
        await supabase.from('families').update(dbUpdates).eq('id', familyId);
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save changes. Try again.', 'error');
      }
    },
    []
  );

  const updateFamilyMembers = useCallback(async (familyId: string, newMemberIds: string[]): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      const family = prev.families.find((f) => f.id === familyId);
      if (!family) return prev;
      const oldMemberIds = family.memberIds;
      const removed = oldMemberIds.filter((id) => !newMemberIds.includes(id));
      const added = newMemberIds.filter((id) => !oldMemberIds.includes(id));
      const newFamilies = prev.families.map((f) => {
        if (f.id === familyId) return { ...f, memberIds: newMemberIds };
        const filtered = f.memberIds.filter((id) => !added.includes(id));
        return filtered.length !== f.memberIds.length ? { ...f, memberIds: filtered } : f;
      });
      const newPeople = prev.people.map((p) => {
        if (removed.includes(p.id)) return { ...p, familyId: undefined };
        if (added.includes(p.id)) return { ...p, familyId };
        return p;
      });
      return { ...prev, families: newFamilies, people: newPeople };
    });

    const supabase = createClient();
    try {
      await supabase.from('family_members').delete().eq('family_id', familyId);
      if (newMemberIds.length > 0) {
        await supabase
          .from('family_members')
          .insert(newMemberIds.map((pid) => ({ family_id: familyId, person_id: pid })));
      }
      for (const pid of newMemberIds) {
        await supabase.from('people').update({ family_id: familyId }).eq('id', pid);
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to save changes. Try again.', 'error');
    }
  }, []);

  const addGroup = useCallback(async (name: string, description?: string): Promise<void> => {
    const group = {
      id: generateId(),
      name,
      description,
      leaderIds: [],
      shepherdIds: [],
      memberIds: [],
      relatedFamilyIds: [],
    };
    let snapshot: AppData | undefined;
    setData((prev) => { snapshot = prev; return { ...prev, groups: [...prev.groups, group] }; });
    const supabase = createClient();
    try {
      await supabase.from('groups').insert({ id: group.id, name, description: description ?? null });
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to add group. Try again.', 'error');
    }
  }, []);

  const updateGroup = useCallback(
    async (
      groupId: string,
      updates: Partial<
        Pick<import('./types').Group, 'name' | 'description' | 'leaderIds' | 'shepherdIds'>
      >
    ): Promise<void> => {
      // Side-channel to capture computed values for DB ops after setData
      let eligibleMemberIds: string[] = [];
      let newShepherdPersonaIds: string[] = [];
      let snapshot: AppData | undefined;

      setData((prev) => {
        snapshot = prev;
        const group = prev.groups.find((g) => g.id === groupId);
        const newGroups = prev.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g));

        if (updates.shepherdIds !== undefined && group) {
          // Map shepherd person IDs → persona IDs (with person ID fallback, matching sheep-lookup logic)
          newShepherdPersonaIds = updates.shepherdIds.flatMap((personId) => {
            const persona = prev.personas.find((p) => p.personId === personId);
            return [persona ? persona.id : personId];
          });

          // Eligible sheep: in group, not a leader, not themselves a shepherd
          const effectiveLeaderIds = updates.leaderIds ?? group.leaderIds;
          eligibleMemberIds = group.memberIds.filter((memberId) => {
            if (effectiveLeaderIds.includes(memberId)) return false;
            if (updates.shepherdIds!.includes(memberId)) return false;
            const person = prev.people.find((p) => p.id === memberId);
            return person ? !person.isShepherd : false;
          });

          const newPeople = prev.people.map((p) =>
            eligibleMemberIds.includes(p.id)
              ? { ...p, assignedShepherdIds: newShepherdPersonaIds }
              : p
          );
          return { ...prev, groups: newGroups, people: newPeople };
        }

        return { ...prev, groups: newGroups };
      });

      const supabase = createClient();
      const dbUpdates: Partial<GroupRow> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
      if (updates.leaderIds !== undefined) dbUpdates.leader_ids = updates.leaderIds;
      if (updates.shepherdIds !== undefined) dbUpdates.shepherd_ids = updates.shepherdIds;
      try {
        await supabase.from('groups').update(dbUpdates).eq('id', groupId);

        // Persist auto-assigned shepherds to eligible group members
        if (updates.shepherdIds !== undefined) {
          for (const pid of eligibleMemberIds) {
            await supabase.from('person_shepherds').delete().eq('person_id', pid);
            if (newShepherdPersonaIds.length > 0) {
              await supabase
                .from('person_shepherds')
                .insert(newShepherdPersonaIds.map((sid) => ({ person_id: pid, shepherd_id: sid })));
            }
          }
        }
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save changes. Try again.', 'error');
      }
    },
    []
  );

  const updateGroupMembers = useCallback(async (groupId: string, memberIds: string[]): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      const newGroups = prev.groups.map((g) => (g.id === groupId ? { ...g, memberIds } : g));
      const newPeople = prev.people.map((p) => {
        const inGroup = memberIds.includes(p.id);
        const hadGroup = p.groupIds.includes(groupId);
        if (inGroup && !hadGroup) return { ...p, groupIds: [...p.groupIds, groupId] };
        if (!inGroup && hadGroup)
          return { ...p, groupIds: p.groupIds.filter((id) => id !== groupId) };
        return p;
      });
      return { ...prev, groups: newGroups, people: newPeople };
    });
    const supabase = createClient();
    try {
      await supabase.from('group_members').delete().eq('group_id', groupId);
      for (const pid of memberIds) {
        await supabase.from('group_members').insert({ group_id: groupId, person_id: pid });
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to save changes. Try again.', 'error');
    }
  }, []);

  const assignGroupsToPerson = useCallback(async (personId: string, groupIds: string[]): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      const newPeople = prev.people.map((p) => (p.id === personId ? { ...p, groupIds } : p));
      const newGroups = prev.groups.map((g) => {
        if (groupIds.includes(g.id)) {
          return g.memberIds.includes(personId)
            ? g
            : { ...g, memberIds: [...g.memberIds, personId] };
        } else {
          return { ...g, memberIds: g.memberIds.filter((id) => id !== personId) };
        }
      });
      return { ...prev, people: newPeople, groups: newGroups };
    });
    const supabase = createClient();
    try {
      await supabase.from('group_members').delete().eq('person_id', personId);
      for (const gid of groupIds) {
        await supabase.from('group_members').insert({ group_id: gid, person_id: personId });
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to save changes. Try again.', 'error');
    }
  }, []);

  const assignGroupsToFamily = useCallback(async (familyId: string, groupIds: string[]): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      const family = prev.families.find((f) => f.id === familyId);
      if (!family) return prev;
      const memberIds = family.memberIds;
      const newPeople = prev.people.map((p) => (memberIds.includes(p.id) ? { ...p, groupIds } : p));
      const newGroups = prev.groups.map((g) => {
        if (groupIds.includes(g.id)) {
          const merged = [...g.memberIds];
          for (const mid of memberIds) {
            if (!merged.includes(mid)) merged.push(mid);
          }
          return { ...g, memberIds: merged };
        } else {
          return { ...g, memberIds: g.memberIds.filter((id) => !memberIds.includes(id)) };
        }
      });
      return { ...prev, people: newPeople, groups: newGroups };
    });

    const supabase = createClient();
    try {
      const { data: fmRows } = await supabase
        .from('family_members')
        .select('person_id')
        .eq('family_id', familyId);
      const memberIds = (fmRows ?? []).map((r: { person_id: string }) => r.person_id);
      for (const mid of memberIds) {
        await supabase.from('group_members').delete().eq('person_id', mid);
      }
      for (const gid of groupIds) {
        for (const mid of memberIds) {
          await supabase.from('group_members').insert({ group_id: gid, person_id: mid });
        }
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to save changes. Try again.', 'error');
    }
  }, []);

  const assignShepherdsToFamily = useCallback(async (familyId: string, shepherdIds: string[]): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      const family = prev.families.find((f) => f.id === familyId);
      if (!family) return prev;
      const memberIds = family.memberIds;
      const newPeople = prev.people.map((p) =>
        memberIds.includes(p.id) ? { ...p, assignedShepherdIds: shepherdIds } : p
      );
      return { ...prev, people: newPeople };
    });

    const supabase = createClient();
    try {
      const { data: fmRows } = await supabase
        .from('family_members')
        .select('person_id')
        .eq('family_id', familyId);
      const memberIds = (fmRows ?? []).map((r: { person_id: string }) => r.person_id);
      for (const pid of memberIds) {
        await supabase.from('person_shepherds').delete().eq('person_id', pid);
        if (shepherdIds.length > 0) {
          await supabase
            .from('person_shepherds')
            .insert(shepherdIds.map((sid) => ({ person_id: pid, shepherd_id: sid })));
        }
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to assign shepherds. Try again.', 'error');
    }
  }, []);

  const setFollowUpFrequency = useCallback(async (personId: string, days: number): Promise<void> => {
    let nextFollowUpDate: string | undefined;
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return {
        ...prev,
        people: prev.people.map((p) => {
          if (p.id === personId) {
            const base = p.lastContactDate ? parseISO(p.lastContactDate) : new Date();
            nextFollowUpDate = formatISO(addDays(base, days));
            return { ...p, followUpFrequencyDays: days, nextFollowUpDate };
          }
          return p;
        }),
      };
    });
    const supabase = createClient();
    try {
      await supabase
        .from('people')
        .update({
          follow_up_frequency_days: days,
          next_follow_up_date: nextFollowUpDate ?? null,
        })
        .eq('id', personId);
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to save changes. Try again.', 'error');
    }
  }, []);

  // ── Notices ───────────────────────────────────────────────────────────
  const addNotice = useCallback(
    async (noticeData: Omit<Notice, 'id' | 'createdBy' | 'createdAt'>): Promise<void> => {
      const notice: Notice = {
        ...noticeData,
        id: generateId(),
        createdBy: currentPersona.id,
        createdAt: new Date().toISOString(),
      };
      let snapshot: AppData | undefined;
      setData((prev) => { snapshot = prev; return { ...prev, notices: [notice, ...prev.notices] }; });
      const supabase = createClient();
      try {
        await supabase.from('notices').insert({
          id: notice.id,
          person_id: notice.personId ?? null,
          family_id: notice.familyId ?? null,
          categories: notice.categories,
          urgency: notice.urgency,
          privacy: notice.privacy,
          content: notice.content,
          created_by: notice.createdBy,
          created_at: notice.createdAt,
        });
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save notice. Try again.', 'error');
      }
    },
    [currentPersona.id]
  );

  const updateNotice = useCallback(
    async (
      noticeId: string,
      updates: Partial<
        Pick<Notice, 'categories' | 'urgency' | 'privacy' | 'content' | 'personId' | 'familyId'>
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, notices: prev.notices.map((n) => (n.id === noticeId ? { ...n, ...updates } : n)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<NoticeRow> = {};
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;
      if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
      if (updates.privacy !== undefined) dbUpdates.privacy = updates.privacy;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      try {
        await supabase.from('notices').update(dbUpdates).eq('id', noticeId);
      } catch {
        if (snapshot) setData(snapshot);
        showToast('Failed to save changes. Try again.', 'error');
      }
    },
    []
  );

  const deleteNotice = useCallback(async (noticeId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => { snapshot = prev; return { ...prev, notices: prev.notices.filter((n) => n.id !== noticeId) }; });
    const supabase = createClient();
    try {
      await supabase.from('notices').delete().eq('id', noticeId);
    } catch {
      if (snapshot) setData(snapshot);
      showToast('Failed to delete notice. Try again.', 'error');
    }
  }, []);

  const canViewNote = useCallback(
    (note: Note): boolean => {
      if (currentPersona.role === 'admin') return true;
      if (note.visibility === 'public') return true;
      if (note.createdBy === currentPersona.id) return true;
      if (currentPersona.role === 'shepherd' && note.personId) {
        return currentPersona.assignedPeopleIds.includes(note.personId);
      }
      return false;
    },
    [currentPersona]
  );

  if (!loaded) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        data,
        currentPersona,
        accessDenied,
        switchPersona,
        loginWithSupabaseUser,
        addNote,
        updateNote,
        deleteNote,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        addNotice,
        updateNotice,
        deleteNotice,
        addPerson,
        deletePerson,
        addFamily,
        updatePerson,
        assignShepherds,
        updateFamily,
        updateFamilyMembers,
        addGroup,
        updateGroup,
        updateGroupMembers,
        assignGroupsToPerson,
        assignGroupsToFamily,
        assignShepherdsToFamily,
        setFollowUpFrequency,
        canViewNote,
        homeFilters,
        setHomeFilters,
        homeSortKey,
        setHomeSortKey,
        todosShepherdFilter,
        setTodosShepherdFilter,
        logsShepherdFilter,
        setLogsShepherdFilter,
        themePreference,
        setThemePreference,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
