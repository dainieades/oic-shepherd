'use client';

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
  type Note,
  type Todo,
  type Notice,
  type ThemePreference,
  type NotificationPreferences,
} from './types';
import { mapPerson, mapFamily, mapPersona, syncGoogleAvatar, mapNote, mapNotice, mapTodo } from './mappers';
import { isStaleAuthUser } from '@/app/auth/actions';
import { initialData } from './data';
import { visibleTo, type MapProvider } from './utils';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/components/Toast';
import type { VisitorIntakeValues } from './types';

import {
  useFilterHook,
  type HomeSortKey,
  type HomeFilters,
  HOME_DEFAULT_FILTERS,
} from './hooks/useFilterHook';
import { usePreferencesHook } from './hooks/usePreferencesHook';
import { useNotesHook } from './hooks/useNotesHook';
import { useTodosHook } from './hooks/useTodosHook';
import { usePeopleHook } from './hooks/usePeopleHook';

export type { HomeSortKey, HomeFilters };
export { HOME_DEFAULT_FILTERS };

interface AppContextType {
  data: AppData;
  personaByPersonId: ReadonlyMap<string, Persona>;
  currentPersona: Persona;
  accessDenied: boolean;
  loginWithSupabaseUser: (userId: string, name: string, email?: string, avatarUrl?: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }) => void;
  updateNote: (
    noteId: string,
    updates: Partial<Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>>
  ) => void;
  deleteNote: (noteId: string) => void;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>) => void;
  updateTodo: (
    todoId: string,
    updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'repeat' | 'reminder' | 'familyId' | 'personId'>>
  ) => void;
  deleteTodo: (todoId: string) => void;
  toggleTodo: (todoId: string) => void;
  addPerson: (
    person: Omit<import('./types').Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds'>
  ) => Promise<string>;
  deletePerson: (personId: string) => void;
  addFamily: (label: string, memberIds: string[]) => Promise<string>;
  updatePerson: (
    personId: string,
    updates: Partial<Pick<import('./types').Person,
      | 'preferredName' | 'lastName' | 'alternativeName' | 'photo' | 'originalPhoto'
      | 'phone' | 'homePhone' | 'email' | 'homeAddress' | 'membershipStatus'
      | 'churchAttendance' | 'membershipDate' | 'language' | 'gender' | 'maritalStatus'
      | 'birthday' | 'baptized' | 'baptismDate' | 'anniversary' | 'isShepherd'
      | 'isBeingDiscipled' | 'churchPositions' | 'appRole' | 'canTriageVisitors'
    >>
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
    updates: Partial<Pick<import('./types').Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>>
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
    updates: Partial<Pick<Notice, 'categories' | 'urgency' | 'privacy' | 'content' | 'personId' | 'familyId'>>
  ) => void;
  deleteNotice: (noticeId: string) => void;
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
  setNotificationPreference: <K extends keyof NotificationPreferences>(key: K, value: boolean) => Promise<void>;
  calendarSyncEnabled: boolean;
  calendarFeedToken: string | null;
  enableCalendarSync: (pregenToken?: string) => Promise<string>;
  disableCalendarSync: () => Promise<void>;
  regenerateCalendarFeedToken: () => Promise<string>;
  supabaseUser: User | null;
  signOut: () => Promise<void>;
  linkGoogle: (redirectTo: string) => Promise<void>;
  submitVisitorCard: (values: VisitorIntakeValues) => Promise<void>;
  fullPageModalOpen: boolean;
  setFullPageModalOpen: Dispatch<SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [data, setData] = useState<AppData>(initialData);
  const [currentPersona, setCurrentPersona] = useState<Persona>(initialData.personas[0]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [fullPageModalOpen, setFullPageModalOpen] = useState(false);

  // ── Domain hooks ──────────────────────────────────────────────────────
  const filters = useFilterHook();

  const prefs = usePreferencesHook({ setData, currentPersonaId: currentPersona.id });

  const notes = useNotesHook({ setData, currentPersona, currentUserEmail, showToast });

  const todos = useTodosHook({ setData, currentPersonaId: currentPersona.id, showToast });

  const people = usePeopleHook({
    setData,
    currentPersona,
    setCurrentPersona,
    currentUserEmail,
    showToast,
    addTodo: todos.addTodo,
  });

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

      if (!peopleRows || peopleRows.length === 0) {
        setLoaded(true);
        return;
      }

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

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) setSupabaseUser(session.user);

      const savedPersonaId = localStorage.getItem('shepherd-app-persona');
      if (savedPersonaId) {
        const persona = personas.find((p) => p.id === savedPersonaId);
        const belongsToSession =
          persona && session?.user ? persona.userId === session.user.id : false;
        if (persona && belongsToSession) {
          setCurrentPersona(persona);
          prefs.applyPersonaSettings(persona);
          setLoaded(true);
          return;
        }
        localStorage.removeItem('shepherd-app-persona');
      }

      if (session?.user) {
        const sessionPersona = personas.find((p) => p.userId === session.user.id);
        if (sessionPersona) {
          setCurrentPersona(sessionPersona);
          prefs.applyPersonaSettings(sessionPersona);
          localStorage.setItem('shepherd-app-persona', sessionPersona.id);
          setLoaded(true);
        }
      } else {
        setLoaded(true);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset all page filters when the active persona changes
  useEffect(() => {
    filters.resetFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona.id]);

  // ── Supabase auth → persona sync ─────────────────────────────────────
  const loginWithSupabaseUser = useCallback(
    async (userId: string, name: string, email?: string, avatarUrl?: string) => {
      const supabase = createClient();
      try {
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

        if (email) {
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

            const existingUserId = personaRow?.user_id as string | null | undefined;
            const staleExistingLink =
              existingUserId && existingUserId !== userId
                ? await isStaleAuthUser(existingUserId)
                : false;

            if (personaRow) {
              if (existingUserId && existingUserId !== userId && !staleExistingLink) {
                // Fall through to step 3
              } else {
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
        showToast('Sign-in failed. Please try again.', 'error');
      } finally {
        setLoaded(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Supabase auth state subscription ─────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        return;
      }
      if (!session?.user) return;
      const user = session.user;
      setSupabaseUser(user);
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const email = user.email;
      const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

      if (event === 'SIGNED_IN') {
        loginWithSupabaseUser(user.id, name, email, avatarUrl);
      } else if (event === 'INITIAL_SESSION') {
        const stored = localStorage.getItem('shepherd-app-persona');
        if (!stored) {
          loginWithSupabaseUser(user.id, name, email, avatarUrl);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loginWithSupabaseUser]);

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('shepherd-app-persona');
  }, []);

  const linkGoogle = useCallback(async (redirectTo: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  }, []);

  const submitVisitorCard = useCallback(async (values: VisitorIntakeValues): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('visitor_submissions').insert({
      source: 'qr',
      status: 'pending',
      person_id: null,
      submitted_by: null,
      preferred_name: values.preferredName,
      last_name: values.lastName ?? null,
      alternative_name: values.alternativeName ?? null,
      phone: values.phone ?? null,
      email: values.email ?? null,
      life_stage: values.lifeStage,
      languages: values.languages,
      referral_source: values.referralSource ?? null,
      referral_detail: values.referralDetail ?? null,
      interests: values.interests,
      prayer_request: values.prayerRequest ?? null,
    });
    if (error) throw new Error(error.message);
  }, []);

  const personaByPersonId = useMemo(
    () => new Map(data.personas.filter((p) => p.personId).map((p) => [p.personId as string, p])),
    [data.personas]
  );

  const viewerIsTest = currentPersona.isTest === true;
  const visibleData = useMemo<AppData>(() => {
    if (viewerIsTest) return data;
    const people = visibleTo(data.people, false);
    const families = visibleTo(data.families, false);
    const groups = visibleTo(data.groups, false);
    const personas = visibleTo(data.personas, false);
    const hiddenPeople = new Set(data.people.filter((p) => p.isTest).map((p) => p.id));
    const hiddenFamilies = new Set(data.families.filter((f) => f.isTest).map((f) => f.id));
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-text-muted">Loading...</div>
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
        // Notes & notices
        addNote: notes.addNote,
        updateNote: notes.updateNote,
        deleteNote: notes.deleteNote,
        addNotice: notes.addNotice,
        updateNotice: notes.updateNotice,
        deleteNotice: notes.deleteNotice,
        canViewNote: notes.canViewNote,
        // Todos
        addTodo: todos.addTodo,
        updateTodo: todos.updateTodo,
        deleteTodo: todos.deleteTodo,
        toggleTodo: todos.toggleTodo,
        // People, families, groups
        addPerson: people.addPerson,
        updatePerson: people.updatePerson,
        deletePerson: people.deletePerson,
        promoteVisitorSubmission: people.promoteVisitorSubmission,
        discardVisitorSubmission: people.discardVisitorSubmission,
        updateVisitorSubmission: people.updateVisitorSubmission,
        fetchAuditLogs: people.fetchAuditLogs,
        assignShepherds: people.assignShepherds,
        addFamily: people.addFamily,
        updateFamily: people.updateFamily,
        updateFamilyMembers: people.updateFamilyMembers,
        assignShepherdsToFamily: people.assignShepherdsToFamily,
        addGroup: people.addGroup,
        updateGroup: people.updateGroup,
        updateGroupMembers: people.updateGroupMembers,
        assignGroupsToPerson: people.assignGroupsToPerson,
        assignGroupsToFamily: people.assignGroupsToFamily,
        // Filters
        homeFilters: filters.homeFilters,
        setHomeFilters: filters.setHomeFilters,
        homeSortKey: filters.homeSortKey,
        setHomeSortKey: filters.setHomeSortKey,
        todosShepherdFilter: filters.todosShepherdFilter,
        setTodosShepherdFilter: filters.setTodosShepherdFilter,
        logsShepherdFilter: filters.logsShepherdFilter,
        setLogsShepherdFilter: filters.setLogsShepherdFilter,
        // Preferences
        themePreference: prefs.themePreference,
        setThemePreference: prefs.setThemePreference,
        mapProvider: prefs.mapProvider,
        setMapProvider: prefs.setMapProvider,
        notificationPrefs: prefs.notificationPrefs,
        setNotificationPreference: prefs.setNotificationPreference,
        calendarSyncEnabled: prefs.calendarSyncEnabled,
        calendarFeedToken: prefs.calendarFeedToken,
        enableCalendarSync: prefs.enableCalendarSync,
        disableCalendarSync: prefs.disableCalendarSync,
        regenerateCalendarFeedToken: prefs.regenerateCalendarFeedToken,
        // Auth
        supabaseUser,
        signOut,
        linkGoogle,
        submitVisitorCard,
        // UI
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
