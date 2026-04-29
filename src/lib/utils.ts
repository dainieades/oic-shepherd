import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  isToday,
  isYesterday,
  parseISO,
  compareDesc,
  compareAsc,
  format,
  addDays,
  isBefore,
  startOfDay,
  startOfToday,
} from 'date-fns';

/** Format a YYYY-MM-DD ISO string to "MMM d, yyyy" */
export function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'MMM d, yyyy');
}

/** Format a YYYY-MM-DD date + HH:mm time to a display string */
export function fmtDateTime(dateStr: string, timeStr: string, includeTime: boolean): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const datePart = format(new Date(y, mo - 1, d), 'MMM d, yyyy');
  if (!includeTime) return datePart;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${datePart}, ${h12}:${mStr} ${ampm}`;
}

/** Truncate a list of names to fit in ~3 lines of 0.875rem text (~72 chars) */
export function truncateWhoLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  // ~24 chars/line at 0.875rem in the available field width (~11.25rem); 3 lines ≈ 72 chars
  const MAX_CHARS = 72;
  let running = 0;
  const shown: string[] = [];
  for (const name of names) {
    const cost = shown.length === 0 ? name.length : 2 + name.length;
    if (running + cost > MAX_CHARS && shown.length > 0) break;
    shown.push(name);
    running += cost;
  }
  const hidden = names.length - shown.length;
  return shown.join(', ') + (hidden > 0 ? ` +${hidden}` : '');
}
import { type Person, type Note, type Todo, type Family, type ChurchAttendance, type Notice, type TodoRepeat, type TodoReminder } from './types';

export function getTimeAgo(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const days = differenceInCalendarDays(new Date(), date);
  if (days < 7) return `${days} days ago`;
  const weeks = differenceInCalendarWeeks(new Date(), date);
  if (weeks === 1) return '1 week ago';
  if (days < 30) return `${weeks} weeks ago`;
  const months = differenceInCalendarMonths(new Date(), date);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

export function getDaysAgoNumber(dateStr?: string): number {
  if (!dateStr) return Infinity;
  return differenceInCalendarDays(new Date(), parseISO(dateStr));
}

export function getDueLabel(dateStr?: string): {
  label: string;
  status: 'overdue' | 'due-soon' | 'ok' | 'none';
} {
  if (!dateStr) return { label: 'No follow-up set', status: 'none' };

  const diffDays = differenceInCalendarDays(parseISO(dateStr), startOfToday());

  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} days`, status: 'overdue' };
  if (diffDays === 0) return { label: 'Due today', status: 'due-soon' };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, status: 'due-soon' };
  return { label: `Due in ${diffDays} days`, status: 'ok' };
}

export function getPriorityScore(person: Person): number {
  let score = 0;
  const due = getDueLabel(person.nextFollowUpDate);

  if (due.status === 'overdue') score += 100;
  if (due.status === 'due-soon') score += 50;
  if (person.groupIds.length === 0) score += 30;
  if (person.assignedShepherdIds.length === 0) score += 40;

  if (person.lastContactDate) {
    const daysSince = differenceInCalendarDays(new Date(), parseISO(person.lastContactDate));
    score += Math.min(daysSince, 50);
  } else {
    score += 60;
  }

  return score;
}

/** Get the most urgent due status across a set of people */
export function getFamilyUrgency(members: Person[]): {
  label: string;
  status: 'overdue' | 'due-soon' | 'ok' | 'none';
} {
  type DueResult = { label: string; status: 'overdue' | 'due-soon' | 'ok' | 'none' };
  const rank: Record<DueResult['status'], number> = { overdue: 3, 'due-soon': 2, ok: 1, none: 0 };
  return members.reduce<DueResult>(
    (worst, p) => {
      const due = getDueLabel(p.nextFollowUpDate);
      return rank[due.status] > rank[worst.status] ? due : worst;
    },
    { label: '', status: 'none' }
  );
}

/** Get the most recent contact date across family members */
export function getFamilyLastContact(members: Person[]): string | undefined {
  return members
    .filter((m) => m.lastContactDate)
    .sort((a, b) => compareDesc(parseISO(a.lastContactDate!), parseISO(b.lastContactDate!)))[0]
    ?.lastContactDate;
}

export function getFamilyPriorityScore(members: Person[]): number {
  return Math.max(0, ...members.map((m) => getPriorityScore(m)));
}

export function getPersonNotes(personId: string, notes: Note[]): Note[] {
  return notes
    .filter((n) => n.personId === personId)
    .sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));
}

export function getFamilyNotes(familyId: string, people: Person[], notes: Note[]): Note[] {
  const family_member_ids = people.filter((p) => p.familyId === familyId).map((p) => p.id);
  return notes
    .filter(
      (n) => n.familyId === familyId || (n.personId && family_member_ids.includes(n.personId))
    )
    .sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));
}

export function getFamilyNotices(familyId: string, people: Person[], notices: Notice[]): Notice[] {
  const family_member_ids = people.filter((p) => p.familyId === familyId).map((p) => p.id);
  return notices.filter(
    (n) => n.familyId === familyId || (n.personId && family_member_ids.includes(n.personId))
  );
}

export function getFamilyTodos(familyId: string, people: Person[], todos: Todo[]): Todo[] {
  const family_member_ids = people.filter((p) => p.familyId === familyId).map((p) => p.id);
  return todos
    .filter(
      (t) => t.familyId === familyId || (t.personId && family_member_ids.includes(t.personId))
    )
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.dueDate && b.dueDate) return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return compareDesc(parseISO(a.createdAt), parseISO(b.createdAt));
    });
}

export function searchPeople(query: string, people: Person[]): Person[] {
  const q = query.toLowerCase().trim();
  if (!q) return people;
  return people.filter(
    (p) =>
      p.englishName.toLowerCase().includes(q) ||
      (p.chineseName && p.chineseName.includes(query.trim()))
  );
}

export function searchFamiliesAndPeople(
  query: string,
  families: Family[],
  people: Person[]
): { families: Family[]; individuals: Person[]; familyMembers: Person[] } {
  const q = query.toLowerCase().trim();
  if (!q) {
    const individualsWithoutFamily = people.filter((p) => !p.familyId);
    return { families, individuals: individualsWithoutFamily, familyMembers: [] };
  }

  const matchedPeople = searchPeople(query, people);
  const matchedFamilyIds = new Set<string>();
  const matchedIndividuals: Person[] = [];
  const matchedFamilyMembers: Person[] = [];

  for (const p of matchedPeople) {
    if (p.familyId) {
      matchedFamilyIds.add(p.familyId);
      matchedFamilyMembers.push(p);
    } else {
      matchedIndividuals.push(p);
    }
  }

  // Also match family labels
  for (const f of families) {
    if (f.label.toLowerCase().includes(q)) {
      matchedFamilyIds.add(f.id);
    }
  }

  return {
    families: families.filter((f) => matchedFamilyIds.has(f.id)),
    individuals: matchedIndividuals,
    familyMembers: matchedFamilyMembers,
  };
}

export function getMembershipLabel(status: Person['membershipStatus']): string {
  const labels: Record<string, string> = {
    member: 'Member',
    'non-member': 'Non-Member',
    'membership-track': 'Membership Track',
  };
  return labels[status] || status;
}

export function getChurchAttendanceLabel(status: ChurchAttendance): string {
  const labels: Record<ChurchAttendance, string> = {
    'first-time-visitor': 'First-Time Visitor',
    regular: 'Regular Attendee',
    'on-leave': 'On Leave',
    'fellowship-group-only': 'Fellowship Group Only',
    archived: 'Archived',
  };
  return labels[status] || status;
}

export function getNoteTypeLabel(type: Note['type']): string {
  const labels: Record<string, string> = {
    'prayer-request': 'Prayer Request',
    'check-in': 'Follow-up',
    event: 'Event',
    general: 'General',
  };
  return labels[type] || type;
}

export type MapProvider = 'apple' | 'google';

export const MAP_PROVIDER_LABELS: Record<MapProvider, string> = {
  apple: 'Apple Maps',
  google: 'Google Maps',
};

export const MAP_PROVIDERS_STORAGE_KEY = 'shepherd-app-map-provider';

export function getMapUrl(address: string, provider: MapProvider = 'google'): string {
  const q = encodeURIComponent(address);
  if (provider === 'apple') return `https://maps.apple.com/?q=${q}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/** Format a phone number string as (XXX) XXX-XXXX while typing.
 *  Handles US 10-digit numbers; passes through other formats unchanged. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  // More than 10 digits — keep as-is but formatted for first 10 + remainder
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)} ${digits.slice(10)}`;
}

/** Strip a formatted phone back to digits for comparison/storage consistency. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Group notes by month for display */
export function groupByMonth<T extends { createdAt: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const groups: Map<string, T[]> = new Map();
  for (const item of items) {
    const key = format(parseISO(item.createdAt), 'yyyy-MM');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, items]) => ({
      label: format(parseISO(items[0].createdAt), 'MMMM yyyy'),
      items,
    }));
}

/** Format a Date to iCalendar date-time string (YYYYMMDDTHHMMSSZ) */
function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

/** Format a Date to iCalendar date-only string (YYYYMMDD) */
function toIcsDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function repeatToRrule(repeat: TodoRepeat): string | null {
  switch (repeat) {
    case 'daily': return 'RRULE:FREQ=DAILY';
    case 'weekly': return 'RRULE:FREQ=WEEKLY';
    case 'biweekly': return 'RRULE:FREQ=WEEKLY;INTERVAL=2';
    case 'monthly': return 'RRULE:FREQ=MONTHLY';
    case 'yearly': return 'RRULE:FREQ=YEARLY';
    default: return null;
  }
}

// Returns iCal TRIGGER duration string for a reminder.
// For timed events (allDay=false), triggers are relative to event start.
// For all-day events, triggers target a specific clock time on a relative day
// by computing hours offset from event's midnight DTSTART.
function reminderToTrigger(reminder: TodoReminder, allDay: boolean): string | null {
  if (reminder === 'none') return null;
  if (!allDay) {
    switch (reminder) {
      case 'at_start': return 'TRIGGER:PT0S';
      case '5_min_before': return 'TRIGGER:-PT5M';
      case '10_min_before': return 'TRIGGER:-PT10M';
      case '15_min_before': return 'TRIGGER:-PT15M';
      case '30_min_before': return 'TRIGGER:-PT30M';
      case '1_hour_before': return 'TRIGGER:-PT1H';
      case '1_day_before': return 'TRIGGER:-P1D';
      default: return null;
    }
  }
  // All-day: DTSTART is midnight; compute offset to reach the target time
  switch (reminder) {
    case 'same_day_9am': return 'TRIGGER:PT9H';       // +9h from midnight
    case 'day_before_9am': return 'TRIGGER:-PT15H';   // -15h from midnight
    case 'day_before_5pm': return 'TRIGGER:-PT7H';    // -7h from midnight
    case '2_days_before_9am': return 'TRIGGER:-PT39H'; // -39h from midnight
    case '1_week_before_9am': return 'TRIGGER:-P6DT15H'; // 6d+15h before midnight
    default: return null;
  }
}

/** Returns a Google Calendar "Add event" URL (no OAuth required).
 *  Repeat (RRULE) is included. Reminders are not supported by the GCal URL API. */
export function buildGoogleCalendarUrl(
  title: string,
  start: Date,
  end: Date,
  allDay = false,
  repeat?: TodoRepeat
): string {
  const startStr = allDay ? toIcsDateOnly(start) : toIcsDate(start);
  const endStr = allDay ? toIcsDateOnly(addDays(start, 1)) : toIcsDate(end);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
  });
  if (repeat && repeat !== 'none') {
    const rrule = repeatToRrule(repeat);
    if (rrule) params.set('recur', rrule);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Returns a .ics (iCalendar) file string for download.
 *  Includes RRULE if repeat is set, and VALARM if reminder is set. */
export function buildIcsContent(
  title: string,
  uid: string,
  start: Date,
  end: Date,
  allDay = false,
  repeat?: TodoRepeat,
  reminder?: TodoReminder
): string {
  const dtStart = allDay
    ? `DTSTART;VALUE=DATE:${toIcsDateOnly(start)}`
    : `DTSTART:${toIcsDate(start)}`;
  const dtEnd = allDay
    ? `DTEND;VALUE=DATE:${toIcsDateOnly(addDays(start, 1))}`
    : `DTEND:${toIcsDate(end)}`;

  const rrule = repeat && repeat !== 'none' ? repeatToRrule(repeat) : null;

  const valarm: string[] = [];
  if (reminder && reminder !== 'none') {
    const trigger = reminderToTrigger(reminder, allDay);
    if (trigger) {
      valarm.push('BEGIN:VALARM', trigger, 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM');
    }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OIC Shepherd//EN',
    'BEGIN:VEVENT',
    dtStart,
    dtEnd,
    `SUMMARY:${title}`,
    `UID:${uid}@oic-shepherd`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    ...(rrule ? [rrule] : []),
    ...valarm,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

/** Categorize todos into overdue / today / upcoming / no due date / completed */
export function categorizeTodos(todos: Todo[]): {
  overdue: Todo[];
  today: Todo[];
  upcoming: Todo[];
  noDueDate: Todo[];
  completed: Todo[];
} {
  const overdue: Todo[] = [];
  const today: Todo[] = [];
  const upcoming: Todo[] = [];
  const noDueDate: Todo[] = [];
  const completed: Todo[] = [];

  const todayStart = startOfToday();

  for (const t of todos) {
    if (t.completed) {
      completed.push(t);
      continue;
    }
    if (!t.dueDate) {
      noDueDate.push(t);
    } else {
      const dueDay = startOfDay(parseISO(t.dueDate));
      if (isBefore(dueDay, todayStart)) {
        overdue.push(t);
      } else if (isToday(dueDay)) {
        today.push(t);
      } else {
        upcoming.push(t);
      }
    }
  }

  overdue.sort((a, b) => compareAsc(parseISO(a.dueDate!), parseISO(b.dueDate!)));
  upcoming.sort((a, b) => compareAsc(parseISO(a.dueDate!), parseISO(b.dueDate!)));
  completed.sort((a, b) =>
    compareDesc(parseISO(a.completedAt ?? a.createdAt), parseISO(b.completedAt ?? b.createdAt))
  );

  return { overdue, today, upcoming, noDueDate, completed };
}
