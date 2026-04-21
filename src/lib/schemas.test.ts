import { describe, it, expect } from 'vitest';
import {
  PersonRowSchema,
  FamilyRowSchema,
  PersonaRowSchema,
  NoteRowSchema,
  NoticeRowSchema,
  TodoRowSchema,
  GroupRowSchema,
} from './schemas';

// ---------------------------------------------------------------------------
// PersonRowSchema
// ---------------------------------------------------------------------------

const minimalPerson = {
  id: 'p1',
  english_name: 'John Doe',
  membership_status: 'member' as const,
  created_at: '2024-01-01T00:00:00Z',
};

describe('PersonRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => PersonRowSchema.parse(minimalPerson)).not.toThrow();
  });

  it('accepts a fully-populated valid row', () => {
    const full = {
      ...minimalPerson,
      chinese_name: '约翰',
      photo: 'https://example.com/photo.jpg',
      gender: 'male',
      marital_status: 'married',
      birthday: '1990-06-15',
      baptism_date: '2010-04-01',
      membership_date: '2011-01-01',
      anniversary: '2015-08-20',
      phone: '6261234567',
      home_phone: '6269876543',
      email: 'john@example.com',
      home_address: '123 Main St',
      spiritual_needs: 'Prayer for work',
      physical_needs: null,
      is_shepherd: true,
      is_being_discipled: false,
      app_role: 'shepherd',
      church_positions: ['elder'],
      church_attendance: 'regular',
      language: 'English',
      family_id: 'f1',
      follow_up_frequency_days: 14,
      last_contact_date: '2024-03-01',
      next_follow_up_date: '2024-03-15',
      is_first_time_visitor: false,
      is_child: false,
      created_by: 'user1',
    };
    expect(() => PersonRowSchema.parse(full)).not.toThrow();
  });

  it('rejects a row missing id', () => {
    const { id: _id, ...rest } = minimalPerson;
    expect(() => PersonRowSchema.parse(rest)).toThrow();
  });

  it('rejects a row missing english_name', () => {
    const { english_name: _n, ...rest } = minimalPerson;
    expect(() => PersonRowSchema.parse(rest)).toThrow();
  });

  it('rejects a row missing membership_status', () => {
    const { membership_status: _ms, ...rest } = minimalPerson;
    expect(() => PersonRowSchema.parse(rest)).toThrow();
  });

  it('rejects an invalid membership_status value', () => {
    expect(() => PersonRowSchema.parse({ ...minimalPerson, membership_status: 'visitor' })).toThrow();
  });

  it('rejects an invalid gender value', () => {
    expect(() => PersonRowSchema.parse({ ...minimalPerson, gender: 'other' })).toThrow();
  });

  it('rejects an invalid app_role value', () => {
    expect(() => PersonRowSchema.parse({ ...minimalPerson, app_role: 'superadmin' })).toThrow();
  });

  it('rejects an invalid church_attendance value', () => {
    expect(() => PersonRowSchema.parse({ ...minimalPerson, church_attendance: 'occasional' })).toThrow();
  });

  it('allows nullish optional fields', () => {
    const result = PersonRowSchema.parse({ ...minimalPerson, phone: null, email: undefined });
    expect(result.phone).toBeNull();
    expect(result.email).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// FamilyRowSchema
// ---------------------------------------------------------------------------

const minimalFamily = { id: 'f1', label: 'The Doe Family' };

describe('FamilyRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => FamilyRowSchema.parse(minimalFamily)).not.toThrow();
  });

  it('accepts a fully-populated valid row', () => {
    const full = {
      ...minimalFamily,
      photo: 'https://example.com/family.jpg',
      tags: ['needs-follow-up'],
      child_count: 2,
      primary_contact_id: 'p1',
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'user1',
    };
    expect(() => FamilyRowSchema.parse(full)).not.toThrow();
  });

  it('rejects a row missing id', () => {
    const { id: _id, ...rest } = minimalFamily;
    expect(() => FamilyRowSchema.parse(rest)).toThrow();
  });

  it('rejects a row missing label', () => {
    const { label: _l, ...rest } = minimalFamily;
    expect(() => FamilyRowSchema.parse(rest)).toThrow();
  });

  it('rejects tags that is not an array of strings', () => {
    expect(() => FamilyRowSchema.parse({ ...minimalFamily, tags: [1, 2] })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// PersonaRowSchema
// ---------------------------------------------------------------------------

const minimalPersona = { id: 'pa1', name: 'Elder John', role: 'shepherd' as const };

describe('PersonaRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => PersonaRowSchema.parse(minimalPersona)).not.toThrow();
  });

  it('accepts all valid role values', () => {
    for (const role of ['admin', 'shepherd', 'welcome-team'] as const) {
      expect(() => PersonaRowSchema.parse({ ...minimalPersona, role })).not.toThrow();
    }
  });

  it('rejects an invalid role value', () => {
    expect(() => PersonaRowSchema.parse({ ...minimalPersona, role: 'viewer' })).toThrow();
  });

  it('rejects a row missing name', () => {
    const { name: _n, ...rest } = minimalPersona;
    expect(() => PersonaRowSchema.parse(rest)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// NoteRowSchema
// ---------------------------------------------------------------------------

const minimalNote = {
  id: 'n1',
  type: 'check-in' as const,
  visibility: 'public' as const,
  created_by: 'user1',
  created_at: '2024-01-01T00:00:00Z',
};

describe('NoteRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => NoteRowSchema.parse(minimalNote)).not.toThrow();
  });

  it('accepts all valid type values', () => {
    for (const type of ['check-in', 'prayer-request', 'event', 'general'] as const) {
      expect(() => NoteRowSchema.parse({ ...minimalNote, type })).not.toThrow();
    }
  });

  it('accepts all valid visibility values', () => {
    for (const visibility of ['private', 'public'] as const) {
      expect(() => NoteRowSchema.parse({ ...minimalNote, visibility })).not.toThrow();
    }
  });

  it('rejects an invalid type value', () => {
    expect(() => NoteRowSchema.parse({ ...minimalNote, type: 'announcement' })).toThrow();
  });

  it('rejects an invalid visibility value', () => {
    expect(() => NoteRowSchema.parse({ ...minimalNote, visibility: 'restricted' })).toThrow();
  });

  it('rejects a row missing created_by', () => {
    const { created_by: _cb, ...rest } = minimalNote;
    expect(() => NoteRowSchema.parse(rest)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// NoticeRowSchema
// ---------------------------------------------------------------------------

const minimalNotice = {
  id: 'no1',
  urgency: 'urgent' as const,
  content: 'Needs prayer',
  created_by: 'user1',
  created_at: '2024-01-01T00:00:00Z',
};

describe('NoticeRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => NoticeRowSchema.parse(minimalNotice)).not.toThrow();
  });

  it('defaults categories to empty array when omitted', () => {
    const result = NoticeRowSchema.parse(minimalNotice);
    expect(result.categories).toEqual([]);
  });

  it('accepts all valid urgency values', () => {
    for (const urgency of ['urgent', 'moderate', 'ongoing'] as const) {
      expect(() => NoticeRowSchema.parse({ ...minimalNotice, urgency })).not.toThrow();
    }
  });

  it('accepts all valid category values', () => {
    const categories = ['physical-need', 'spiritual-need', 'social-need', 'psychological-need', 'other'] as const;
    expect(() => NoticeRowSchema.parse({ ...minimalNotice, categories: [...categories] })).not.toThrow();
  });

  it('accepts all valid privacy values', () => {
    for (const privacy of ['pastor-only', 'pastor-and-shepherds', 'everyone'] as const) {
      expect(() => NoticeRowSchema.parse({ ...minimalNotice, privacy })).not.toThrow();
    }
  });

  it('rejects an invalid urgency value', () => {
    expect(() => NoticeRowSchema.parse({ ...minimalNotice, urgency: 'low' })).toThrow();
  });

  it('rejects an invalid category value', () => {
    expect(() => NoticeRowSchema.parse({ ...minimalNotice, categories: ['financial-need'] })).toThrow();
  });

  it('rejects a row missing content', () => {
    const { content: _c, ...rest } = minimalNotice;
    expect(() => NoticeRowSchema.parse(rest)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// TodoRowSchema
// ---------------------------------------------------------------------------

const minimalTodo = {
  id: 't1',
  title: 'Call John',
  created_by: 'user1',
  created_at: '2024-01-01T00:00:00Z',
};

describe('TodoRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => TodoRowSchema.parse(minimalTodo)).not.toThrow();
  });

  it('accepts all valid repeat values', () => {
    for (const repeat of ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'] as const) {
      expect(() => TodoRowSchema.parse({ ...minimalTodo, repeat })).not.toThrow();
    }
  });

  it('rejects an invalid repeat value', () => {
    expect(() => TodoRowSchema.parse({ ...minimalTodo, repeat: 'quarterly' })).toThrow();
  });

  it('rejects a row missing title', () => {
    const { title: _t, ...rest } = minimalTodo;
    expect(() => TodoRowSchema.parse(rest)).toThrow();
  });

  it('accepts boolean completed values', () => {
    expect(() => TodoRowSchema.parse({ ...minimalTodo, completed: true })).not.toThrow();
    expect(() => TodoRowSchema.parse({ ...minimalTodo, completed: false })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// GroupRowSchema
// ---------------------------------------------------------------------------

const minimalGroup = { id: 'g1', name: 'Young Adults' };

describe('GroupRowSchema', () => {
  it('accepts a minimal valid row', () => {
    expect(() => GroupRowSchema.parse(minimalGroup)).not.toThrow();
  });

  it('accepts a fully-populated valid row', () => {
    const full = {
      ...minimalGroup,
      description: 'Ages 18-30',
      leader_ids: ['p1', 'p2'],
      shepherd_ids: ['p3'],
      related_family_ids: ['f1'],
    };
    expect(() => GroupRowSchema.parse(full)).not.toThrow();
  });

  it('rejects a row missing name', () => {
    const { name: _n, ...rest } = minimalGroup;
    expect(() => GroupRowSchema.parse(rest)).toThrow();
  });

  it('rejects leader_ids that is not an array of strings', () => {
    expect(() => GroupRowSchema.parse({ ...minimalGroup, leader_ids: [1, 2] })).toThrow();
  });
});
