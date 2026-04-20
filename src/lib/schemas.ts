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
  gender: z.enum(['male', 'female']).nullish(),
  marital_status: z.enum(['single', 'married', 'widowed', 'divorced']).nullish(),
  birthday: nullStr,
  baptism_date: nullStr,
  membership_date: nullStr,
  anniversary: nullStr,
  phone: nullStr,
  home_phone: nullStr,
  email: nullStr,
  home_address: nullStr,
  spiritual_needs: nullStr,
  physical_needs: nullStr,
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

export const NoticeRowSchema = z.object({
  id: z.string(),
  person_id: nullStr,
  family_id: nullStr,
  category: z.enum(['physical-need', 'spiritual-need', 'other']),
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

export const GroupRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: nullStr,
  leader_ids: nullStrArr,
  shepherd_ids: nullStrArr,
  related_family_ids: nullStrArr,
});

export type GroupRow = z.infer<typeof GroupRowSchema>;
