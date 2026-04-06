'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppData, Persona, Person, Family, Note, Todo, NoteType, NoteVisibility, TodoAlert, TodoRepeat, AppRole } from './types';
import { initialData } from './data';
import { generateId } from './utils';
import { createClient } from '@/utils/supabase/client';

interface AppContextType {
  data: AppData;
  currentPersona: Persona;
  accessDenied: boolean;
  switchPersona: (id: string) => void;
  loginWithSupabaseUser: (userId: string, name: string, email?: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }) => void;
  updateNote: (noteId: string, updates: Partial<Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>>) => void;
  deleteNote: (noteId: string) => void;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>) => void;
  updateTodo: (todoId: string, updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'repeat' | 'alert' | 'familyId' | 'personId'>>) => void;
  deleteTodo: (todoId: string) => void;
  toggleTodo: (todoId: string) => void;
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds' | 'followUpFrequencyDays'>) => void;
  deletePerson: (personId: string) => void;
  addFamily: (label: string, memberIds: string[]) => void;
  updatePerson: (personId: string, updates: Partial<Pick<Person, 'englishName' | 'chineseName' | 'photo' | 'phone' | 'homePhone' | 'email' | 'homeAddress' | 'membershipStatus' | 'membershipDate' | 'language' | 'gender' | 'maritalStatus' | 'birthday' | 'baptismDate' | 'anniversary' | 'followUpFrequencyDays' | 'spiritualNeeds' | 'physicalNeeds' | 'isShepherd' | 'isBeingDiscipled' | 'churchPositions' | 'appRole'>>) => void;
  assignShepherds: (personId: string, shepherdIds: string[]) => void;
  updateFamily: (familyId: string, updates: Partial<Pick<Family, 'label' | 'photo' | 'primaryContactId' | 'childCount'>>) => void;
  updateFamilyMembers: (familyId: string, memberIds: string[]) => void;
  addGroup: (name: string, description?: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<import('./types').Group, 'name' | 'description' | 'leaderIds'>>) => void;
  updateGroupMembers: (groupId: string, memberIds: string[]) => void;
  assignGroupsToPerson: (personId: string, groupIds: string[]) => void;
  assignGroupsToFamily: (familyId: string, groupIds: string[]) => void;
  assignShepherdsToFamily: (familyId: string, shepherdIds: string[]) => void;
  setFollowUpFrequency: (personId: string, days: number) => void;
  canViewNote: (note: Note) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

// ── DB row → AppData mappers ──────────────────────────────────────────────

function mapPerson(row: Record<string, unknown>, shepherdIds: string[], groupIds: string[]): Person {
  return {
    id: row.id as string,
    englishName: row.english_name as string,
    chineseName: row.chinese_name as string | undefined,
    photo: row.photo as string | undefined,
    gender: row.gender as Person['gender'],
    maritalStatus: row.marital_status as Person['maritalStatus'],
    birthday: row.birthday as string | undefined,
    baptismDate: row.baptism_date as string | undefined,
    membershipDate: row.membership_date as string | undefined,
    anniversary: row.anniversary as string | undefined,
    phone: row.phone as string | undefined,
    homePhone: row.home_phone as string | undefined,
    email: row.email as string | undefined,
    homeAddress: row.home_address as string | undefined,
    spiritualNeeds: row.spiritual_needs as string | undefined,
    physicalNeeds: row.physical_needs as string | undefined,
    isShepherd: row.is_shepherd as boolean | undefined,
    isBeingDiscipled: row.is_being_discipled as boolean | undefined,
    appRole: (row.app_role as AppRole | undefined) ?? 'no-access',
    churchPositions: row.church_positions as string[] | undefined,
    membershipStatus: row.membership_status as Person['membershipStatus'],
    language: (row.language as Person['language']) ?? 'english',
    familyId: row.family_id as string | undefined,
    followUpFrequencyDays: (row.follow_up_frequency_days as number) ?? 14,
    lastContactDate: row.last_contact_date as string | undefined,
    nextFollowUpDate: row.next_follow_up_date as string | undefined,
    isFirstTimeVisitor: row.is_first_time_visitor as boolean | undefined,
    isChild: row.is_child as boolean | undefined,
    assignedShepherdIds: shepherdIds,
    groupIds,
    createdAt: row.created_at as string,
    createdBy: row.created_by as string | undefined,
  };
}

function mapFamily(row: Record<string, unknown>, memberIds: string[]): Family {
  return {
    id: row.id as string,
    label: row.label as string,
    photo: row.photo as string | undefined,
    tags: (row.tags as string[]) ?? [],
    childCount: row.child_count as number | undefined,
    primaryContactId: row.primary_contact_id as string | undefined,
    memberIds,
    createdAt: row.created_at as string | undefined,
    createdBy: row.created_by as string | undefined,
  };
}

function mapPersona(row: Record<string, unknown>, assignedPeopleIds: string[]): Persona {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as Persona['role'],
    personId: row.person_id as string | undefined,
    userId: row.user_id as string | undefined,
    assignedPeopleIds,
  };
}

function mapNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    personId: row.person_id as string | undefined,
    familyId: row.family_id as string | undefined,
    type: row.type as Note['type'],
    visibility: row.visibility as Note['visibility'],
    content: row.content as string | undefined,
    mentions: (row.mentions as string[]) ?? [],
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

function mapTodo(row: Record<string, unknown>): Todo {
  return {
    id: row.id as string,
    personId: row.person_id as string | undefined,
    familyId: row.family_id as string | undefined,
    title: row.title as string,
    dueDate: row.due_date as string | undefined,
    repeat: row.repeat as Todo['repeat'],
    alert: row.alert as Todo['alert'],
    completed: (row.completed as boolean) ?? false,
    completedAt: row.completed_at as string | undefined,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

// ── AppProvider ───────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [currentPersona, setCurrentPersona] = useState<Persona>(initialData.personas[0]);
  const [loaded, setLoaded] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

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
      ]);

      // If no data in Supabase yet, fall back to seed data (before migration is run)
      if (!peopleRows || peopleRows.length === 0) {
        setLoaded(true);
        return;
      }

      // Build lookup maps
      const shepherdsByPerson: Record<string, string[]> = {};
      for (const r of (personShepherdRows ?? [])) {
        const row = r as { person_id: string; shepherd_id: string };
        if (!shepherdsByPerson[row.person_id]) shepherdsByPerson[row.person_id] = [];
        shepherdsByPerson[row.person_id].push(row.shepherd_id);
      }

      const groupsByPerson: Record<string, string[]> = {};
      for (const r of (groupMemberRows ?? [])) {
        const row = r as { group_id: string; person_id: string };
        if (!groupsByPerson[row.person_id]) groupsByPerson[row.person_id] = [];
        groupsByPerson[row.person_id].push(row.group_id);
      }

      const membersByFamily: Record<string, string[]> = {};
      for (const r of (familyMemberRows ?? [])) {
        const row = r as { family_id: string; person_id: string };
        if (!membersByFamily[row.family_id]) membersByFamily[row.family_id] = [];
        membersByFamily[row.family_id].push(row.person_id);
      }

      const membersByGroup: Record<string, string[]> = {};
      for (const r of (groupMemberRows ?? [])) {
        const row = r as { group_id: string; person_id: string };
        if (!membersByGroup[row.group_id]) membersByGroup[row.group_id] = [];
        membersByGroup[row.group_id].push(row.person_id);
      }

      const assignedByPersona: Record<string, string[]> = {};
      for (const r of (personaPeopleRows ?? [])) {
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
        memberIds: membersByGroup[r.id as string] ?? [],
        relatedFamilyIds: (r.related_family_ids as string[]) ?? [],
      }));

      const personas = (personaRows as Record<string, unknown>[]).map((r) =>
        mapPersona(r, assignedByPersona[r.id as string] ?? [])
      );

      const notes = (noteRows as Record<string, unknown>[]).map(mapNote);
      const todos = (todoRows as Record<string, unknown>[]).map(mapTodo);

      const loadedData: AppData = { people, families, groups, notes, todos, personas };
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
  const switchPersona = useCallback((id: string) => {
    const persona = data.personas.find((p) => p.id === id);
    if (persona) {
      setCurrentPersona(persona);
      localStorage.setItem('shepherd-app-persona', id);
    }
  }, [data.personas]);

  // ── Supabase auth → persona sync ─────────────────────────────────────
  const loginWithSupabaseUser = useCallback(async (userId: string, name: string, email?: string) => {
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
            personas: prev.personas.map((p) => p.id === persona.id ? persona : p),
          }));
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
  }, []);

  // ── Notes ─────────────────────────────────────────────────────────────
  const addNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdBy'> & { createdAt?: string }) => {
    const note: Note = {
      ...noteData,
      id: generateId(),
      createdBy: currentPersona.id,
      createdAt: noteData.createdAt ?? new Date().toISOString(),
    };

    // Optimistic update
    setData((prev) => {
      const newData = { ...prev, notes: [note, ...prev.notes] };
      if (note.personId) {
        newData.people = prev.people.map((p) => {
          if (p.id === note.personId) {
            const next = new Date();
            next.setDate(next.getDate() + p.followUpFrequencyDays);
            return { ...p, lastContactDate: new Date().toISOString(), nextFollowUpDate: next.toISOString() };
          }
          return p;
        });
      }
      if (note.familyId) {
        const family = prev.families.find((f) => f.id === note.familyId);
        if (family) {
          newData.people = (newData.people || prev.people).map((p) => {
            if (family.memberIds.includes(p.id)) {
              const next = new Date();
              next.setDate(next.getDate() + p.followUpFrequencyDays);
              return { ...p, lastContactDate: new Date().toISOString(), nextFollowUpDate: next.toISOString() };
            }
            return p;
          });
        }
      }
      return newData;
    });

    // Persist to Supabase
    const supabase = createClient();
    await supabase.from('notes').insert({
      id: note.id, person_id: note.personId ?? null, family_id: note.familyId ?? null,
      type: note.type, visibility: note.visibility,
      content: note.content ?? null, mentions: note.mentions ?? [],
      created_by: note.createdBy, created_at: note.createdAt,
    });

    // Update last_contact_date in DB
    if (note.personId) {
      const person = (await supabase.from('people').select('follow_up_frequency_days').eq('id', note.personId).single()).data;
      if (person) {
        const days = (person as { follow_up_frequency_days: number }).follow_up_frequency_days ?? 14;
        const next = new Date();
        next.setDate(next.getDate() + days);
        await supabase.from('people').update({
          last_contact_date: new Date().toISOString(),
          next_follow_up_date: next.toISOString(),
        }).eq('id', note.personId);
      }
    }
  }, [currentPersona.id]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Pick<Note, 'type' | 'content' | 'familyId' | 'personId' | 'visibility' | 'createdAt'>>) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => n.id === noteId ? { ...n, ...updates } : n),
    }));
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
    if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
    if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
    await supabase.from('notes').update(dbUpdates).eq('id', noteId);
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }));
    const supabase = createClient();
    await supabase.from('notes').delete().eq('id', noteId);
  }, []);

  // ── Todos ─────────────────────────────────────────────────────────────
  const addTodo = useCallback(async (todoData: Omit<Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>) => {
    const todo: Todo = {
      ...todoData, id: generateId(), completed: false,
      createdBy: currentPersona.id, createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, todos: [todo, ...prev.todos] }));
    const supabase = createClient();
    await supabase.from('todos').insert({
      id: todo.id, person_id: todo.personId ?? null, family_id: todo.familyId ?? null,
      title: todo.title,
      due_date: todo.dueDate ?? null, repeat: todo.repeat ?? null, alert: todo.alert ?? null,
      completed: false, created_by: todo.createdBy, created_at: todo.createdAt,
    });
  }, [currentPersona.id]);

  const updateTodo = useCallback(async (todoId: string, updates: Partial<Pick<Todo, 'title' | 'dueDate' | 'repeat' | 'alert' | 'familyId' | 'personId'>>) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => t.id === todoId ? { ...t, ...updates } : t),
    }));
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
    if (updates.alert !== undefined) dbUpdates.alert = updates.alert;
    if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
    if (updates.personId !== undefined) dbUpdates.person_id = updates.personId;
    await supabase.from('todos').update(dbUpdates).eq('id', todoId);
  }, []);

  const deleteTodo = useCallback(async (todoId: string) => {
    setData((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== todoId) }));
    const supabase = createClient();
    await supabase.from('todos').delete().eq('id', todoId);
  }, []);

  const toggleTodo = useCallback(async (todoId: string) => {
    let newCompleted = false;
    let completedAt: string | undefined;
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => {
        if (t.id === todoId) {
          newCompleted = !t.completed;
          completedAt = newCompleted ? new Date().toISOString() : undefined;
          return { ...t, completed: newCompleted, completedAt };
        }
        return t;
      }),
    }));
    const supabase = createClient();
    await supabase.from('todos').update({
      completed: newCompleted,
      completed_at: completedAt ?? null,
    }).eq('id', todoId);
  }, []);

  // ── People ────────────────────────────────────────────────────────────
  const addPerson = useCallback(async (personData: Omit<Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds' | 'followUpFrequencyDays'>) => {
    const person: Person = {
      ...personData, id: generateId(), assignedShepherdIds: [],
      groupIds: [], followUpFrequencyDays: 14, createdAt: new Date().toISOString(),
      createdBy: currentPersona.id,
    };
    setData((prev) => ({ ...prev, people: [...prev.people, person] }));
    const supabase = createClient();
    await supabase.from('people').insert({
      id: person.id, english_name: person.englishName, chinese_name: person.chineseName ?? null,
      photo: person.photo ?? null, gender: person.gender ?? null,
      marital_status: person.maritalStatus ?? null, birthday: person.birthday ?? null,
      baptism_date: person.baptismDate ?? null, membership_date: person.membershipDate ?? null,
      anniversary: person.anniversary ?? null, phone: person.phone ?? null,
      home_phone: person.homePhone ?? null, email: person.email ?? null,
      home_address: person.homeAddress ?? null, spiritual_needs: person.spiritualNeeds ?? null, physical_needs: person.physicalNeeds ?? null,
      is_shepherd: person.isShepherd ?? false, church_positions: person.churchPositions ?? [],
      membership_status: person.membershipStatus, language: person.language,
      family_id: person.familyId ?? null, follow_up_frequency_days: 14,
      created_at: person.createdAt,
      created_by: person.createdBy ?? null,
    });
  }, [currentPersona.id]);

  const updatePerson = useCallback(async (personId: string, updates: Partial<Pick<Person, 'englishName' | 'chineseName' | 'photo' | 'phone' | 'homePhone' | 'email' | 'homeAddress' | 'membershipStatus' | 'membershipDate' | 'language' | 'gender' | 'maritalStatus' | 'birthday' | 'baptismDate' | 'anniversary' | 'followUpFrequencyDays' | 'spiritualNeeds' | 'physicalNeeds' | 'isShepherd' | 'isBeingDiscipled' | 'churchPositions' | 'appRole'>>) => {
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) => p.id === personId ? { ...p, ...updates } : p),
    }));
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.englishName !== undefined) dbUpdates.english_name = updates.englishName;
    if (updates.chineseName !== undefined) dbUpdates.chinese_name = updates.chineseName;
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.homePhone !== undefined) dbUpdates.home_phone = updates.homePhone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.homeAddress !== undefined) dbUpdates.home_address = updates.homeAddress;
    if (updates.membershipStatus !== undefined) dbUpdates.membership_status = updates.membershipStatus;
    if (updates.membershipDate !== undefined) dbUpdates.membership_date = updates.membershipDate;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.maritalStatus !== undefined) dbUpdates.marital_status = updates.maritalStatus;
    if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
    if (updates.baptismDate !== undefined) dbUpdates.baptism_date = updates.baptismDate;
    if (updates.anniversary !== undefined) dbUpdates.anniversary = updates.anniversary;
    if (updates.followUpFrequencyDays !== undefined) dbUpdates.follow_up_frequency_days = updates.followUpFrequencyDays;
    if (updates.spiritualNeeds !== undefined) dbUpdates.spiritual_needs = updates.spiritualNeeds;
    if (updates.physicalNeeds !== undefined) dbUpdates.physical_needs = updates.physicalNeeds;
    if (updates.isShepherd !== undefined) dbUpdates.is_shepherd = updates.isShepherd;
    if (updates.isBeingDiscipled !== undefined) dbUpdates.is_being_discipled = updates.isBeingDiscipled;
    if (updates.churchPositions !== undefined) dbUpdates.church_positions = updates.churchPositions;
    if (updates.appRole !== undefined) dbUpdates.app_role = updates.appRole;
    await supabase.from('people').update(dbUpdates).eq('id', personId);
  }, []);

  const deletePerson = useCallback(async (personId: string) => {
    setData((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== personId),
      families: prev.families.map((f) => ({
        ...f,
        memberIds: f.memberIds.filter((id) => id !== personId),
      })),
      notes: prev.notes.filter((n) => n.personId !== personId),
      todos: prev.todos.filter((t) => t.personId !== personId),
    }));
    const supabase = createClient();
    await supabase.from('person_shepherds').delete().eq('person_id', personId);
    await supabase.from('family_members').delete().eq('person_id', personId);
    await supabase.from('notes').delete().eq('person_id', personId);
    await supabase.from('todos').delete().eq('person_id', personId);
    await supabase.from('people').delete().eq('id', personId);
  }, []);

  const assignShepherds = useCallback(async (personId: string, shepherdIds: string[]) => {
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) => p.id === personId ? { ...p, assignedShepherdIds: shepherdIds } : p),
    }));
    const supabase = createClient();
    await supabase.from('person_shepherds').delete().eq('person_id', personId);
    if (shepherdIds.length > 0) {
      await supabase.from('person_shepherds').insert(
        shepherdIds.map((sid) => ({ person_id: personId, shepherd_id: sid }))
      );
    }
  }, []);

  // ── Families ──────────────────────────────────────────────────────────
  const addFamily = useCallback(async (label: string, memberIds: string[]) => {
    const familyId = generateId();
    const family: Family = { id: familyId, label, tags: [], memberIds };
    setData((prev) => ({
      ...prev,
      families: [...prev.families, family],
      people: prev.people.map((p) => memberIds.includes(p.id) ? { ...p, familyId } : p),
    }));
    const supabase = createClient();
    await supabase.from('families').insert({ id: familyId, label, tags: [] });
    if (memberIds.length > 0) {
      await supabase.from('family_members').insert(memberIds.map((pid) => ({ family_id: familyId, person_id: pid })));
      for (const pid of memberIds) {
        await supabase.from('people').update({ family_id: familyId }).eq('id', pid);
      }
    }
  }, []);

  const updateFamily = useCallback(async (familyId: string, updates: Partial<Pick<Family, 'label' | 'photo' | 'primaryContactId' | 'childCount'>>) => {
    setData((prev) => ({
      ...prev,
      families: prev.families.map((f) => f.id === familyId ? { ...f, ...updates } : f),
    }));
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
    if (updates.primaryContactId !== undefined) dbUpdates.primary_contact_id = updates.primaryContactId;
    if (updates.childCount !== undefined) dbUpdates.child_count = updates.childCount;
    await supabase.from('families').update(dbUpdates).eq('id', familyId);
  }, []);

  const updateFamilyMembers = useCallback(async (familyId: string, newMemberIds: string[]) => {
    setData((prev) => {
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
        if (added.includes(p.id)) return { ...p, familyId: familyId };
        return p;
      });
      return { ...prev, families: newFamilies, people: newPeople };
    });

    const supabase = createClient();
    await supabase.from('family_members').delete().eq('family_id', familyId);
    if (newMemberIds.length > 0) {
      await supabase.from('family_members').insert(
        newMemberIds.map((pid) => ({ family_id: familyId, person_id: pid }))
      );
    }
    // Update family_id on people rows
    for (const pid of newMemberIds) {
      await supabase.from('people').update({ family_id: familyId }).eq('id', pid);
    }
  }, []);

  const addGroup = useCallback(async (name: string, description?: string) => {
    const group = { id: generateId(), name, description, leaderIds: [], memberIds: [], relatedFamilyIds: [] };
    setData((prev) => ({ ...prev, groups: [...prev.groups, group] }));
    const supabase = createClient();
    await supabase.from('groups').insert({ id: group.id, name, description: description ?? null });
  }, []);

  const updateGroup = useCallback(async (groupId: string, updates: Partial<Pick<import('./types').Group, 'name' | 'description' | 'leaderIds'>>) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => g.id === groupId ? { ...g, ...updates } : g),
    }));
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
    if (updates.leaderIds !== undefined) dbUpdates.leader_ids = updates.leaderIds;
    await supabase.from('groups').update(dbUpdates).eq('id', groupId);
  }, []);

  const updateGroupMembers = useCallback(async (groupId: string, memberIds: string[]) => {
    setData((prev) => {
      const newGroups = prev.groups.map((g) => g.id === groupId ? { ...g, memberIds } : g);
      const newPeople = prev.people.map((p) => {
        const inGroup = memberIds.includes(p.id);
        const hadGroup = p.groupIds.includes(groupId);
        if (inGroup && !hadGroup) return { ...p, groupIds: [...p.groupIds, groupId] };
        if (!inGroup && hadGroup) return { ...p, groupIds: p.groupIds.filter((id) => id !== groupId) };
        return p;
      });
      return { ...prev, groups: newGroups, people: newPeople };
    });
    const supabase = createClient();
    await supabase.from('group_members').delete().eq('group_id', groupId);
    for (const pid of memberIds) {
      await supabase.from('group_members').insert({ group_id: groupId, person_id: pid }).then(() => {});
    }
  }, []);

  const assignGroupsToPerson = useCallback(async (personId: string, groupIds: string[]) => {
    setData((prev) => {
      const newPeople = prev.people.map((p) =>
        p.id === personId ? { ...p, groupIds } : p
      );
      const newGroups = prev.groups.map((g) => {
        if (groupIds.includes(g.id)) {
          return g.memberIds.includes(personId) ? g : { ...g, memberIds: [...g.memberIds, personId] };
        } else {
          return { ...g, memberIds: g.memberIds.filter((id) => id !== personId) };
        }
      });
      return { ...prev, people: newPeople, groups: newGroups };
    });
    const supabase = createClient();
    await supabase.from('group_members').delete().eq('person_id', personId);
    for (const gid of groupIds) {
      await supabase.from('group_members').insert({ group_id: gid, person_id: personId }).then(() => {});
    }
  }, []);

  const assignGroupsToFamily = useCallback(async (familyId: string, groupIds: string[]) => {
    setData((prev) => {
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
    // Get current family members
    const { data: fmRows } = await supabase.from('family_members').select('person_id').eq('family_id', familyId);
    const memberIds = (fmRows ?? []).map((r: { person_id: string }) => r.person_id);
    // Remove from all groups, re-add to selected
    for (const mid of memberIds) {
      await supabase.from('group_members').delete().eq('person_id', mid);
    }
    for (const gid of groupIds) {
      for (const mid of memberIds) {
        await supabase.from('group_members').insert({ group_id: gid, person_id: mid }).then(() => {});
      }
    }
  }, []);

  const assignShepherdsToFamily = useCallback(async (familyId: string, shepherdIds: string[]) => {
    setData((prev) => {
      const family = prev.families.find((f) => f.id === familyId);
      if (!family) return prev;
      const memberIds = family.memberIds;
      const newPeople = prev.people.map((p) =>
        memberIds.includes(p.id) ? { ...p, assignedShepherdIds: shepherdIds } : p
      );
      return { ...prev, people: newPeople };
    });

    const supabase = createClient();
    const { data: fmRows } = await supabase.from('family_members').select('person_id').eq('family_id', familyId);
    const memberIds = (fmRows ?? []).map((r: { person_id: string }) => r.person_id);
    for (const pid of memberIds) {
      await supabase.from('person_shepherds').delete().eq('person_id', pid);
      if (shepherdIds.length > 0) {
        await supabase.from('person_shepherds').insert(
          shepherdIds.map((sid) => ({ person_id: pid, shepherd_id: sid }))
        );
      }
    }
  }, []);

  const setFollowUpFrequency = useCallback(async (personId: string, days: number) => {
    let nextFollowUpDate: string | undefined;
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) => {
        if (p.id === personId) {
          const nextDate = new Date();
          if (p.lastContactDate) {
            const last = new Date(p.lastContactDate);
            nextDate.setTime(last.getTime() + days * 24 * 60 * 60 * 1000);
          } else {
            nextDate.setDate(nextDate.getDate() + days);
          }
          nextFollowUpDate = nextDate.toISOString();
          return { ...p, followUpFrequencyDays: days, nextFollowUpDate };
        }
        return p;
      }),
    }));
    const supabase = createClient();
    await supabase.from('people').update({
      follow_up_frequency_days: days,
      next_follow_up_date: nextFollowUpDate ?? null,
    }).eq('id', personId);
  }, []);

  const canViewNote = useCallback((note: Note): boolean => {
    if (currentPersona.role === 'admin') return true;
    if (note.visibility === 'public') return true;
    if (note.createdBy === currentPersona.id) return true;
    if (currentPersona.role === 'shepherd' && note.personId) {
      return currentPersona.assignedPeopleIds.includes(note.personId);
    }
    return false;
  }, [currentPersona]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{ data, currentPersona, accessDenied, switchPersona, loginWithSupabaseUser, addNote, updateNote, deleteNote, addTodo, updateTodo, deleteTodo, toggleTodo, addPerson, deletePerson, addFamily, updatePerson, assignShepherds, updateFamily, updateFamilyMembers, addGroup, updateGroup, updateGroupMembers, assignGroupsToPerson, assignGroupsToFamily, assignShepherdsToFamily, setFollowUpFrequency, canViewNote }}
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
