import React from 'react';
import { type AppData, type Persona, type Person, type Family, type Note, type Todo, type Notice } from './types';
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
} from './schemas';
import { createClient } from '@/utils/supabase/client';
import { DEFAULT_FOLLOW_UP_DAYS } from '@/lib/constants';

// ── DB row → AppData mappers ──────────────────────────────────────────────

export function mapPerson(
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

export function mapFamily(row: Record<string, unknown>, memberIds: string[]): Family {
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

export function mapPersona(row: Record<string, unknown>, assignedPeopleIds: string[]): Persona {
  const r = PersonaRowSchema.parse(row);
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    personId: r.person_id ?? undefined,
    userId: r.user_id ?? undefined,
    assignedPeopleIds,
    themePreference: r.theme_preference ?? undefined,
    mapProvider: r.map_provider ?? undefined,
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
export async function syncGoogleAvatar(
  supabase: ReturnType<typeof createClient>,
  personId: string,
  avatarUrl: string,
  setData: React.Dispatch<React.SetStateAction<AppData>>
): Promise<void> {
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

export function mapNote(row: Record<string, unknown>): Note {
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

export function mapNotice(row: Record<string, unknown>): Notice {
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

export function mapTodo(row: Record<string, unknown>): Todo {
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
