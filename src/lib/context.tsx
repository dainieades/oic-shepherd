'use client';

import { addDays, parseISO, formatISO } from 'date-fns';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
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
import { type PersonRow, type FamilyRow, type NoteRow, type NoticeRow, type TodoRow, type GroupRow } from './schemas';
import { mapPerson, mapFamily, mapPersona, syncGoogleAvatar, mapNote, mapNotice, mapTodo, mapAuditLog } from './mappers';

// ── Shared filter types (exported so pages can import them) ──────────────────

export type HomeSortKey = 'last-contacted' | 'last-contacted-recent' | 'name' | 'name-desc' | 'last-name' | 'last-name-desc';

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
import { generateId, MAP_PROVIDERS_STORAGE_KEY, type MapProvider } from './utils';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/Toast';
import { DEFAULT_FOLLOW_UP_DAYS, SAVE_ERROR_MSG } from '@/lib/constants';

interface AppContextType {
  data: AppData;
  personaByPersonId: ReadonlyMap<string, Persona>;
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
  addFamily: (label: string, memberIds: string[]) => Promise<string>;
  updatePerson: (
    personId: string,
    updates: Partial<
      Pick<
        Person,
        | 'englishName'
        | 'chineseName'
        | 'photo'
        | 'originalPhoto'
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
    updates: Partial<Pick<Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>>
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
  fetchAuditLogs: (personId: string) => Promise<import('./types').AuditLog[]>;
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
  mapProvider: MapProvider;
  setMapProvider: (provider: MapProvider) => void;
  fullPageModalOpen: boolean;
  setFullPageModalOpen: Dispatch<SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Audit log helpers ─────────────────────────────────────────────────────

const AUDIT_FIELD_KEYS = [
  'englishName', 'chineseName', 'photo', 'phone', 'homePhone', 'email', 'homeAddress',
  'membershipStatus', 'churchAttendance', 'membershipDate', 'language', 'gender',
  'maritalStatus', 'birthday', 'baptismDate', 'anniversary', 'followUpFrequencyDays',
  'isShepherd', 'isBeingDiscipled', 'churchPositions', 'appRole',
] as const;

function serializeAuditValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.join(', ') || '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

// ── AppProvider ───────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [data, setData] = useState<AppData>(initialData);
  const [currentPersona, setCurrentPersona] = useState<Persona>(initialData.personas[0]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [fullPageModalOpen, setFullPageModalOpen] = useState(false);

  // ── Theme preference ─────────────────────────────────────────────────
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [mapProvider, setMapProviderState] = useState<MapProvider>('google');

  useEffect(() => {
    const stored = localStorage.getItem('shepherd-app-theme') as ThemePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemePreferenceState(stored);
    }
    const storedMap = localStorage.getItem(MAP_PROVIDERS_STORAGE_KEY) as MapProvider | null;
    if (storedMap === 'apple' || storedMap === 'google') {
      setMapProviderState(storedMap);
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
    createClient()
      .from('personas')
      .update({ theme_preference: pref })
      .eq('id', currentPersona.id)
      .then(() => {});
  }, [currentPersona.id]);

  const setMapProvider = useCallback((provider: MapProvider): void => {
    setMapProviderState(provider);
    localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, provider);
    createClient()
      .from('personas')
      .update({ map_provider: provider })
      .eq('id', currentPersona.id)
      .then(() => {});
  }, [currentPersona.id]);

  const personaByPersonId = useMemo(
    () => new Map(data.personas.filter((p) => p.personId).map((p) => [p.personId as string, p])),
    [data.personas]
  );

  const personaById = useMemo(
    () => new Map(data.personas.map((p) => [p.id, p])),
    [data.personas]
  );

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
      const familyByPerson: Record<string, string> = {};
      for (const r of familyMemberRows ?? []) {
        const row = r as { family_id: string; person_id: string };
        if (!membersByFamily[row.family_id]) membersByFamily[row.family_id] = [];
        membersByFamily[row.family_id].push(row.person_id);
        familyByPerson[row.person_id] = row.family_id;
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

      const people = (peopleRows as Record<string, unknown>[]).map((r) => {
        const person = mapPerson(r, shepherdsByPerson[r.id as string] ?? [], groupsByPerson[r.id as string] ?? []);
        const derivedFamilyId = familyByPerson[r.id as string];
        if (derivedFamilyId) person.familyId = derivedFamilyId;
        return person;
      });

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

      function applyPersonaSettings(persona: Persona) {
        if (persona.themePreference) {
          setThemePreferenceState(persona.themePreference);
          localStorage.setItem('shepherd-app-theme', persona.themePreference);
        }
        if (persona.mapProvider === 'apple' || persona.mapProvider === 'google') {
          setMapProviderState(persona.mapProvider);
          localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, persona.mapProvider);
        }
      }

      // Restore last active persona from localStorage (just the ID, not the data)
      const savedPersonaId = localStorage.getItem('shepherd-app-persona');
      if (savedPersonaId) {
        const persona = personas.find((p) => p.id === savedPersonaId);
        if (persona) {
          setCurrentPersona(persona);
          applyPersonaSettings(persona);
          setLoaded(true);
          return;
        }
        // Stored ID no longer valid — fall through to session check
        localStorage.removeItem('shepherd-app-persona');
      }

      // No valid stored persona — resolve from the active session.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const sessionPersona = personas.find((p) => p.userId === session.user.id);
        if (sessionPersona) {
          setCurrentPersona(sessionPersona);
          applyPersonaSettings(sessionPersona);
          setLoaded(true);
        }
        // No matching persona yet — loginWithSupabaseUser (via AuthSync) will
        // verify approval, set the correct persona, and call setLoaded(true).
      } else {
        setLoaded(true);
      }
    }

    load();
  }, []);

  // ── Persona switching ─────────────────────────────────────────────────
  const switchPersona = useCallback(
    (id: string) => {
      const persona = personaById.get(id);
      if (persona) {
        setCurrentPersona(persona);
        localStorage.setItem('shepherd-app-persona', id);
      }
    },
    [personaById]
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
        setCurrentUserEmail(email);
        localStorage.setItem('shepherd-app-persona', persona.id);
        setData((prev) => {
          if (prev.personas.find((p) => p.id === persona.id)) return prev;
          return { ...prev, personas: [...prev.personas, persona] };
        });
        if (existing.email !== email) {
          void supabase.from('personas').update({ email }).eq('id', persona.id);
        }
        if (avatarUrl && persona.personId) {
          syncGoogleAvatar(supabase, persona.personId, avatarUrl, setData);
        }
        setLoaded(true);
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
            await supabase.from('personas').update({ user_id: userId, email }).eq('id', personaRow.id);
            const linked = { ...personaRow, user_id: userId };
            const { data: ppRows } = await supabase
              .from('persona_people')
              .select('person_id')
              .eq('persona_id', personaRow.id);
            const assignedPeopleIds = (ppRows ?? []).map((r: { person_id: string }) => r.person_id);
            const persona = mapPersona(linked as Record<string, unknown>, assignedPeopleIds);
            setCurrentPersona(persona);
            setCurrentUserEmail(email);
            localStorage.setItem('shepherd-app-persona', persona.id);
            setData((prev) => ({
              ...prev,
              personas: prev.personas.map((p) => (p.id === persona.id ? persona : p)),
            }));
            if (avatarUrl && persona.personId) {
              syncGoogleAvatar(supabase, persona.personId, avatarUrl, setData);
            }
            setLoaded(true);
            return;
          }
        }
      }

      // 3. Truly new user — create a fresh shepherd persona
      const { data: inserted } = await supabase
        .from('personas')
        .insert({ id: userId, user_id: userId, name, role: 'shepherd', email })
        .select()
        .single();
      if (inserted) {
        const persona = mapPersona(inserted as Record<string, unknown>, []);
        setCurrentPersona(persona);
        setCurrentUserEmail(email);
        localStorage.setItem('shepherd-app-persona', persona.id);
        setData((prev) => ({ ...prev, personas: [...prev.personas, persona] }));
        setLoaded(true);
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
        showToast(SAVE_ERROR_MSG, 'error');
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
        showToast(SAVE_ERROR_MSG, 'error');
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
        showToast(SAVE_ERROR_MSG, 'error');
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
        showToast(SAVE_ERROR_MSG, 'error');
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
        showToast(SAVE_ERROR_MSG, 'error');
        throw new Error('Failed to add person');
      }
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await addTodo({
        title: `Contact ${person.englishName}`,
        personId: person.id,
        dueDate: oneWeekFromNow,
      });
      void fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'person.added',
          personName: person.englishName,
          addedByName: currentPersona.name,
          actorEmail: currentUserEmail,
        }),
      });
      return person.id;
    },
    [currentPersona.id, currentPersona.name, currentUserEmail, addTodo]
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
          | 'originalPhoto'
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
          | 'isShepherd'
          | 'isBeingDiscipled'
          | 'churchPositions'
          | 'appRole'
        >
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      let currentPerson: Person | undefined;
      setData((prev) => {
        snapshot = prev;
        currentPerson = prev.people.find((p) => p.id === personId);
        return { ...prev, people: prev.people.map((p) => (p.id === personId ? { ...p, ...updates } : p)) };
      });
      const supabase = createClient();
      const dbUpdates: Partial<PersonRow> = {};
      if (updates.englishName !== undefined) dbUpdates.english_name = updates.englishName;
      if (updates.chineseName !== undefined) dbUpdates.chinese_name = updates.chineseName;
      if ('photo' in updates) dbUpdates.photo = updates.photo ?? null;
      if ('originalPhoto' in updates) dbUpdates.original_photo = updates.originalPhoto ?? null;
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
      if (updates.isShepherd !== undefined) dbUpdates.is_shepherd = updates.isShepherd;
      if (updates.isBeingDiscipled !== undefined)
        dbUpdates.is_being_discipled = updates.isBeingDiscipled;
      if (updates.churchPositions !== undefined)
        dbUpdates.church_positions = updates.churchPositions;
      if (updates.appRole !== undefined) dbUpdates.app_role = updates.appRole;
      const now = new Date().toISOString();
      dbUpdates.last_edited_at = now;
      dbUpdates.last_edited_by_name = currentPersona.name;
      const auditRows = currentPerson
        ? AUDIT_FIELD_KEYS
            .filter((field) => field in updates)
            .flatMap((field) => {
              const oldRaw = currentPerson![field as keyof Person];
              const newRaw = updates[field as keyof typeof updates];
              const oldStr = serializeAuditValue(field, oldRaw);
              const newStr = serializeAuditValue(field, newRaw);
              if (oldStr === newStr) return [];
              return [{
                person_id: personId,
                changed_by_persona_id: currentPersona.id,
                changed_by_name: currentPersona.name,
                field_name: field,
                old_value: oldStr,
                new_value: newStr,
                created_at: now,
              }];
            })
        : [];
      try {
        await Promise.all([
          supabase.from('people').update(dbUpdates).eq('id', personId),
          auditRows.length > 0 ? supabase.from('audit_logs').insert(auditRows) : Promise.resolve(),
        ]);
        if (auditRows.length > 0) {
          setData((prev) => ({
            ...prev,
            people: prev.people.map((p) =>
              p.id === personId
                ? { ...p, lastEditedAt: now, lastEditedByName: currentPersona.name }
                : p
            ),
          }));
        }
      } catch {
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      if (currentPerson && currentPerson.assignedShepherdIds.length > 0) {
        void fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'person.updated',
            personName: currentPerson.englishName,
            shepherdPersonaIds: currentPerson.assignedShepherdIds,
            personUserId: currentPerson.userId,
            updatedByName: currentPersona.name,
            actorEmail: currentUserEmail,
          }),
        });
      }
    },
    [currentPersona.id, currentPersona.name, currentUserEmail]
  );

  const fetchAuditLogs = useCallback(async (personId: string): Promise<import('./types').AuditLog[]> => {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });
    return (rows ?? []).map(mapAuditLog);
  }, []);

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
    let personName = '';
    setData((prev) => {
      snapshot = prev;
      personName = prev.people.find((p) => p.id === personId)?.englishName ?? '';
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
      showToast(SAVE_ERROR_MSG, 'error');
      return;
    }
    if (shepherdIds.length > 0 && personName) {
      void fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shepherd.assigned',
          personName,
          shepherdPersonaIds: shepherdIds,
          assignedByName: currentPersona.name,
          actorEmail: currentUserEmail,
        }),
      });
    }
  }, [currentPersona.name, currentUserEmail]);

  // ── Families ──────────────────────────────────────────────────────────
  const addFamily = useCallback(async (label: string, memberIds: string[]): Promise<string> => {
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
        await Promise.all(memberIds.map((pid) => supabase.from('people').update({ family_id: familyId }).eq('id', pid)));
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast(SAVE_ERROR_MSG, 'error');
    }
    return familyId;
  }, []);

  const updateFamily = useCallback(
    async (
      familyId: string,
      updates: Partial<Pick<Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>>
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
      if ('originalPhoto' in updates) dbUpdates.original_photo = updates.originalPhoto ?? null;
      if (updates.primaryContactId !== undefined)
        dbUpdates.primary_contact_id = updates.primaryContactId;
      if (updates.childCount !== undefined) dbUpdates.child_count = updates.childCount;
      try {
        await supabase.from('families').update(dbUpdates).eq('id', familyId);
      } catch {
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
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
      await Promise.all(newMemberIds.map((pid) => supabase.from('people').update({ family_id: familyId }).eq('id', pid)));
    } catch {
      if (snapshot) setData(snapshot);
      showToast(SAVE_ERROR_MSG, 'error');
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
      showToast(SAVE_ERROR_MSG, 'error');
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
          const pByPersonId = new Map(prev.personas.filter((p) => p.personId).map((p) => [p.personId as string, p]));
          newShepherdPersonaIds = updates.shepherdIds.flatMap((personId) => {
            const persona = pByPersonId.get(personId);
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
        showToast(SAVE_ERROR_MSG, 'error');
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
      if (memberIds.length > 0) {
        await supabase.from('group_members').insert(memberIds.map((pid) => ({ group_id: groupId, person_id: pid })));
      }
    } catch {
      if (snapshot) setData(snapshot);
      showToast(SAVE_ERROR_MSG, 'error');
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
      showToast(SAVE_ERROR_MSG, 'error');
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
      showToast(SAVE_ERROR_MSG, 'error');
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
      showToast(SAVE_ERROR_MSG, 'error');
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
      showToast(SAVE_ERROR_MSG, 'error');
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
      let aboutName = '';
      setData((prev) => {
        snapshot = prev;
        if (notice.personId) {
          aboutName = prev.people.find((p) => p.id === notice.personId)?.englishName ?? '';
        } else if (notice.familyId) {
          aboutName = prev.families.find((f) => f.id === notice.familyId)?.label ?? '';
        }
        return { ...prev, notices: [notice, ...prev.notices] };
      });
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
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      void fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notice.added',
          aboutName: aboutName || 'General',
          content: notice.content,
          urgency: notice.urgency,
          privacy: notice.privacy,
          addedByName: currentPersona.name,
          actorEmail: currentUserEmail,
        }),
      });
    },
    [currentPersona.id, currentPersona.name, currentUserEmail]
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
        showToast(SAVE_ERROR_MSG, 'error');
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
        personaByPersonId,
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
        fetchAuditLogs,
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
        mapProvider,
        setMapProvider,
        fullPageModalOpen,
        setFullPageModalOpen,
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
