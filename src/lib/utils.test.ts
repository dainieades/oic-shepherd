import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatPhone,
  normalizePhone,
  fmtDate,
  fmtDateTime,
  truncateWhoLabel,
  getTimeAgo,
  getDaysAgoNumber,
  getDueLabel,
  getPriorityScore,
  getFamilyPriorityScore,
  getFamilyUrgency,
  getFamilyLastContact,
  searchPeople,
  categorizeTodos,
  generateId,
  getMapUrl,
  buildGoogleCalendarUrl,
  buildIcsContent,
  getMembershipLabel,
  getChurchAttendanceLabel,
  getNoteTypeLabel,
} from './utils';
import type { Person, Todo } from './types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'p1',
    englishName: 'Alice Smith',
    membershipStatus: 'member',
    churchAttendance: 'regular',
    language: ['english'],
    assignedShepherdIds: ['s1'],
    groupIds: ['g1'],
    followUpFrequencyDays: 14,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 't1',
    title: 'Follow up',
    completed: false,
    createdBy: 'p1',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// Pin "today" to a known date for all time-sensitive tests
const FIXED_NOW = new Date('2025-06-15T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// formatPhone
// ---------------------------------------------------------------------------

describe('formatPhone', () => {
  it('returns empty string for blank input', () => {
    expect(formatPhone('')).toBe('');
  });
  it('formats partial — 3 digits', () => {
    expect(formatPhone('555')).toBe('(555');
  });
  it('formats partial — 6 digits', () => {
    expect(formatPhone('555123')).toBe('(555) 123');
  });
  it('formats full 10-digit number', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567');
  });
  it('strips non-digit characters before formatting', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567');
  });
  it('handles more than 10 digits', () => {
    expect(formatPhone('15551234567')).toBe('(155) 512-3456 7');
  });
});

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------

describe('normalizePhone', () => {
  it('strips formatting characters', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567');
  });
  it('passes through plain digits unchanged', () => {
    expect(normalizePhone('5551234567')).toBe('5551234567');
  });
  it('returns empty string for empty input', () => {
    expect(normalizePhone('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// fmtDate
// ---------------------------------------------------------------------------

describe('fmtDate', () => {
  it('formats an ISO date string', () => {
    expect(fmtDate('2025-06-15')).toBe('Jun 15, 2025');
  });
  it('returns empty string for blank input', () => {
    expect(fmtDate('')).toBe('');
  });
  it('formats January correctly (month index 0)', () => {
    expect(fmtDate('2025-01-01')).toBe('Jan 1, 2025');
  });
});

// ---------------------------------------------------------------------------
// fmtDateTime
// ---------------------------------------------------------------------------

describe('fmtDateTime', () => {
  it('returns date only when includeTime is false', () => {
    expect(fmtDateTime('2025-06-15', '14:30', false)).toBe('Jun 15, 2025');
  });
  it('formats PM time correctly', () => {
    expect(fmtDateTime('2025-06-15', '14:30', true)).toBe('Jun 15, 2025, 2:30 PM');
  });
  it('formats AM time correctly', () => {
    expect(fmtDateTime('2025-06-15', '09:05', true)).toBe('Jun 15, 2025, 9:05 AM');
  });
  it('formats midnight as 12 AM', () => {
    expect(fmtDateTime('2025-06-15', '00:00', true)).toBe('Jun 15, 2025, 12:00 AM');
  });
  it('formats noon as 12 PM', () => {
    expect(fmtDateTime('2025-06-15', '12:00', true)).toBe('Jun 15, 2025, 12:00 PM');
  });
});

// ---------------------------------------------------------------------------
// truncateWhoLabel
// ---------------------------------------------------------------------------

describe('truncateWhoLabel', () => {
  it('returns null for empty array', () => {
    expect(truncateWhoLabel([])).toBeNull();
  });
  it('returns single name as-is', () => {
    expect(truncateWhoLabel(['Alice'])).toBe('Alice');
  });
  it('joins multiple short names', () => {
    expect(truncateWhoLabel(['Alice', 'Bob'])).toBe('Alice, Bob');
  });
  it('appends overflow count when names exceed limit', () => {
    const names = Array.from({ length: 20 }, (_, i) => `Person${i}`);
    const result = truncateWhoLabel(names);
    expect(result).toMatch(/\+\d+$/);
  });
});

// ---------------------------------------------------------------------------
// getTimeAgo — pinned to 2025-06-15
// ---------------------------------------------------------------------------

describe('getTimeAgo', () => {
  it('returns "Today" for today', () => {
    expect(getTimeAgo('2025-06-15')).toBe('Today');
  });
  it('returns "Yesterday" for yesterday', () => {
    expect(getTimeAgo('2025-06-14')).toBe('Yesterday');
  });
  it('returns days ago for within a week', () => {
    expect(getTimeAgo('2025-06-10')).toBe('5 days ago');
  });
  it('returns "1 week ago" for exactly 7 days', () => {
    expect(getTimeAgo('2025-06-08')).toBe('1 week ago');
  });
  it('returns weeks ago for within a month', () => {
    expect(getTimeAgo('2025-05-25')).toBe('3 weeks ago');
  });
  it('returns "1 month ago" for about a month', () => {
    expect(getTimeAgo('2025-05-15')).toBe('1 month ago');
  });
  it('returns months ago for older dates', () => {
    expect(getTimeAgo('2025-01-15')).toBe('5 months ago');
  });
});

// ---------------------------------------------------------------------------
// getDaysAgoNumber
// ---------------------------------------------------------------------------

describe('getDaysAgoNumber', () => {
  it('returns Infinity for undefined', () => {
    expect(getDaysAgoNumber(undefined)).toBe(Infinity);
  });
  it('returns 0 for today', () => {
    expect(getDaysAgoNumber('2025-06-15')).toBe(0);
  });
  it('returns positive number for past dates', () => {
    expect(getDaysAgoNumber('2025-06-10')).toBe(5);
  });
  it('returns negative number for future dates', () => {
    expect(getDaysAgoNumber('2025-06-20')).toBe(-5);
  });
});

// ---------------------------------------------------------------------------
// getDueLabel
// ---------------------------------------------------------------------------

describe('getDueLabel', () => {
  it('returns none status when no date provided', () => {
    expect(getDueLabel(undefined)).toEqual({ label: 'No follow-up set', status: 'none' });
  });
  it('returns overdue for past date', () => {
    const result = getDueLabel('2025-06-10');
    expect(result.status).toBe('overdue');
    expect(result.label).toMatch(/Overdue by 5 days/);
  });
  it('returns due-soon for today', () => {
    const result = getDueLabel('2025-06-15');
    expect(result).toEqual({ label: 'Due today', status: 'due-soon' });
  });
  it('returns due-soon for within 7 days', () => {
    const result = getDueLabel('2025-06-20');
    expect(result.status).toBe('due-soon');
    expect(result.label).toMatch(/Due in 5 days/);
  });
  it('returns ok for more than 7 days out', () => {
    const result = getDueLabel('2025-07-01');
    expect(result.status).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// getPriorityScore
// ---------------------------------------------------------------------------

describe('getPriorityScore', () => {
  it('scores higher when overdue', () => {
    const overdue = makePerson({ nextFollowUpDate: '2025-06-01', lastContactDate: '2025-06-01' });
    const ok = makePerson({ nextFollowUpDate: '2025-07-01', lastContactDate: '2025-06-14' });
    expect(getPriorityScore(overdue)).toBeGreaterThan(getPriorityScore(ok));
  });
  it('adds score when no shepherd assigned', () => {
    const unassigned = makePerson({ assignedShepherdIds: [] });
    const assigned = makePerson({ assignedShepherdIds: ['s1'] });
    expect(getPriorityScore(unassigned)).toBeGreaterThan(getPriorityScore(assigned));
  });
  it('adds score when not in any group', () => {
    const noGroup = makePerson({ groupIds: [] });
    const inGroup = makePerson({ groupIds: ['g1'] });
    expect(getPriorityScore(noGroup)).toBeGreaterThan(getPriorityScore(inGroup));
  });
  it('adds score when never contacted', () => {
    const neverContacted = makePerson({ lastContactDate: undefined });
    const recentlyContacted = makePerson({ lastContactDate: '2025-06-14' });
    expect(getPriorityScore(neverContacted)).toBeGreaterThan(getPriorityScore(recentlyContacted));
  });
  it('caps contact-days contribution at 50', () => {
    // Person contacted 200 days ago should cap at same as 51+ days ago
    const longAgo = makePerson({ lastContactDate: '2024-01-01' });
    const fiftyOneDaysAgo = makePerson({ lastContactDate: '2025-04-25' });
    // Both should score the same for the contact component
    const baseScore = getPriorityScore(
      makePerson({ lastContactDate: undefined, assignedShepherdIds: [], groupIds: [] })
    );
    expect(baseScore).toBeGreaterThan(0);
    // The two distant-contact people should have the same score (both capped)
    const scoreLong = getPriorityScore(longAgo);
    const scoreFiftyOne = getPriorityScore(fiftyOneDaysAgo);
    expect(scoreLong).toBe(scoreFiftyOne);
  });
});

// ---------------------------------------------------------------------------
// getFamilyPriorityScore
// ---------------------------------------------------------------------------

describe('getFamilyPriorityScore', () => {
  it('returns 0 for empty family', () => {
    expect(getFamilyPriorityScore([])).toBe(0);
  });
  it('returns the max score across members', () => {
    const high = makePerson({ id: 'p1', assignedShepherdIds: [], groupIds: [] });
    const low = makePerson({ id: 'p2', lastContactDate: '2025-06-14' });
    expect(getFamilyPriorityScore([high, low])).toBe(getPriorityScore(high));
  });
});

// ---------------------------------------------------------------------------
// getFamilyUrgency
// ---------------------------------------------------------------------------

describe('getFamilyUrgency', () => {
  it('returns none for empty members', () => {
    expect(getFamilyUrgency([])).toEqual({ label: '', status: 'none' });
  });
  it('returns most urgent status across members', () => {
    const overdueMember = makePerson({ nextFollowUpDate: '2025-06-01' });
    const okMember = makePerson({ nextFollowUpDate: '2025-07-01' });
    expect(getFamilyUrgency([overdueMember, okMember]).status).toBe('overdue');
  });
  it('returns ok when all members are on track', () => {
    const ok1 = makePerson({ nextFollowUpDate: '2025-07-01' });
    const ok2 = makePerson({ nextFollowUpDate: '2025-07-10' });
    expect(getFamilyUrgency([ok1, ok2]).status).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// getFamilyLastContact
// ---------------------------------------------------------------------------

describe('getFamilyLastContact', () => {
  it('returns undefined when no members have contact dates', () => {
    expect(getFamilyLastContact([makePerson()])).toBeUndefined();
  });
  it('returns the most recent contact date', () => {
    const earlier = makePerson({ id: 'p1', lastContactDate: '2025-06-01' });
    const later = makePerson({ id: 'p2', lastContactDate: '2025-06-14' });
    expect(getFamilyLastContact([earlier, later])).toBe('2025-06-14');
  });
});

// ---------------------------------------------------------------------------
// searchPeople
// ---------------------------------------------------------------------------

describe('searchPeople', () => {
  const people = [
    makePerson({ id: 'p1', englishName: 'Alice Smith' }),
    makePerson({ id: 'p2', englishName: 'Bob Jones' }),
    makePerson({ id: 'p3', englishName: 'Charlie Brown', chineseName: '布朗' }),
  ];

  it('returns all people for empty query', () => {
    expect(searchPeople('', people)).toHaveLength(3);
  });
  it('matches English name case-insensitively', () => {
    expect(searchPeople('alice', people)).toHaveLength(1);
    expect(searchPeople('alice', people)[0].id).toBe('p1');
  });
  it('matches partial English name', () => {
    expect(searchPeople('jo', people)).toHaveLength(1);
    expect(searchPeople('jo', people)[0].id).toBe('p2');
  });
  it('matches Chinese name', () => {
    expect(searchPeople('布朗', people)).toHaveLength(1);
    expect(searchPeople('布朗', people)[0].id).toBe('p3');
  });
  it('returns empty array when no match', () => {
    expect(searchPeople('xyz', people)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// categorizeTodos
// ---------------------------------------------------------------------------

describe('categorizeTodos', () => {
  // FIXED_NOW = 2025-06-15

  it('puts completed todos in completed bucket', () => {
    const todo = makeTodo({ completed: true, completedAt: '2025-06-14T00:00:00Z' });
    const result = categorizeTodos([todo]);
    expect(result.completed).toHaveLength(1);
    expect(result.overdue.length + result.today.length + result.upcoming.length).toBe(0);
  });

  it('puts past due todos in overdue bucket', () => {
    const todo = makeTodo({ dueDate: '2025-06-10' });
    const result = categorizeTodos([todo]);
    expect(result.overdue).toHaveLength(1);
  });

  it('puts today todos in today bucket', () => {
    const todo = makeTodo({ dueDate: '2025-06-15' });
    const result = categorizeTodos([todo]);
    expect(result.today).toHaveLength(1);
  });

  it('puts future todos in upcoming bucket', () => {
    const todo = makeTodo({ dueDate: '2025-06-20' });
    const result = categorizeTodos([todo]);
    expect(result.upcoming).toHaveLength(1);
  });

  it('puts todos without due date in noDueDate bucket', () => {
    const todo = makeTodo({ dueDate: undefined });
    const result = categorizeTodos([todo]);
    expect(result.noDueDate).toHaveLength(1);
  });

  it('sorts overdue oldest-first', () => {
    const earlier = makeTodo({ id: 't1', dueDate: '2025-06-01' });
    const later = makeTodo({ id: 't2', dueDate: '2025-06-10' });
    const result = categorizeTodos([later, earlier]);
    expect(result.overdue[0].id).toBe('t1');
  });

  it('sorts upcoming soonest-first', () => {
    const sooner = makeTodo({ id: 't1', dueDate: '2025-06-20' });
    const later = makeTodo({ id: 't2', dueDate: '2025-07-01' });
    const result = categorizeTodos([later, sooner]);
    expect(result.upcoming[0].id).toBe('t1');
  });
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId()).toBeTruthy();
  });
  it('generates unique IDs', () => {
    // Advance clock between calls so Date.now() differs
    const id1 = generateId();
    vi.advanceTimersByTime(1);
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// getMapUrl
// ---------------------------------------------------------------------------

describe('getMapUrl', () => {
  it('defaults to Apple Maps', () => {
    const url = getMapUrl('123 Main St');
    expect(url).toContain('maps.apple.com');
  });
  it('builds Google Maps URL', () => {
    const url = getMapUrl('123 Main St', 'google');
    expect(url).toContain('google.com/maps');
  });

  it('encodes the address', () => {
    const url = getMapUrl('123 Main St, City', 'apple');
    expect(url).toContain(encodeURIComponent('123 Main St, City'));
  });
});

// ---------------------------------------------------------------------------
// buildGoogleCalendarUrl
// ---------------------------------------------------------------------------

describe('buildGoogleCalendarUrl', () => {
  it('includes title and dates in the URL', () => {
    const start = new Date('2025-06-15T10:00:00Z');
    const end = new Date('2025-06-15T11:00:00Z');
    const url = buildGoogleCalendarUrl('Test Event', start, end);
    expect(url).toContain('calendar.google.com');
    // URLSearchParams encodes spaces as +
    expect(url).toContain('text=Test+Event');
  });
  it('uses date-only format for all-day events', () => {
    const start = new Date('2025-06-15T00:00:00Z');
    const end = new Date('2025-06-15T00:00:00Z');
    const url = buildGoogleCalendarUrl('Birthday', start, end, true);
    // URLSearchParams encodes / as %2F; all-day dates are YYYYMMDD (no T)
    expect(decodeURIComponent(url)).toMatch(/\d{8}\/\d{8}/);
  });
});

// ---------------------------------------------------------------------------
// buildIcsContent
// ---------------------------------------------------------------------------

describe('buildIcsContent', () => {
  it('contains required iCalendar fields', () => {
    const start = new Date('2025-06-15T10:00:00Z');
    const end = new Date('2025-06-15T11:00:00Z');
    const ics = buildIcsContent('My Event', 'uid-123', start, end);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:My Event');
    expect(ics).toContain('UID:uid-123@oic-shepherd');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
  it('uses DATE format for all-day events', () => {
    const start = new Date('2025-06-15T00:00:00Z');
    const end = new Date('2025-06-15T00:00:00Z');
    const ics = buildIcsContent('All Day', 'uid-456', start, end, true);
    expect(ics).toContain('DTSTART;VALUE=DATE:');
    expect(ics).toContain('DTEND;VALUE=DATE:');
  });
});

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

describe('getMembershipLabel', () => {
  it('returns human-readable labels', () => {
    expect(getMembershipLabel('member')).toBe('Member');
    expect(getMembershipLabel('non-member')).toBe('Non-Member');
    expect(getMembershipLabel('membership-track')).toBe('Membership Track');
  });
});

describe('getChurchAttendanceLabel', () => {
  it('returns human-readable labels', () => {
    expect(getChurchAttendanceLabel('regular')).toBe('Regular Attendee');
    expect(getChurchAttendanceLabel('first-time-visitor')).toBe('First-Time Visitor');
    expect(getChurchAttendanceLabel('on-leave')).toBe('On Leave');
    expect(getChurchAttendanceLabel('fellowship-group-only')).toBe('Fellowship Group Only');
    expect(getChurchAttendanceLabel('archived')).toBe('Archived');
  });
});

describe('getNoteTypeLabel', () => {
  it('returns human-readable labels', () => {
    expect(getNoteTypeLabel('prayer-request')).toBe('Prayer Request');
    expect(getNoteTypeLabel('check-in')).toBe('Follow-up');
    expect(getNoteTypeLabel('event')).toBe('Event');
    expect(getNoteTypeLabel('general')).toBe('General');
  });
});
