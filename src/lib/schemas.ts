import { z } from 'zod';

const nullStr = z.string().nullish();
const nullBool = z.boolean().nullish();
const nullNum = z.number().nullish();
const nullStrArr = z.array(z.string()).nullish();

export const PersonRowSchema = z.object({
  id: z.string(),
  english_name: z.string(),
  chinese_name: nullStr,
  photo: nullStr,
  gender: z.enum(['male', 'female']).nullish().catch(null),
  marital_status: z.enum(['single', 'married', 'widowed', 'divorced']).nullish().catch(null),
  birthday: nullStr,
  baptism_date: nullStr,
  membership_date: nullStr,
  anniversary: nullStr,
  phone: nullStr,
  home_phone: nullStr,
  email: nullStr,
  home_address: nullStr,
  is_shepherd: nullBool,
  is_being_discipled: nullBool,
  app_role: z.enum(['admin', 'shepherd', 'welcome-team', 'no-access']).nullish(),
  church_positions: nullStrArr,
  membership_status: z.enum(['member', 'non-member', 'membership-track']),
  church_attendance: z
    .enum(['first-time-visitor', 'regular', 'on-leave', 'fellowship-group-only', 'archived'])
    .nullish(),
  language: nullStr,
  family_id: nullStr,
  follow_up_frequency_days: nullNum,
  last_contact_date: nullStr,
  next_follow_up_date: nullStr,
  is_first_time_visitor: nullBool,
  is_child: nullBool,
  created_at: z.string(),
  created_by: nullStr,
  last_edited_at: nullStr,
  last_edited_by_name: nullStr,
});

export type PersonRow = z.infer<typeof PersonRowSchema>;

export const FamilyRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  photo: nullStr,
  tags: nullStrArr,
  child_count: nullNum,
  primary_contact_id: nullStr,
  created_at: nullStr,
  created_by: nullStr,
});

export type FamilyRow = z.infer<typeof FamilyRowSchema>;

export const PersonaRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'shepherd', 'welcome-team']),
  person_id: nullStr,
  user_id: nullStr,
  theme_preference: z.enum(['light', 'dark', 'system']).nullable().optional(),
  map_provider: z.enum(['apple', 'google', 'waze']).nullable().optional(),
});

export type PersonaRow = z.infer<typeof PersonaRowSchema>;

export const NoteRowSchema = z.object({
  id: z.string(),
  person_id: nullStr,
  family_id: nullStr,
  type: z.enum(['check-in', 'prayer-request', 'event', 'general']),
  visibility: z.enum(['private', 'public']),
  content: nullStr,
  mentions: nullStrArr,
  created_by: z.string(),
  created_at: z.string(),
});

export type NoteRow = z.infer<typeof NoteRowSchema>;

const noticeCategoryEnum = z.enum(['physical-need', 'spiritual-need', 'social-need', 'psychological-need', 'other']);

export const NoticeRowSchema = z.object({
  id: z.string(),
  person_id: nullStr,
  family_id: nullStr,
  categories: z.array(noticeCategoryEnum).default([]),
  urgency: z.enum(['urgent', 'moderate', 'ongoing']),
  privacy: z.enum(['pastor-only', 'pastor-and-shepherds', 'everyone']).nullish(),
  content: z.string(),
  created_by: z.string(),
  created_at: z.string(),
});

export type NoticeRow = z.infer<typeof NoticeRowSchema>;

export const TodoRowSchema = z.object({
  id: z.string(),
  person_id: nullStr,
  family_id: nullStr,
  title: z.string(),
  due_date: nullStr,
  repeat: z.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly']).nullish(),
  completed: z.boolean().nullish(),
  completed_at: nullStr,
  created_by: z.string(),
  created_at: z.string(),
});

export type TodoRow = z.infer<typeof TodoRowSchema>;

export const AuditLogRowSchema = z.object({
  id: z.string(),
  person_id: z.string(),
  changed_by_persona_id: z.string(),
  changed_by_name: z.string(),
  field_name: z.string(),
  old_value: nullStr,
  new_value: nullStr,
  created_at: z.string(),
});

export type AuditLogRow = z.infer<typeof AuditLogRowSchema>;

export const GroupRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: nullStr,
  leader_ids: nullStrArr,
  shepherd_ids: nullStrArr,
  related_family_ids: nullStrArr,
});

export type GroupRow = z.infer<typeof GroupRowSchema>;
