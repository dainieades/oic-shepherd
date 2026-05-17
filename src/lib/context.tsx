'use client';

import { formatISO } from 'date-fns';
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
  type NotificationPreferences,
} from './types';
import {
  type PersonRow,
  type FamilyRow,
  type NoteRow,
  type NoticeRow,
  type TodoRow,
  type GroupRow,
} from './schemas';
import {
  mapPerson,
  mapFamily,
  mapPersona,
  syncGoogleAvatar,
  mapNote,
  mapNotice,
  mapTodo,
  mapAuditLog,
} from './mappers';
import { isStaleAuthUser } from '@/app/auth/actions';

// ── Shared filter types (exported so pages can import them) ──────────────────

export type HomeSortKey =
  | 'last-contacted'
  | 'last-contacted-recent'
  | 'name'
  | 'name-desc'
  | 'last-name'
  | 'last-name-desc'
  | 'status'
  | 'status-desc'
  | 'attendance'
  | 'attendance-desc'
  | 'groups'
  | 'groups-desc'
  | 'todos'
  | 'todos-desc'
  | 'notices'
  | 'notices-desc';

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
import {
  generateId,
  MAP_PROVIDERS_STORAGE_KEY,
  calcReminderDueAt,
  fullName,
  visibleTo,
  type MapProvider,
} from './utils';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/Toast';
import { SAVE_ERROR_MSG } from '@/lib/constants';

interface AppContextType {
  data: AppData;
  personaByPersonId: ReadonlyMap<string, Persona>;
  currentPersona: Persona;
  accessDenied: boolean;
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
    updates: Partial<
      Pick<Todo, 'title' | 'dueDate' | 'repeat' | 'reminder' | 'familyId' | 'personId'>
    >
  ) => void;
  deleteTodo: (todoId: string) => void;
  toggleTodo: (todoId: string) => void;
  addPerson: (
    person: Omit<Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds'>
  ) => Promise<string>;
  deletePerson: (personId: string) => void;
  addFamily: (label: string, memberIds: string[]) => Promise<string>;
  updatePerson: (
    personId: string,
    updates: Partial<
      Pick<
        Person,
        | 'preferredName'
        | 'lastName'
        | 'alternativeName'
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
        | 'baptized'
        | 'baptismDate'
        | 'anniversary'
        | 'isShepherd'
        | 'isBeingDiscipled'
        | 'churchPositions'
        | 'appRole'
        | 'canTriageVisitors'
        | 'isStudent'
      >
    >
  ) => Promise<void>;
  promoteVisitorSubmission: (submissionId: string) => Promise<string>;
  discardVisitorSubmission: (submissionId: string) => Promise<void>;
  updateVisitorSubmission: (
    submissionId: string,
    patch: {
      referralSource?: import('./types').ReferralSource | null;
      referralDetail?: string | null;
      interests?: import('./types').Interest[];
      prayerRequest?: string | null;
    }
  ) => Promise<void>;
  assignShepherds: (personId: string, shepherdIds: string[]) => Promise<void>;
  updateFamily: (
    familyId: string,
    updates: Partial<
      Pick<Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>
    >
  ) => Promise<void>;
  updateFamilyMembers: (familyId: string, memberIds: string[]) => Promise<void>;
  addGroup: (name: string, description?: string) => void;
  updateGroup: (
    groupId: string,
    updates: Partial<Pick<import('./types').Group, 'name' | 'description' | 'leaderIds'>>
  ) => void;
  updateGroupMembers: (groupId: string, memberIds: string[]) => void;
  assignGroupsToPerson: (personId: string, groupIds: string[]) => Promise<void>;
  assignGroupsToFamily: (familyId: string, groupIds: string[]) => Promise<void>;
  assignShepherdsToFamily: (familyId: string, shepherdIds: string[]) => Promise<void>;
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
  notificationPrefs: NotificationPreferences;
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: boolean
  ) => Promise<void>;
  calendarSyncEnabled: boolean;
  calendarFeedToken: string | null;
  enableCalendarSync: () => Promise<string>;
  disableCalendarSync: () => Promise<void>;
  regenerateCalendarFeedToken: () => Promise<string>;
  fullPageModalOpen: boolean;
  setFullPageModalOpen: Dispatch<SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Audit log helpers ─────────────────────────────────────────────────────

const AUDIT_FIELD_KEYS = [
  'preferredName',
  'lastName',
  'alternativeName',
  'photo',
  'phone',
  'homePhone',
  'email',
  'homeAddress',
  'membershipStatus',
  'churchAttendance',
  'membershipDate',
  'language',
  'gender',
  'maritalStatus',
  'birthday',
  'baptized',
  'baptismDate',
  'anniversary',
  'isShepherd',
  'isBeingDiscipled',
  'churchPositions',
  'appRole',
  'canTriageVisitors',
  'isStudent',
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
  const [notificationPrefs, setNotificationPrefsState] = useState<NotificationPreferences>({
    personAdded: true,
    noticeAdded: true,
    shepherdAssigned: true,
    personUpdated: false,
    todoCreated: true,
  });
  const [calendarSyncEnabled, setCalendarSyncEnabledState] = useState<boolean>(false);
  const [calendarFeedToken, setCalendarFeedTokenState] = useState<string | null>(null);

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

  const setThemePreference = useCallback(
    (pref: ThemePreference): void => {
      setThemePreferenceState(pref);
      localStorage.setItem('shepherd-app-theme', pref);
      createClient()
        .from('personas')
        .update({ theme_preference: pref })
        .eq('id', currentPersona.id)
        .then(() => {});
    },
    [currentPersona.id]
  );

  const setMapProvider = useCallback(
    (provider: MapProvider): void => {
      setMapProviderState(provider);
      localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, provider);
      createClient()
        .from('personas')
        .update({ map_provider: provider })
        .eq('id', currentPersona.id)
        .then(() => {});
    },
    [currentPersona.id]
  );

  const NOTIFY_PREF_COLUMNS: Record<keyof NotificationPreferences, string> = {
    personAdded: 'notify_person_added',
    noticeAdded: 'notify_notice_added',
    shepherdAssigned: 'notify_shepherd_assigned',
    personUpdated: 'notify_person_updated',
    todoCreated: 'notify_todo_created',
  };

  const setNotificationPreference = useCallback(
    async <K extends keyof NotificationPreferences>(key: K, value: boolean): Promise<void> => {
      setNotificationPrefsState((prev) => ({ ...prev, [key]: value }));
      await createClient()
        .from('personas')
        .update({ [NOTIFY_PREF_COLUMNS[key]]: value })
        .eq('id', currentPersona.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPersona.id]
  );

  const enableCalendarSync = useCallback(async (): Promise<string> => {
    const token =
      calendarFeedToken ??
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    setCalendarSyncEnabledState(true);
    setCalendarFeedTokenState(token);
    setData((prev) => ({
      ...prev,
      personas: prev.personas.map((p) =>
        p.id === currentPersona.id
          ? { ...p, calendarSyncEnabled: true, calendarFeedToken: token }
          : p
      ),
    }));
    await createClient()
      .from('personas')
      .update({
        calendar_sync_enabled: true,
        calendar_feed_token: token,
      })
      .eq('id', currentPersona.id);
    return `${window.location.origin}/api/calendar-feed/${token}.ics`;
  }, [calendarFeedToken, currentPersona.id]);

  const disableCalendarSync = useCallback(async (): Promise<void> => {
    setCalendarSyncEnabledState(false);
    setData((prev) => ({
      ...prev,
      personas: prev.personas.map((p) =>
        p.id === currentPersona.id ? { ...p, calendarSyncEnabled: false } : p
      ),
    }));
    await createClient()
      .from('personas')
      .update({ calendar_sync_enabled: false })
      .eq('id', currentPersona.id);
  }, [currentPersona.id]);

  const regenerateCalendarFeedToken = useCallback(async (): Promise<string> => {
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    setCalendarFeedTokenState(token);
    setData((prev) => ({
      ...prev,
      personas: prev.personas.map((p) =>
        p.id === currentPersona.id ? { ...p, calendarFeedToken: token } : p
      ),
    }));
    await createClient()
      .from('personas')
      .update({ calendar_feed_token: token })
      .eq('id', currentPersona.id);
    return `${window.location.origin}/api/calendar-feed/${token}.ics`;
  }, [currentPersona.id]);

  const personaByPersonId = useMemo(
    () => new Map(data.personas.filter((p) => p.personId).map((p) => [p.personId as string, p])),
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
      console.log('[AppContext.load] start');
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
        const person = mapPerson(
          r,
          shepherdsByPerson[r.id as string] ?? [],
          groupsByPerson[r.id as string] ?? []
        );
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
        memberIds: membersByGroup[r.id as string] ?? [],
        relatedFamilyIds: (r.related_family_ids as string[]) ?? [],
        isTest: (r.is_test as boolean | undefined) ?? false,
      }));

      const triageByPersonId = new Map<string, boolean>();
      for (const p of people) {
        if (p.canTriageVisitors) triageByPersonId.set(p.id, true);
      }
      const personas = (personaRows as Record<string, unknown>[]).map((r) => {
        const persona = mapPersona(r, assignedByPersona[r.id as string] ?? []);
        if (persona.personId) {
          persona.canTriageVisitors = triageByPersonId.get(persona.personId) ?? false;
        }
        return persona;
      });

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
        if (persona.notificationPrefs) {
          setNotificationPrefsState(persona.notificationPrefs);
        }
        setCalendarSyncEnabledState(persona.calendarSyncEnabled ?? false);
        setCalendarFeedTokenState(persona.calendarFeedToken ?? null);
      }

      // Resolve the active session first so we can validate any stored persona
      // against it. Without this check, a leftover localStorage value (e.g. from
      // a dev persona switch or a previous user on a shared device) would
      // silently log this session in as the wrong persona.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const savedPersonaId = localStorage.getItem('shepherd-app-persona');
      if (savedPersonaId) {
        const persona = personas.find((p) => p.id === savedPersonaId);
        const belongsToSession =
          persona && session?.user ? persona.userId === session.user.id : false;
        if (persona && belongsToSession) {
          setCurrentPersona(persona);
          applyPersonaSettings(persona);
          setLoaded(true);
          return;
        }
        // Stored ID is missing, stale, or belongs to a different auth user —
        // discard it and fall through to session-based resolution.
        localStorage.removeItem('shepherd-app-persona');
      }

      if (session?.user) {
        const sessionPersona = personas.find((p) => p.userId === session.user.id);
        console.log('[AppContext.load] session present, sessionPersonaFound:', !!sessionPersona, 'personasCount:', personas.length);
        if (sessionPersona) {
          setCurrentPersona(sessionPersona);
          applyPersonaSettings(sessionPersona);
          localStorage.setItem('shepherd-app-persona', sessionPersona.id);
          setLoaded(true);
        }
        // No matching persona yet — the auth-state subscription below will
        // call loginWithSupabaseUser, which verifies approval, sets the
        // correct persona, and calls setLoaded(true) in its finally block.
      } else {
        console.log('[AppContext.load] no session → setLoaded(true)');
        setLoaded(true);
      }
    }

    load();
  }, []);

  // Reset all page filters when the active persona changes
  useEffect(() => {
    setHomeFilters(HOME_DEFAULT_FILTERS);
    setHomeSortKey('last-contacted');
    setTodosShepherdFilter(['mine']);
    setLogsShepherdFilter(['mine']);
  }, [currentPersona.id]);

  // ── Supabase auth → persona sync ─────────────────────────────────────
  const loginWithSupabaseUser = useCallback(
    async (userId: string, name: string, email?: string, avatarUrl?: string) => {
      console.log('[loginWithSupabaseUser] start', { userId, email });
      const supabase = createClient();

      // Wrap the whole body so the UI always unsticks from the "Loading…" state
      // (via the finally), even if any persona insert silently returns null —
      // e.g. RLS rejection or a concurrent duplicate insert losing the PK race.
      try {
        // 0. Access gate — email must be on the approved list
        if (!email) {
          await supabase.auth.signOut();
          localStorage.removeItem('shepherd-app-persona');
          setAccessDenied(true);
          return;
        }
        const { data: approved } = await supabase
          .from('approved_emails')
          .select('email')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        if (!approved) {
          await supabase.auth.signOut();
          localStorage.removeItem('shepherd-app-persona');
          setAccessDenied(true);
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
          return;
        }

        // 2. No user_id match — try to auto-link via approved_emails.person_id first,
        //    then fall back to email matching in people. The explicit person_id stored
        //    at invite time is authoritative and avoids false matches when two people
        //    share the same email address (e.g. a joint family inbox).
        if (email) {
          // Prefer the person_id recorded when the invite was sent.
          const { data: approvedRow } = await supabase
            .from('approved_emails')
            .select('person_id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

          const resolvedPersonId: string | null =
            approvedRow?.person_id ??
            (await supabase
              .from('people')
              .select('id')
              .eq('email', email.toLowerCase())
              .maybeSingle()
              .then(({ data }) => data?.id ?? null));

          // If the resolved person is a hidden test record, mirror the flag onto the
          // auto-created persona so test users see the in-prod persona switcher.
          // Pull preferred/last name in the same round-trip so the persona can be
          // labelled from the shepherd DB rather than the Google account.
          const { data: resolvedPersonRow } = resolvedPersonId
            ? await supabase
                .from('people')
                .select('is_test, preferred_name, last_name')
                .eq('id', resolvedPersonId)
                .maybeSingle()
            : { data: null };
          const resolvedIsTest: boolean = Boolean(
            (resolvedPersonRow as { is_test?: boolean } | null)?.is_test
          );
          const resolvedPersonName: string = (() => {
            const r = resolvedPersonRow as
              | { preferred_name?: string; last_name?: string | null }
              | null;
            if (!r?.preferred_name) return name;
            return r.last_name ? `${r.preferred_name} ${r.last_name}` : r.preferred_name;
          })();

          if (resolvedPersonId) {
            const { data: personaRow } = await supabase
              .from('personas')
              .select('*')
              .eq('person_id', resolvedPersonId)
              .maybeSingle();

            // If the persona is stamped with an auth user_id that no longer
            // exists in auth.users (e.g. the old test account was deleted, or
            // the admin re-pointed this person's email to a different account),
            // the stored link is stale and we should reclaim the persona for
            // the new auth user rather than orphaning them in step 3.
            const existingUserId = personaRow?.user_id as string | null | undefined;
            const staleExistingLink =
              existingUserId && existingUserId !== userId
                ? await isStaleAuthUser(existingUserId)
                : false;

            if (personaRow) {
              // Guard: never hijack a persona that already belongs to a *live*
              // different auth user. Stale links are reclaimed.
              if (existingUserId && existingUserId !== userId && !staleExistingLink) {
                // Fall through to step 3 — create a fresh persona for this auth user.
              } else {
                // Persona found — stamp it with the auth user_id so future logins are instant
                await supabase
                  .from('personas')
                  .update({ user_id: userId, email })
                  .eq('id', personaRow.id);
                const linked = { ...personaRow, user_id: userId };
                const { data: ppRows } = await supabase
                  .from('persona_people')
                  .select('person_id')
                  .eq('persona_id', personaRow.id);
                const assignedPeopleIds = (ppRows ?? []).map(
                  (r: { person_id: string }) => r.person_id
                );
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
                return;
              }
            } else {
              // Person record exists but no persona yet — first-time sign-in for an invited user.
              // Create a persona linked to their person record so their profile is immediately visible.
              // Prefer the shepherd-DB name over the Google display name to keep
              // identity consistent with the church directory.
              const { data: inserted, error: insertError } = await supabase
                .from('personas')
                .insert({
                  id: userId,
                  user_id: userId,
                  name: resolvedPersonName,
                  role: 'shepherd',
                  email,
                  person_id: resolvedPersonId,
                  is_test: resolvedIsTest,
                })
                .select()
                .single();
              if (insertError) {
                console.error('personas insert (link path) failed:', JSON.stringify(insertError, null, 2));
              }
              if (inserted) {
                const persona = mapPersona(inserted as Record<string, unknown>, []);
                setCurrentPersona(persona);
                setCurrentUserEmail(email);
                localStorage.setItem('shepherd-app-persona', persona.id);
                setData((prev) => ({ ...prev, personas: [...prev.personas, persona] }));
                if (avatarUrl) {
                  syncGoogleAvatar(supabase, resolvedPersonId, avatarUrl, setData);
                }
                return;
              }
            }
          }
        }

        // 3. Truly new user — create a fresh shepherd persona
        const { data: inserted, error: insertError } = await supabase
          .from('personas')
          .insert({ id: userId, user_id: userId, name, role: 'shepherd', email })
          .select()
          .single();
        if (insertError) {
          console.error('personas insert (fresh path) failed:', JSON.stringify(insertError, null, 2));
        }
        if (inserted) {
          const persona = mapPersona(inserted as Record<string, unknown>, []);
          setCurrentPersona(persona);
          setCurrentUserEmail(email);
          localStorage.setItem('shepherd-app-persona', persona.id);
          setData((prev) => ({ ...prev, personas: [...prev.personas, persona] }));
        }
      } catch (err) {
        console.error('[loginWithSupabaseUser] threw:', err);
      } finally {
        console.log('[loginWithSupabaseUser] finally → setLoaded(true)');
        setLoaded(true);
      }
    },
    []
  );

  // ── Supabase auth state subscription ─────────────────────────────────
  // Must live here (not in a child component) so it mounts even while
  // `loaded` is false. The previous external <AuthSync /> child never
  // mounted on first sign-in because the Provider's `!loaded` early-return
  // suppressed its children — and `loaded` only flips true when the auth
  // subscription itself calls loginWithSupabaseUser. Chicken-and-egg.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthSync] event:', event, 'hasUser:', !!session?.user, 'email:', session?.user?.email);
      if (!session?.user) return;
      const user = session.user;
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const email = user.email;
      const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

      if (event === 'SIGNED_IN') {
        console.log('[AuthSync] → loginWithSupabaseUser (SIGNED_IN)');
        loginWithSupabaseUser(user.id, name, email, avatarUrl);
      } else if (event === 'INITIAL_SESSION') {
        const stored = localStorage.getItem('shepherd-app-persona');
        console.log('[AuthSync] INITIAL_SESSION, storedPersona:', stored);
        if (!stored) {
          console.log('[AuthSync] → loginWithSupabaseUser (INITIAL_SESSION)');
          loginWithSupabaseUser(user.id, name, email, avatarUrl);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loginWithSupabaseUser]);

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
          newData.people = prev.people.map((p) =>
            p.id === note.personId ? { ...p, lastContactDate: formatISO(new Date()) } : p
          );
        }
        if (note.familyId) {
          const family = prev.families.find((f) => f.id === note.familyId);
          if (family) {
            newData.people = (newData.people || prev.people).map((p) =>
              family.memberIds.includes(p.id) ? { ...p, lastContactDate: formatISO(new Date()) } : p
            );
          }
        }
        return newData;
      });

      // Persist to Supabase
      const supabase = createClient();
      const { error: noteInsertError } = await supabase.from('notes').insert({
        id: note.id,
        person_id: note.personId ?? null,
        family_id: note.familyId ?? null,
        todo_id: note.todoId ?? null,
        type: note.type,
        visibility: note.visibility,
        content: note.content ?? null,
        mentions: note.mentions ?? [],
        created_by: note.createdBy,
        created_at: note.createdAt,
      });
      if (noteInsertError) {
        console.error('notes insert failed:', JSON.stringify(noteInsertError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }

      if (note.personId) {
        const { error: contactDateError } = await supabase
          .from('people')
          .update({ last_contact_date: formatISO(new Date()) })
          .eq('id', note.personId);
        if (contactDateError) {
          console.error('people last_contact_date update failed:', JSON.stringify(contactDateError, null, 2));
        }
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
        return {
          ...prev,
          notes: prev.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<NoteRow> = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
      if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
      const { error } = await supabase.from('notes').update(dbUpdates).eq('id', noteId);
      if (error) {
        console.error('notes update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    []
  );

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) };
    });
    const supabase = createClient();
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) {
      console.error('notes delete failed:', JSON.stringify(error, null, 2));
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
      setData((prev) => {
        snapshot = prev;
        return { ...prev, todos: [todo, ...prev.todos] };
      });
      const supabase = createClient();
      const { error } = await supabase.from('todos').insert({
        id: todo.id,
        person_id: todo.personId ?? null,
        family_id: todo.familyId ?? null,
        title: todo.title,
        due_date: todo.dueDate ?? null,
        end_date: todo.endDate ?? null,
        repeat: todo.repeat ?? null,
        reminder: todo.reminder ?? null,
        reminder_due_at: calcReminderDueAt(todo.dueDate, todo.reminder),
        completed: false,
        created_by: todo.createdBy,
        created_at: todo.createdAt,
      });
      if (error) {
        console.error('todos insert failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    [currentPersona.id]
  );

  const updateTodo = useCallback(
    async (
      todoId: string,
      updates: Partial<
        Pick<
          Todo,
          'title' | 'dueDate' | 'endDate' | 'repeat' | 'reminder' | 'familyId' | 'personId'
        >
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      let existingTodo: Todo | undefined;
      setData((prev) => {
        snapshot = prev;
        existingTodo = prev.todos.find((t) => t.id === todoId);
        return {
          ...prev,
          todos: prev.todos.map((t) => (t.id === todoId ? { ...t, ...updates } : t)),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<TodoRow> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
      if (updates.reminder !== undefined) dbUpdates.reminder = updates.reminder;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      // Recalculate reminder_due_at and reset reminder_sent_at when schedule changes
      if (updates.dueDate !== undefined || updates.reminder !== undefined) {
        const newDueDate = updates.dueDate ?? existingTodo?.dueDate;
        const newReminder = updates.reminder ?? existingTodo?.reminder;
        dbUpdates.reminder_due_at = calcReminderDueAt(newDueDate, newReminder);
        dbUpdates.reminder_sent_at = null;
      }
      const { error } = await supabase.from('todos').update(dbUpdates).eq('id', todoId);
      if (error) {
        console.error('todos update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    []
  );

  const deleteTodo = useCallback(async (todoId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return { ...prev, todos: prev.todos.filter((t) => t.id !== todoId) };
    });
    const supabase = createClient();
    const { error } = await supabase.from('todos').delete().eq('id', todoId);
    if (error) {
      console.error('todos delete failed:', JSON.stringify(error, null, 2));
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
    const { error } = await supabase
      .from('todos')
      .update({
        completed: newCompleted,
        completed_at: completedAt ?? null,
      })
      .eq('id', todoId);
    if (error) {
      console.error('todos toggle failed:', JSON.stringify(error, null, 2));
      if (snapshot) setData(snapshot);
      showToast('Failed to update to-do. Try again.', 'error');
    }
  }, []);

  // ── People ────────────────────────────────────────────────────────────
  const addPerson = useCallback(
    async (
      personData: Omit<Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds'>
    ): Promise<string> => {
      const person: Person = {
        ...personData,
        id: generateId(),
        assignedShepherdIds: [],
        groupIds: [],
        createdAt: new Date().toISOString(),
        createdBy: currentPersona.id,
        isTest: currentPersona.isTest === true,
      };
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, people: [...prev.people, person] };
      });
      const supabase = createClient();
      const { error } = await supabase.from('people').insert({
        id: person.id,
        preferred_name: person.preferredName,
        last_name: person.lastName ?? null,
        alternative_name: person.alternativeName ?? null,
        photo: person.photo ?? null,
        gender: person.gender ?? null,
        marital_status: person.maritalStatus ?? null,
        birthday: person.birthday ?? null,
        baptized: person.baptized ?? false,
        baptism_date: person.baptismDate ?? null,
        membership_date: person.membershipDate ?? null,
        anniversary: person.anniversary ?? null,
        phone: person.phone ?? null,
        home_phone: person.homePhone ?? null,
        email: person.email ?? null,
        home_address: person.homeAddress ?? null,
        is_shepherd: person.isShepherd ?? false,
        is_student: person.isStudent ?? false,
        church_positions: person.churchPositions ?? [],
        membership_status: person.membershipStatus,
        church_attendance: person.churchAttendance,
        language: person.language,
        family_id: person.familyId ?? null,
        created_at: person.createdAt,
        created_by: person.createdBy ?? null,
        is_test: person.isTest ?? false,
      });
      if (error) {
        console.error('people insert failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        throw new Error('Failed to add person');
      }
      void fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'person.added',
          personName: fullName(person),
          addedByName: currentPersona.name,
          actorEmail: currentUserEmail,
          actorUserId: currentPersona.userId,
        }),
      });
      return person.id;
    },
    [currentPersona.id, currentPersona.name, currentPersona.userId, currentUserEmail]
  );

  const promoteVisitorSubmission = useCallback(
    async (submissionId: string): Promise<string> => {
      const supabase = createClient();
      const { data: row } = await supabase
        .from('visitor_submissions')
        .select('*')
        .eq('id', submissionId)
        .maybeSingle();
      if (!row) throw new Error('Submission not found');
      const r = row as Record<string, unknown>;

      const preferredName = r.preferred_name as string;
      const lastName = (r.last_name as string | null) ?? undefined;
      const personId = await addPerson({
        preferredName,
        lastName,
        alternativeName: (r.alternative_name as string | null) ?? undefined,
        phone: (r.phone as string | null) ?? undefined,
        email: (r.email as string | null) ?? undefined,
        isStudent: (r.is_student as boolean | null) ?? false,
        language:
          ((r.languages as string[] | null) ?? []).length > 0
            ? (r.languages as string[])
            : ['English'],
        membershipStatus: 'non-member',
        churchAttendance: 'visitor',
      });

      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await addTodo({
        title: `Contact ${fullName({ preferredName, lastName })}`,
        personId,
        dueDate: oneWeekFromNow,
      });

      await supabase
        .from('visitor_submissions')
        .update({ status: 'promoted', person_id: personId })
        .eq('id', submissionId);

      return personId;
    },
    [addPerson, addTodo]
  );

  const discardVisitorSubmission = useCallback(async (submissionId: string): Promise<void> => {
    const supabase = createClient();
    await supabase
      .from('visitor_submissions')
      .update({ status: 'discarded' })
      .eq('id', submissionId);
  }, []);

  const updateVisitorSubmission = useCallback(
    async (
      submissionId: string,
      patch: {
        referralSource?: import('./types').ReferralSource | null;
        referralDetail?: string | null;
        interests?: import('./types').Interest[];
        prayerRequest?: string | null;
      }
    ): Promise<void> => {
      const supabase = createClient();
      const row: Record<string, unknown> = {};
      if (patch.referralSource !== undefined) row.referral_source = patch.referralSource;
      if (patch.referralDetail !== undefined) row.referral_detail = patch.referralDetail;
      if (patch.interests !== undefined) row.interests = patch.interests;
      if (patch.prayerRequest !== undefined) row.prayer_request = patch.prayerRequest;
      if (Object.keys(row).length === 0) return;
      const { error } = await supabase
        .from('visitor_submissions')
        .update(row)
        .eq('id', submissionId);
      if (error) {
        console.error('updateVisitorSubmission failed:', error);
        throw error;
      }
    },
    []
  );

  const updatePerson = useCallback(
    async (
      personId: string,
      updates: Partial<
        Pick<
          Person,
          | 'preferredName'
          | 'lastName'
          | 'alternativeName'
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
          | 'baptized'
          | 'baptismDate'
          | 'anniversary'
          | 'isShepherd'
          | 'isBeingDiscipled'
          | 'churchPositions'
          | 'appRole'
          | 'canTriageVisitors'
          | 'isStudent'
        >
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      let currentPerson: Person | undefined;
      let linkedUserId: string | undefined;
      setData((prev) => {
        snapshot = prev;
        currentPerson = prev.people.find((p) => p.id === personId);
        linkedUserId = prev.personas.find((p) => p.personId === personId)?.userId;
        return {
          ...prev,
          people: prev.people.map((p) => (p.id === personId ? { ...p, ...updates } : p)),
          personas:
            updates.canTriageVisitors !== undefined
              ? prev.personas.map((pa) =>
                  pa.personId === personId
                    ? { ...pa, canTriageVisitors: updates.canTriageVisitors }
                    : pa
                )
              : prev.personas,
        };
      });
      if (updates.canTriageVisitors !== undefined) {
        setCurrentPersona((prev) =>
          prev.personId === personId
            ? { ...prev, canTriageVisitors: updates.canTriageVisitors }
            : prev
        );
      }
      const supabase = createClient();
      const dbUpdates: Partial<PersonRow> = {};
      if (updates.preferredName !== undefined) dbUpdates.preferred_name = updates.preferredName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.alternativeName !== undefined)
        dbUpdates.alternative_name = updates.alternativeName;
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
      if (updates.baptized !== undefined) dbUpdates.baptized = updates.baptized;
      if (updates.baptismDate !== undefined) dbUpdates.baptism_date = updates.baptismDate;
      if (updates.anniversary !== undefined) dbUpdates.anniversary = updates.anniversary;
      if (updates.isShepherd !== undefined) dbUpdates.is_shepherd = updates.isShepherd;
      if (updates.isBeingDiscipled !== undefined)
        dbUpdates.is_being_discipled = updates.isBeingDiscipled;
      if (updates.churchPositions !== undefined)
        dbUpdates.church_positions = updates.churchPositions;
      if (updates.appRole !== undefined) dbUpdates.app_role = updates.appRole;
      if (updates.canTriageVisitors !== undefined)
        dbUpdates.can_triage_visitors = updates.canTriageVisitors;
      if (updates.isStudent !== undefined) dbUpdates.is_student = updates.isStudent;
      const now = new Date().toISOString();
      dbUpdates.last_edited_at = now;
      dbUpdates.last_edited_by_name = currentPersona.name;
      const auditRows = currentPerson
        ? AUDIT_FIELD_KEYS.filter((field) => field in updates).flatMap((field) => {
            const oldRaw = currentPerson![field as keyof Person];
            const newRaw = updates[field as keyof typeof updates];
            const oldStr = serializeAuditValue(field, oldRaw);
            const newStr = serializeAuditValue(field, newRaw);
            if (oldStr === newStr) return [];
            return [
              {
                person_id: personId,
                changed_by_persona_id: currentPersona.id,
                changed_by_name: currentPersona.name,
                field_name: field,
                old_value: oldStr,
                new_value: newStr,
                created_at: now,
              },
            ];
          })
        : [];
      const [{ error: personUpdateError }, auditResult] = await Promise.all([
        supabase.from('people').update(dbUpdates).eq('id', personId),
        auditRows.length > 0
          ? supabase.from('audit_logs').insert(auditRows)
          : Promise.resolve({ error: null }),
      ]);
      const auditError = auditResult.error;
      if (personUpdateError || auditError) {
        console.error(
          'updatePerson failed:',
          JSON.stringify(personUpdateError ?? auditError, null, 2)
        );
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
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
      if (currentPerson && currentPerson.assignedShepherdIds.length > 0) {
        void fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'person.updated',
            personName: fullName(currentPerson),
            shepherdPersonaIds: currentPerson.assignedShepherdIds,
            personUserId: linkedUserId,
            updatedByName: currentPersona.name,
            actorEmail: currentUserEmail,
            actorUserId: currentPersona.userId,
            changes: auditRows.map((r) => ({
              field: r.field_name,
              oldValue: r.old_value,
              newValue: r.new_value,
            })),
          }),
        });
      }
    },
    [currentPersona.id, currentPersona.name, currentPersona.userId, currentUserEmail]
  );

  const fetchAuditLogs = useCallback(
    async (personId: string): Promise<import('./types').AuditLog[]> => {
      const supabase = createClient();
      const { data: rows } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false });
      return (rows ?? []).map(mapAuditLog);
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
    const { error } = await supabase.from('people').delete().eq('id', personId);
    if (error) {
      console.error('people delete failed:', JSON.stringify(error, null, 2));
      if (snapshot) setData(snapshot);
      showToast('Failed to delete person. Try again.', 'error');
    }
  }, []);

  const assignShepherds = useCallback(
    async (personId: string, shepherdIds: string[]): Promise<void> => {
      let snapshot: AppData | undefined;
      let personName = '';
      let unchanged = false;
      let newlyAddedShepherdIds: string[] = [];
      setData((prev) => {
        snapshot = prev;
        const p = prev.people.find((p) => p.id === personId);
        personName = p ? fullName(p) : '';
        if (p) {
          const current = p.assignedShepherdIds;
          if (
            current.length === shepherdIds.length &&
            current.every((id) => shepherdIds.includes(id))
          ) {
            unchanged = true;
            return prev;
          }
          newlyAddedShepherdIds = shepherdIds.filter((id) => !current.includes(id));
        } else {
          newlyAddedShepherdIds = shepherdIds;
        }
        const personaIdSet = new Set(prev.personas.map((pp) => pp.id));
        const shepherdPersonaIdSet = new Set(shepherdIds.filter((sid) => personaIdSet.has(sid)));
        return {
          ...prev,
          people: prev.people.map((p) =>
            p.id === personId ? { ...p, assignedShepherdIds: shepherdIds } : p
          ),
          personas: prev.personas.map((persona) => {
            const shouldHave = shepherdPersonaIdSet.has(persona.id);
            const has = persona.assignedPeopleIds.includes(personId);
            if (shouldHave === has) return persona;
            return {
              ...persona,
              assignedPeopleIds: shouldHave
                ? [...persona.assignedPeopleIds, personId]
                : persona.assignedPeopleIds.filter((id) => id !== personId),
            };
          }),
        };
      });
      if (unchanged) return;
      // Keep currentPersona.assignedPeopleIds in sync so the "My Sheep" filter
      // reflects new assignments without requiring a page reload. (currentPersona
      // is a separate state slice from data.personas — both need patching.)
      setCurrentPersona((prev) => {
        const isNowMine = shepherdIds.includes(prev.id);
        const wasMine = prev.assignedPeopleIds.includes(personId);
        if (isNowMine === wasMine) return prev;
        return {
          ...prev,
          assignedPeopleIds: isNowMine
            ? [...prev.assignedPeopleIds, personId]
            : prev.assignedPeopleIds.filter((id) => id !== personId),
        };
      });
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('person_shepherds')
        .delete()
        .eq('person_id', personId);
      if (deleteError) {
        console.error('person_shepherds delete failed:', JSON.stringify(deleteError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      const { error: ppDeleteError } = await supabase
        .from('persona_people')
        .delete()
        .eq('person_id', personId);
      if (ppDeleteError) {
        console.error('persona_people delete failed:', JSON.stringify(ppDeleteError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      if (shepherdIds.length > 0) {
        const { error: insertError } = await supabase
          .from('person_shepherds')
          .insert(shepherdIds.map((sid) => ({ person_id: personId, shepherd_id: sid })));
        if (insertError) {
          console.error('person_shepherds insert failed:', JSON.stringify(insertError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
        // Mirror into persona_people for shepherd_ids that correspond to a persona.
        // (person_shepherds.shepherd_id can also be a person_id for shepherds without
        // a persona; those have no persona_people row.)
        const { data: personaMatches, error: personaLookupError } = await supabase
          .from('personas')
          .select('id')
          .in('id', shepherdIds);
        if (personaLookupError) {
          console.error('personas lookup failed:', JSON.stringify(personaLookupError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
        const personaShepherdIds = (personaMatches ?? []).map((r: { id: string }) => r.id);
        if (personaShepherdIds.length > 0) {
          const { error: ppInsertError } = await supabase
            .from('persona_people')
            .insert(personaShepherdIds.map((pid) => ({ persona_id: pid, person_id: personId })));
          if (ppInsertError) {
            console.error('persona_people insert failed:', JSON.stringify(ppInsertError, null, 2));
            if (snapshot) setData(snapshot);
            showToast(SAVE_ERROR_MSG, 'error');
            return;
          }
        }
      }
      if (newlyAddedShepherdIds.length > 0 && personName) {
        void fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'shepherd.assigned',
            personName,
            shepherdPersonaIds: newlyAddedShepherdIds,
            assignedByName: currentPersona.name,
            actorEmail: currentUserEmail,
            actorUserId: currentPersona.userId,
          }),
        });
      }
    },
    [currentPersona.name, currentPersona.userId, currentUserEmail]
  );

  // ── Families ──────────────────────────────────────────────────────────
  const addFamily = useCallback(async (label: string, memberIds: string[]): Promise<string> => {
    const familyId = generateId();
    const isTest = currentPersona.isTest === true;
    const family: Family = { id: familyId, label, tags: [], memberIds, isTest };
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
    const { error: familyInsertError } = await supabase
      .from('families')
      .insert({ id: familyId, label, tags: [], is_test: isTest });
    if (familyInsertError) {
      console.error('families insert failed:', JSON.stringify(familyInsertError, null, 2));
      if (snapshot) setData(snapshot);
      showToast(SAVE_ERROR_MSG, 'error');
      return familyId;
    }
    if (memberIds.length > 0) {
      const { error: membersInsertError } = await supabase
        .from('family_members')
        .insert(memberIds.map((pid) => ({ family_id: familyId, person_id: pid })));
      if (membersInsertError) {
        console.error('family_members insert failed:', JSON.stringify(membersInsertError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return familyId;
      }
      const peopleResults = await Promise.all(
        memberIds.map((pid) =>
          supabase.from('people').update({ family_id: familyId }).eq('id', pid)
        )
      );
      const peopleError = peopleResults.find((r) => r.error)?.error;
      if (peopleError) {
        console.error('people family_id update failed:', JSON.stringify(peopleError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    }
    return familyId;
  }, [currentPersona.isTest]);

  const updateFamily = useCallback(
    async (
      familyId: string,
      updates: Partial<
        Pick<Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>
      >
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return {
          ...prev,
          families: prev.families.map((f) => (f.id === familyId ? { ...f, ...updates } : f)),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<FamilyRow> = {};
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if ('photo' in updates) dbUpdates.photo = updates.photo ?? null;
      if ('originalPhoto' in updates) dbUpdates.original_photo = updates.originalPhoto ?? null;
      if (updates.primaryContactId !== undefined)
        dbUpdates.primary_contact_id = updates.primaryContactId;
      if (updates.childCount !== undefined) dbUpdates.child_count = updates.childCount;
      const { error } = await supabase.from('families').update(dbUpdates).eq('id', familyId);
      if (error) {
        console.error('families update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    []
  );

  const updateFamilyMembers = useCallback(
    async (familyId: string, newMemberIds: string[]): Promise<void> => {
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
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId);
      if (deleteError) {
        console.error('family_members delete failed:', JSON.stringify(deleteError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      if (newMemberIds.length > 0) {
        const { error: insertError } = await supabase
          .from('family_members')
          .insert(newMemberIds.map((pid) => ({ family_id: familyId, person_id: pid })));
        if (insertError) {
          console.error('family_members insert failed:', JSON.stringify(insertError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
      }
      const peopleResults = await Promise.all(
        newMemberIds.map((pid) =>
          supabase.from('people').update({ family_id: familyId }).eq('id', pid)
        )
      );
      const peopleError = peopleResults.find((r) => r.error)?.error;
      if (peopleError) {
        console.error('people family_id update failed:', JSON.stringify(peopleError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    []
  );

  const addGroup = useCallback(async (name: string, description?: string): Promise<void> => {
    const isTest = currentPersona.isTest === true;
    const group = {
      id: generateId(),
      name,
      description,
      leaderIds: [],
      memberIds: [],
      relatedFamilyIds: [],
      isTest,
    };
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return { ...prev, groups: [...prev.groups, group] };
    });
    const supabase = createClient();
    const { error } = await supabase
      .from('groups')
      .insert({ id: group.id, name, description: description ?? null, is_test: isTest });
    if (error) {
      console.error('groups insert failed:', JSON.stringify(error, null, 2));
      if (snapshot) setData(snapshot);
      showToast(SAVE_ERROR_MSG, 'error');
    }
  }, [currentPersona.isTest]);

  const updateGroup = useCallback(
    async (
      groupId: string,
      updates: Partial<Pick<import('./types').Group, 'name' | 'description' | 'leaderIds'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;

      setData((prev) => {
        snapshot = prev;
        const newGroups = prev.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g));
        return { ...prev, groups: newGroups };
      });

      const supabase = createClient();
      const dbUpdates: Partial<GroupRow> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
      if (updates.leaderIds !== undefined) dbUpdates.leader_ids = updates.leaderIds;
      const { error } = await supabase.from('groups').update(dbUpdates).eq('id', groupId);
      if (error) {
        console.error('groups update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    []
  );

  const updateGroupMembers = useCallback(
    async (groupId: string, memberIds: string[]): Promise<void> => {
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
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);
      if (deleteError) {
        console.error('group_members delete failed:', JSON.stringify(deleteError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      if (memberIds.length > 0) {
        const { error: insertError } = await supabase
          .from('group_members')
          .insert(memberIds.map((pid) => ({ group_id: groupId, person_id: pid })));
        if (insertError) {
          console.error('group_members insert failed:', JSON.stringify(insertError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
        }
      }
    },
    []
  );

  const assignGroupsToPerson = useCallback(
    async (personId: string, groupIds: string[]): Promise<void> => {
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
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('person_id', personId);
      if (deleteError) {
        console.error('group_members delete failed:', JSON.stringify(deleteError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      for (const gid of groupIds) {
        const { error: insertError } = await supabase
          .from('group_members')
          .insert({ group_id: gid, person_id: personId });
        if (insertError) {
          console.error('group_members insert failed:', JSON.stringify(insertError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
      }
    },
    []
  );

  const assignGroupsToFamily = useCallback(
    async (familyId: string, groupIds: string[]): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        const family = prev.families.find((f) => f.id === familyId);
        if (!family) return prev;
        const memberIds = family.memberIds;
        const newPeople = prev.people.map((p) =>
          memberIds.includes(p.id) ? { ...p, groupIds } : p
        );
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
      const { data: fmRows, error: selectError } = await supabase
        .from('family_members')
        .select('person_id')
        .eq('family_id', familyId);
      if (selectError) {
        console.error('family_members select failed:', JSON.stringify(selectError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      const memberIds = (fmRows ?? []).map((r: { person_id: string }) => r.person_id);
      for (const mid of memberIds) {
        const { error: deleteError } = await supabase
          .from('group_members')
          .delete()
          .eq('person_id', mid);
        if (deleteError) {
          console.error('group_members delete failed:', JSON.stringify(deleteError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
      }
      for (const gid of groupIds) {
        for (const mid of memberIds) {
          const { error: insertError } = await supabase
            .from('group_members')
            .insert({ group_id: gid, person_id: mid });
          if (insertError) {
            console.error('group_members insert failed:', JSON.stringify(insertError, null, 2));
            if (snapshot) setData(snapshot);
            showToast(SAVE_ERROR_MSG, 'error');
            return;
          }
        }
      }
    },
    []
  );

  const assignShepherdsToFamily = useCallback(
    async (familyId: string, shepherdIds: string[]): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        const family = prev.families.find((f) => f.id === familyId);
        if (!family) return prev;
        const memberIds = family.memberIds;
        const memberIdSet = new Set(memberIds);
        const personaIdSet = new Set(prev.personas.map((pp) => pp.id));
        const shepherdPersonaIdSet = new Set(shepherdIds.filter((sid) => personaIdSet.has(sid)));
        const newPeople = prev.people.map((p) =>
          memberIdSet.has(p.id) ? { ...p, assignedShepherdIds: shepherdIds } : p
        );
        const newPersonas = prev.personas.map((persona) => {
          const shouldHave = shepherdPersonaIdSet.has(persona.id);
          const withoutMembers = persona.assignedPeopleIds.filter((id) => !memberIdSet.has(id));
          const next = shouldHave ? [...withoutMembers, ...memberIds] : withoutMembers;
          if (
            next.length === persona.assignedPeopleIds.length &&
            next.every((id) => persona.assignedPeopleIds.includes(id))
          ) {
            return persona;
          }
          return { ...persona, assignedPeopleIds: next };
        });
        return { ...prev, people: newPeople, personas: newPersonas };
      });
      setCurrentPersona((prev) => {
        const isNowMine = shepherdIds.includes(prev.id);
        const family = snapshot?.families.find((f) => f.id === familyId);
        const memberIds = family?.memberIds ?? [];
        const withoutMembers = prev.assignedPeopleIds.filter((id) => !memberIds.includes(id));
        const next = isNowMine ? [...withoutMembers, ...memberIds] : withoutMembers;
        if (
          next.length === prev.assignedPeopleIds.length &&
          next.every((id) => prev.assignedPeopleIds.includes(id))
        ) {
          return prev;
        }
        return { ...prev, assignedPeopleIds: next };
      });

      const supabase = createClient();
      const { data: fmRows, error: selectError } = await supabase
        .from('family_members')
        .select('person_id')
        .eq('family_id', familyId);
      if (selectError) {
        console.error('family_members select failed:', JSON.stringify(selectError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      const memberIds = (fmRows ?? []).map((r: { person_id: string }) => r.person_id);
      // Look up which of these shepherdIds correspond to a persona, once for the whole family.
      let personaShepherdIds: string[] = [];
      if (shepherdIds.length > 0) {
        const { data: personaMatches, error: personaLookupError } = await supabase
          .from('personas')
          .select('id')
          .in('id', shepherdIds);
        if (personaLookupError) {
          console.error('personas lookup failed:', JSON.stringify(personaLookupError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
        personaShepherdIds = (personaMatches ?? []).map((r: { id: string }) => r.id);
      }
      for (const pid of memberIds) {
        const { error: deleteError } = await supabase
          .from('person_shepherds')
          .delete()
          .eq('person_id', pid);
        if (deleteError) {
          console.error('person_shepherds delete failed:', JSON.stringify(deleteError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
        const { error: ppDeleteError } = await supabase
          .from('persona_people')
          .delete()
          .eq('person_id', pid);
        if (ppDeleteError) {
          console.error('persona_people delete failed:', JSON.stringify(ppDeleteError, null, 2));
          if (snapshot) setData(snapshot);
          showToast(SAVE_ERROR_MSG, 'error');
          return;
        }
        if (shepherdIds.length > 0) {
          const { error: insertError } = await supabase
            .from('person_shepherds')
            .insert(shepherdIds.map((sid) => ({ person_id: pid, shepherd_id: sid })));
          if (insertError) {
            console.error('person_shepherds insert failed:', JSON.stringify(insertError, null, 2));
            if (snapshot) setData(snapshot);
            showToast(SAVE_ERROR_MSG, 'error');
            return;
          }
          if (personaShepherdIds.length > 0) {
            const { error: ppInsertError } = await supabase
              .from('persona_people')
              .insert(
                personaShepherdIds.map((sid) => ({ persona_id: sid, person_id: pid }))
              );
            if (ppInsertError) {
              console.error('persona_people insert failed:', JSON.stringify(ppInsertError, null, 2));
              if (snapshot) setData(snapshot);
              showToast(SAVE_ERROR_MSG, 'error');
              return;
            }
          }
        }
      }
    },
    []
  );

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
          const p = prev.people.find((p) => p.id === notice.personId);
          aboutName = p ? fullName(p) : '';
        } else if (notice.familyId) {
          aboutName = prev.families.find((f) => f.id === notice.familyId)?.label ?? '';
        }
        return { ...prev, notices: [notice, ...prev.notices] };
      });
      const supabase = createClient();
      const { error } = await supabase.from('notices').insert({
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
      if (error) {
        console.error('notices insert failed:', JSON.stringify(error, null, 2));
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
          actorUserId: currentPersona.userId,
        }),
      });
    },
    [currentPersona.id, currentPersona.name, currentPersona.userId, currentUserEmail]
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
        return {
          ...prev,
          notices: prev.notices.map((n) => (n.id === noticeId ? { ...n, ...updates } : n)),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<NoticeRow> = {};
      if (updates.categories !== undefined) dbUpdates.categories = updates.categories;
      if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
      if (updates.privacy !== undefined) dbUpdates.privacy = updates.privacy;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
      if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
      const { error } = await supabase.from('notices').update(dbUpdates).eq('id', noticeId);
      if (error) {
        console.error('notices update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    []
  );

  const deleteNotice = useCallback(async (noticeId: string): Promise<void> => {
    let snapshot: AppData | undefined;
    setData((prev) => {
      snapshot = prev;
      return { ...prev, notices: prev.notices.filter((n) => n.id !== noticeId) };
    });
    const supabase = createClient();
    const { error } = await supabase.from('notices').delete().eq('id', noticeId);
    if (error) {
      console.error('notices delete failed:', JSON.stringify(error, null, 2));
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

  const viewerIsTest = currentPersona.isTest === true;
  const visibleData = useMemo<AppData>(() => {
    if (viewerIsTest) return data;
    const people = visibleTo(data.people, false);
    const families = visibleTo(data.families, false);
    const groups = visibleTo(data.groups, false);
    const personas = visibleTo(data.personas, false);
    const hiddenPeople = new Set(
      data.people.filter((p) => p.isTest).map((p) => p.id)
    );
    const hiddenFamilies = new Set(
      data.families.filter((f) => f.isTest).map((f) => f.id)
    );
    const refHidden = (personId?: string, familyId?: string): boolean => {
      if (personId && hiddenPeople.has(personId)) return true;
      if (familyId && hiddenFamilies.has(familyId)) return true;
      return false;
    };
    const notes = data.notes.filter((n) => !refHidden(n.personId, n.familyId));
    const todos = data.todos.filter((t) => !refHidden(t.personId, t.familyId));
    const notices = data.notices.filter((n) => !refHidden(n.personId, n.familyId));
    return { people, families, groups, personas, notes, todos, notices };
  }, [data, viewerIsTest]);

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
        data: visibleData,
        personaByPersonId,
        currentPersona,
        accessDenied,
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
        promoteVisitorSubmission,
        discardVisitorSubmission,
        updateVisitorSubmission,
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
        notificationPrefs,
        setNotificationPreference,
        calendarSyncEnabled,
        calendarFeedToken,
        enableCalendarSync,
        disableCalendarSync,
        regenerateCalendarFeedToken,
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
