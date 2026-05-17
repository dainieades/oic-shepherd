import { z } from 'zod';

const nullStr = z.string().nullish();
const nullBool = z.boolean().nullish();
const nullNum = z.number().nullish();
const nullStrArr = z.array(z.string()).nullish();

export const PersonRowSchema = z.object({
  id: z.string(),
  preferred_name: z.string(),
  last_name: nullStr,
  alternative_name: nullStr,
  photo: nullStr,
  original_photo: nullStr,
  gender: z.enum(['male', 'female']).nullish().catch(null),
  marital_status: z.enum(['single', 'married', 'widowed', 'divorced']).nullish().catch(null),
  birthday: nullStr,
  baptized: nullBool,
  baptism_date: nullStr,
  membership_date: nullStr,
  anniversary: nullStr,
  phone: nullStr,
  home_phone: nullStr,
  email: nullStr,
  home_address: nullStr,
  is_shepherd: nullBool,
  is_being_discipled: nullBool,
  app_role: z.enum(['admin', 'shepherd', 'no-access']).nullish().catch(null),
  can_triage_visitors: nullBool,
  church_positions: nullStrArr,
  is_student: nullBool,
  membership_status: z.enum(['member', 'non-member', 'membership-track']),
  church_attendance: z
    .enum(['visitor', 'regular', 'on-leave', 'fellowship-group-only', 'archived'])
    .nullish(),
  language: nullStr,
  family_id: nullStr,
  last_contact_date: nullStr,
  created_at: z.string(),
  created_by: nullStr,
  last_edited_at: nullStr,
  last_edited_by_name: nullStr,
  is_test: nullBool,
});

export type PersonRow = z.infer<typeof PersonRowSchema>;

export const FamilyRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  photo: nullStr,
  original_photo: nullStr,
  tags: nullStrArr,
  child_count: nullNum,
  primary_contact_id: nullStr,
  created_at: nullStr,
  created_by: nullStr,
  is_test: nullBool,
});

export type FamilyRow = z.infer<typeof FamilyRowSchema>;

export const PersonaRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'shepherd']).catch('shepherd'),
  person_id: nullStr,
  user_id: nullStr,
  theme_preference: z.enum(['light', 'dark', 'system']).nullable().optional(),
  map_provider: z.enum(['apple', 'google', 'waze']).nullable().optional(),
  notify_person_added: z.boolean().nullable().optional(),
  notify_notice_added: z.boolean().nullable().optional(),
  notify_shepherd_assigned: z.boolean().nullable().optional(),
  notify_person_updated: z.boolean().nullable().optional(),
  notify_todo_created: z.boolean().nullable().optional(),
  calendar_sync_enabled: z.boolean().nullable().optional(),
  email: nullStr,
  calendar_feed_token: nullStr,
  calendar_connected_app: z.enum(['apple', 'google', 'other']).nullable().optional(),
  is_test: nullBool,
});

export type PersonaRow = z.infer<typeof PersonaRowSchema>;

export const NoteRowSchema = z.object({
  id: z.string(),
  person_id: nullStr,
  family_id: nullStr,
  todo_id: nullStr,
  type: z.enum(['check-in', 'prayer-request', 'event', 'general']),
  visibility: z.enum(['private', 'public']),
  content: nullStr,
  mentions: nullStrArr,
  created_by: z.string(),
  created_at: z.string(),
});

export type NoteRow = z.infer<typeof NoteRowSchema>;

const noticeCategoryEnum = z.enum([
  'physical-need',
  'spiritual-need',
  'social-need',
  'psychological-need',
  'other',
]);

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
  end_date: nullStr,
  repeat: z.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly']).nullish(),
  reminder: z
    .enum([
      'none',
      '30_min_before',
      '1_hour_before',
      '1_day_before',
      'same_day_9am',
      'day_before_9am',
      'day_before_5pm',
      '2_days_before_9am',
      '1_week_before_9am',
    ])
    .nullish(),
  reminder_due_at: nullStr,
  reminder_sent_at: nullStr,
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
  related_family_ids: nullStrArr,
  is_test: nullBool,
});

export type GroupRow = z.infer<typeof GroupRowSchema>;

export const VisitorSubmissionRowSchema = z.object({
  id: z.string(),
  submitted_at: z.string(),
  submitted_by: nullStr,
  source: z.enum(['app', 'qr']),
  status: z.enum(['pending', 'promoted', 'discarded']),
  person_id: nullStr,
  preferred_name: z.string(),
  last_name: nullStr,
  alternative_name: nullStr,
  phone: nullStr,
  email: nullStr,
  is_student: nullBool,
  languages: nullStrArr,
  referral_source: z.enum(['flyer', 'online', 'drive-by', 'school', 'friend', 'other']).nullish(),
  referral_detail: nullStr,
  interests: nullStrArr,
  prayer_request: nullStr,
});

export type VisitorSubmissionRow = z.infer<typeof VisitorSubmissionRowSchema>;
