'use client';

import React from 'react';
import { type Dispatch, type SetStateAction } from 'react';
import {
  type AppData,
  type Persona,
  type Person,
  type Family,
  type AuditLog,
  type ReferralSource,
  type Interest,
} from '../types';
import { type PersonRow, type FamilyRow, type GroupRow } from '../schemas';
import { mapAuditLog } from '../mappers';
import { generateId, fullName } from '../utils';
import { createClient } from '@/utils/supabase/client';
import { SAVE_ERROR_MSG } from '../constants';

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
] as const;

function serializeAuditValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.join(', ') || '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

interface PeopleHookDeps {
  setData: Dispatch<SetStateAction<AppData>>;
  currentPersona: Persona;
  setCurrentPersona: Dispatch<SetStateAction<Persona>>;
  currentUserEmail: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
  addTodo: (todo: Omit<import('../types').Todo, 'id' | 'createdAt' | 'createdBy' | 'completed'>) => Promise<void>;
}

export interface PeopleHookResult {
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds'>) => Promise<string>;
  updatePerson: (
    personId: string,
    updates: Partial<Pick<Person,
      | 'preferredName' | 'lastName' | 'alternativeName' | 'photo' | 'originalPhoto'
      | 'phone' | 'homePhone' | 'email' | 'homeAddress' | 'membershipStatus'
      | 'churchAttendance' | 'membershipDate' | 'language' | 'gender' | 'maritalStatus'
      | 'birthday' | 'baptized' | 'baptismDate' | 'anniversary' | 'isShepherd'
      | 'isBeingDiscipled' | 'churchPositions' | 'appRole' | 'canTriageVisitors'
    >>
  ) => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  promoteVisitorSubmission: (submissionId: string) => Promise<string>;
  discardVisitorSubmission: (submissionId: string) => Promise<void>;
  updateVisitorSubmission: (
    submissionId: string,
    patch: { referralSource?: ReferralSource | null; referralDetail?: string | null; interests?: Interest[]; prayerRequest?: string | null }
  ) => Promise<void>;
  fetchAuditLogs: (personId: string) => Promise<AuditLog[]>;
  assignShepherds: (personId: string, shepherdIds: string[]) => Promise<void>;
  addFamily: (label: string, memberIds: string[]) => Promise<string>;
  updateFamily: (
    familyId: string,
    updates: Partial<Pick<Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>>
  ) => Promise<void>;
  updateFamilyMembers: (familyId: string, memberIds: string[]) => Promise<void>;
  assignShepherdsToFamily: (familyId: string, shepherdIds: string[]) => Promise<void>;
  addGroup: (name: string, description?: string) => Promise<void>;
  updateGroup: (
    groupId: string,
    updates: Partial<Pick<import('../types').Group, 'name' | 'description' | 'leaderIds'>>
  ) => Promise<void>;
  updateGroupMembers: (groupId: string, memberIds: string[]) => Promise<void>;
  assignGroupsToPerson: (personId: string, groupIds: string[]) => Promise<void>;
  assignGroupsToFamily: (familyId: string, groupIds: string[]) => Promise<void>;
}

export function usePeopleHook({
  setData,
  currentPersona,
  setCurrentPersona,
  currentUserEmail,
  showToast,
  addTodo,
}: PeopleHookDeps): PeopleHookResult {
  const addPerson = React.useCallback(
    async (personData: Omit<Person, 'id' | 'createdAt' | 'assignedShepherdIds' | 'groupIds'>): Promise<string> => {
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
        life_stage: person.lifeStage ?? [],
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
    [currentPersona.id, currentPersona.name, currentPersona.userId, currentUserEmail, setData, showToast]
  );

  const promoteVisitorSubmission = React.useCallback(
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
        lifeStage: (r.life_stage as string[] | null) ?? [],
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

  const discardVisitorSubmission = React.useCallback(async (submissionId: string): Promise<void> => {
    const supabase = createClient();
    await supabase
      .from('visitor_submissions')
      .update({ status: 'discarded' })
      .eq('id', submissionId);
  }, []);

  const updateVisitorSubmission = React.useCallback(
    async (
      submissionId: string,
      patch: {
        referralSource?: ReferralSource | null;
        referralDetail?: string | null;
        interests?: Interest[];
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
        showToast(SAVE_ERROR_MSG, 'error');
        throw error;
      }
    },
    [showToast]
  );

  const updatePerson = React.useCallback(
    async (
      personId: string,
      updates: Partial<Pick<Person,
        | 'preferredName' | 'lastName' | 'alternativeName' | 'photo' | 'originalPhoto'
        | 'phone' | 'homePhone' | 'email' | 'homeAddress' | 'membershipStatus'
        | 'churchAttendance' | 'membershipDate' | 'language' | 'gender' | 'maritalStatus'
        | 'birthday' | 'baptized' | 'baptismDate' | 'anniversary' | 'isShepherd'
        | 'isBeingDiscipled' | 'churchPositions' | 'appRole' | 'canTriageVisitors'
      >>
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
      if (updates.alternativeName !== undefined) dbUpdates.alternative_name = updates.alternativeName;
      if ('photo' in updates) dbUpdates.photo = updates.photo ?? null;
      if ('originalPhoto' in updates) dbUpdates.original_photo = updates.originalPhoto ?? null;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.homePhone !== undefined) dbUpdates.home_phone = updates.homePhone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.homeAddress !== undefined) dbUpdates.home_address = updates.homeAddress;
      if (updates.membershipStatus !== undefined) dbUpdates.membership_status = updates.membershipStatus;
      if (updates.churchAttendance !== undefined) dbUpdates.church_attendance = updates.churchAttendance;
      if (updates.membershipDate !== undefined) dbUpdates.membership_date = updates.membershipDate;
      if (updates.language !== undefined) dbUpdates.language = JSON.stringify(updates.language);
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.maritalStatus !== undefined) dbUpdates.marital_status = updates.maritalStatus;
      if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
      if (updates.baptized !== undefined) dbUpdates.baptized = updates.baptized;
      if (updates.baptismDate !== undefined) dbUpdates.baptism_date = updates.baptismDate;
      if (updates.anniversary !== undefined) dbUpdates.anniversary = updates.anniversary;
      if (updates.isShepherd !== undefined) dbUpdates.is_shepherd = updates.isShepherd;
      if (updates.isBeingDiscipled !== undefined) dbUpdates.is_being_discipled = updates.isBeingDiscipled;
      if (updates.churchPositions !== undefined) dbUpdates.church_positions = updates.churchPositions;
      if (updates.appRole !== undefined) dbUpdates.app_role = updates.appRole;
      if (updates.canTriageVisitors !== undefined) dbUpdates.can_triage_visitors = updates.canTriageVisitors;
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
        console.error('updatePerson failed:', JSON.stringify(personUpdateError ?? auditError, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
        return;
      }
      if (auditRows.length > 0) {
        setData((prev) => ({
          ...prev,
          people: prev.people.map((p) =>
            p.id === personId ? { ...p, lastEditedAt: now, lastEditedByName: currentPersona.name } : p
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
    [currentPersona.id, currentPersona.name, currentPersona.userId, currentUserEmail, setData, setCurrentPersona, showToast]
  );

  const fetchAuditLogs = React.useCallback(async (personId: string): Promise<AuditLog[]> => {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });
    return (rows ?? []).map(mapAuditLog);
  }, []);

  const deletePerson = React.useCallback(
    async (personId: string): Promise<void> => {
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
    },
    [setData, showToast]
  );

  const assignShepherds = React.useCallback(
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
          if (current.length === shepherdIds.length && current.every((id) => shepherdIds.includes(id))) {
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
    [currentPersona.name, currentPersona.userId, currentUserEmail, setData, setCurrentPersona, showToast]
  );

  const addFamily = React.useCallback(
    async (label: string, memberIds: string[]): Promise<string> => {
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
    },
    [currentPersona.isTest, setData, showToast]
  );

  const updateFamily = React.useCallback(
    async (
      familyId: string,
      updates: Partial<Pick<Family, 'label' | 'photo' | 'originalPhoto' | 'primaryContactId' | 'childCount'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      const now = new Date().toISOString();
      setData((prev) => {
        snapshot = prev;
        return {
          ...prev,
          families: prev.families.map((f) =>
            f.id === familyId ? { ...f, ...updates, lastEditedAt: now } : f
          ),
        };
      });
      const supabase = createClient();
      const dbUpdates: Partial<FamilyRow> = {};
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if ('photo' in updates) dbUpdates.photo = updates.photo ?? null;
      if ('originalPhoto' in updates) dbUpdates.original_photo = updates.originalPhoto ?? null;
      if (updates.primaryContactId !== undefined) dbUpdates.primary_contact_id = updates.primaryContactId;
      if (updates.childCount !== undefined) dbUpdates.child_count = updates.childCount;
      dbUpdates.last_edited_at = new Date().toISOString();
      const { error } = await supabase.from('families').update(dbUpdates).eq('id', familyId);
      if (error) {
        console.error('families update failed:', JSON.stringify(error, null, 2));
        if (snapshot) setData(snapshot);
        showToast(SAVE_ERROR_MSG, 'error');
      }
    },
    [setData, showToast]
  );

  const updateFamilyMembers = React.useCallback(
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
    [setData, showToast]
  );

  const assignShepherdsToFamily = React.useCallback(
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
              .insert(personaShepherdIds.map((sid) => ({ persona_id: sid, person_id: pid })));
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
    [setData, setCurrentPersona, showToast]
  );

  const addGroup = React.useCallback(
    async (name: string, description?: string): Promise<void> => {
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
    },
    [currentPersona.isTest, setData, showToast]
  );

  const updateGroup = React.useCallback(
    async (
      groupId: string,
      updates: Partial<Pick<import('../types').Group, 'name' | 'description' | 'leaderIds'>>
    ): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        return { ...prev, groups: prev.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)) };
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
    [setData, showToast]
  );

  const updateGroupMembers = React.useCallback(
    async (groupId: string, memberIds: string[]): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        const newGroups = prev.groups.map((g) => (g.id === groupId ? { ...g, memberIds } : g));
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
    [setData, showToast]
  );

  const assignGroupsToPerson = React.useCallback(
    async (personId: string, groupIds: string[]): Promise<void> => {
      let snapshot: AppData | undefined;
      setData((prev) => {
        snapshot = prev;
        const newPeople = prev.people.map((p) => (p.id === personId ? { ...p, groupIds } : p));
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
    [setData, showToast]
  );

  const assignGroupsToFamily = React.useCallback(
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
    [setData, showToast]
  );

  return {
    addPerson,
    updatePerson,
    deletePerson,
    promoteVisitorSubmission,
    discardVisitorSubmission,
    updateVisitorSubmission,
    fetchAuditLogs,
    assignShepherds,
    addFamily,
    updateFamily,
    updateFamilyMembers,
    assignShepherdsToFamily,
    addGroup,
    updateGroup,
    updateGroupMembers,
    assignGroupsToPerson,
    assignGroupsToFamily,
  };
}
