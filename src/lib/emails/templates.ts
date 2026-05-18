import { isToday, isTomorrow, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { NoticePrivacy, NoticeUrgency, TodoReminder } from '@/lib/types';

export interface ProfileChange {
  field: string;
  oldValue: string;
  newValue: string;
}

const FIELD_LABELS: Record<string, string> = {
  englishName: 'English name',
  chineseName: 'Chinese name',
  photo: 'Photo',
  phone: 'Mobile phone',
  homePhone: 'Home phone',
  email: 'Email',
  homeAddress: 'Home address',
  membershipStatus: 'Membership status',
  churchAttendance: 'Church attendance',
  membershipDate: 'Membership date',
  language: 'Language',
  gender: 'Gender',
  maritalStatus: 'Marital status',
  birthday: 'Birthday',
  baptismDate: 'Baptism date',
  anniversary: 'Anniversary',
  isShepherd: 'Shepherd',
  isBeingDiscipled: 'Being discipled',
  churchPositions: 'Church positions',
  appRole: 'App role',
};

interface EmailTemplate {
  subject: string;
  html: string;
}

const URGENCY_LABEL: Record<NoticeUrgency, string> = {
  urgent: '🔴 Urgent',
  moderate: '🟡 Moderate',
  ongoing: '🔵 Ongoing',
};

const PRIVACY_LABEL: Record<NoticePrivacy, string> = {
  'pastor-only': 'Pastor only',
  'pastor-and-shepherds': 'Pastors & shepherds',
  everyone: 'Everyone',
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oic-shepherd.vercel.app';

// Email clients (Gmail, Outlook) strip inline <svg>. Use a hosted PNG instead.
const LOGO = `<img src="${APP_URL}/OIC_logo@2x.png" width="76" height="41" alt="OIC Shepherd" style="display:block;margin:0 auto;border:0" />`;

interface WrapCta {
  label: string;
  href: string;
}

const DEFAULT_CTA: WrapCta = { label: 'Log in to OIC Shepherd', href: `${APP_URL}/signin` };

function wrap(
  title: string,
  body: string,
  footer = 'You received this because you have an active role in OIC Shepherd.',
  cta: WrapCta = DEFAULT_CTA
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf8fc;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <tr><td>
          <div style="margin-bottom:24px;text-align:center">${LOGO}</div>
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#1f2533">${title}</h1>
          ${body}
          <div style="margin:28px 0 0;text-align:center">
            <a href="${cta.href}" style="display:inline-block;padding:12px 28px;background:#705a8c;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">${cta.label}</a>
          </div>
          <hr style="margin:28px 0;border:none;border-top:1px solid #ded7e5">
          <p style="margin:0;font-size:12px;color:#5c6470">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;font-size:13px;color:#5c6470;white-space:nowrap;padding-right:16px">${label}</td>
    <td style="padding:4px 0;font-size:13px;color:#1f2533;font-weight:500">${value}</td>
  </tr>`;
}

export function personAddedEmail(personName: string, addedByName: string): EmailTemplate {
  return {
    subject: `New person added: ${personName}`,
    html: wrap(
      'New person added',
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">A new person has been added to the directory.</p>
      <table cellpadding="0" cellspacing="0">
        ${row('Name', personName)}
        ${row('Added by', addedByName)}
      </table>
    `
    ),
  };
}

export function noticeAddedEmail(
  aboutName: string,
  content: string,
  urgency: NoticeUrgency,
  privacy: NoticePrivacy,
  addedByName: string
): EmailTemplate {
  return {
    subject: `New notice about ${aboutName}`,
    html: wrap(
      `New notice: ${aboutName}`,
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">${addedByName} added a notice about <strong>${aboutName}</strong>.</p>
      <div style="background:#f2f0f5;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="margin:0;font-size:14px;color:#1f2533;line-height:1.6">${content}</p>
      </div>
      <table cellpadding="0" cellspacing="0">
        ${row('Urgency', URGENCY_LABEL[urgency])}
        ${row('Visibility', PRIVACY_LABEL[privacy])}
      </table>
    `
    ),
  };
}

export function shepherdAssignedEmail(personName: string, assignedByName: string): EmailTemplate {
  return {
    subject: `You have been assigned to shepherd ${personName}`,
    html: wrap(
      `New assignment: ${personName}`,
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">
        <strong>${assignedByName}</strong> has assigned <strong>${personName}</strong> to your care.
      </p>
      <p style="margin:0;font-size:14px;color:#4c5567">Log in to view their profile and begin following up.</p>
    `
    ),
  };
}

function changesTable(changes: ProfileChange[]): string {
  if (changes.length === 0) return '';
  const rows = changes
    .map(({ field, oldValue, newValue }) => {
      const label = FIELD_LABELS[field] ?? field;
      const oldCell = oldValue
        ? `<span style="color:#5c6470;text-decoration:line-through">${oldValue}</span>`
        : `<span style="color:#8b92a1">—</span>`;
      const newCell = newValue
        ? `<span style="color:#1f2533;font-weight:500">${newValue}</span>`
        : `<span style="color:#8b92a1">—</span>`;
      return `<tr>
      <td style="padding:6px 12px 6px 0;font-size:13px;color:#4c5567;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 12px 6px 0;font-size:13px;vertical-align:top">${oldCell}</td>
      <td style="padding:6px 0;font-size:13px;vertical-align:top">${newCell}</td>
    </tr>`;
    })
    .join('');
  return `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-collapse:collapse">
      <thead>
        <tr>
          <th style="padding:0 12px 8px 0;font-size:11px;font-weight:600;color:#5c6470;text-align:left;text-transform:uppercase;letter-spacing:.05em">Field</th>
          <th style="padding:0 12px 8px 0;font-size:11px;font-weight:600;color:#5c6470;text-align:left;text-transform:uppercase;letter-spacing:.05em">Before</th>
          <th style="padding:0 0 8px;font-size:11px;font-weight:600;color:#5c6470;text-align:left;text-transform:uppercase;letter-spacing:.05em">After</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function personUpdatedEmail(
  personName: string,
  updatedByName: string,
  changes: ProfileChange[] = []
): EmailTemplate {
  return {
    subject: `Update: ${personName}'s profile has changed`,
    html: wrap(
      `Profile updated: ${personName}`,
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">
        <strong>${updatedByName}</strong> made changes to <strong>${personName}</strong>'s profile.
      </p>
      ${changesTable(changes)}
      <p style="margin:0;font-size:14px;color:#4c5567">Log in to review the updated information.</p>
    `
    ),
  };
}

export function inviteEmail(invitedByName: string): EmailTemplate {
  return {
    subject: `You've been invited to OIC Shepherd`,
    html: wrap(
      `You're invited`,
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">
        <strong>${invitedByName}</strong> has approved your access to OIC Shepherd, a care and shepherding tool for our church community.
      </p>
      <p style="margin:0;font-size:14px;color:#4c5567">
        To get started, click the button below and sign in with Google, or use your email address to create a password.
      </p>
      `,
      'You received this because you were invited to join OIC Shepherd.'
    ),
  };
}

const REMINDER_LABELS: Record<TodoReminder, string> = {
  none: 'None',
  '30_min_before': '30 minutes before',
  '1_hour_before': '1 hour before',
  '1_day_before': '24 hours before',
  same_day_9am: 'Same day at 9 AM',
  day_before_9am: 'Day before at 9 AM',
  day_before_5pm: 'Day before at 5 PM',
  '2_days_before_9am': '2 days before at 9 AM',
  '1_week_before_9am': '1 week before at 9 AM',
};

function naturalDuePhrase(dueDateIso: string): string {
  const date = parseISO(dueDateIso);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  const days = differenceInCalendarDays(date, new Date());
  if (days > 1 && days < 7) return format(date, 'EEEE');
  return format(date, 'MMM d');
}

export function todoCreatedEmail(
  title: string,
  dueDate: string,
  reminder: TodoReminder
): EmailTemplate {
  const reminderLabel = REMINDER_LABELS[reminder] ?? reminder;
  const duePhrase = naturalDuePhrase(dueDate);
  const fullDate = format(parseISO(dueDate), 'EEEE, d MMM yyyy');
  return {
    subject: `Due ${duePhrase}: ${title}`,
    html: wrap(
      `Due ${duePhrase}`,
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">You have a task coming up.</p>
      <table cellpadding="0" cellspacing="0">
        ${row('Task', title)}
        ${row('Due', `${duePhrase} <span style="color:#5c6470;font-weight:400">(${fullDate})</span>`)}
        ${row('Remind me', reminderLabel)}
      </table>
    `,
      'You received this because you created a to-do with a reminder in OIC Shepherd.'
    ),
  };
}

export function signupConfirmationEmail(confirmationUrl: string): EmailTemplate {
  return {
    subject: 'Confirm your email for OIC Shepherd',
    html: wrap(
      'Confirm your email',
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">
        Welcome to OIC Shepherd — a care and shepherding tool for our church community.
      </p>
      <p style="margin:0 0 20px;font-size:14px;color:#4c5567">
        Click the button below to confirm your email address and finish setting up your account.
      </p>
      <p style="margin:0;font-size:13px;color:#5c6470">
        If you weren't expecting this email, you can safely ignore it.
      </p>
      `,
      'You received this because you were invited to OIC Shepherd and are setting up your account.',
      { label: 'Confirm your email', href: confirmationUrl }
    ),
  };
}

export function resetPasswordEmail(resetUrl: string): EmailTemplate {
  return {
    subject: 'Reset your OIC Shepherd password',
    html: wrap(
      'Reset your password',
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">
        We received a request to reset the password for your OIC Shepherd account.
      </p>
      <p style="margin:0 0 20px;font-size:14px;color:#4c5567">
        Click the button below to choose a new password. The link will expire shortly for your security.
      </p>
      <p style="margin:0;font-size:13px;color:#5c6470">
        If you didn't request a password reset, you can safely ignore this email — your password won't change.
      </p>
      `,
      'You received this because a password reset was requested for this email address on OIC Shepherd.',
      { label: 'Reset your password', href: resetUrl }
    ),
  };
}

export function ownProfileUpdatedEmail(
  updatedByName: string,
  changes: ProfileChange[] = []
): EmailTemplate {
  return {
    subject: 'Your profile was updated',
    html: wrap(
      'Your profile was updated',
      `
      <p style="margin:0 0 20px;font-size:15px;color:#1f2533">
        <strong>${updatedByName}</strong> made changes to your profile in OIC Shepherd.
      </p>
      ${changesTable(changes)}
      <p style="margin:0;font-size:14px;color:#4c5567">Log in to review the changes.</p>
    `
    ),
  };
}

/** All email templates with sample data — used by /email-preview. Add new templates here. */
export const EMAIL_PREVIEW_REGISTRY: { label: string; subject: string; html: string }[] = [
  { label: 'New person added', ...personAddedEmail('John Tan', 'Long Wei') },
  {
    label: 'Notice created',
    ...noticeAddedEmail(
      'Mary Chen',
      "Mary has been struggling with anxiety and hasn't been attending Sunday service for the past 3 weeks.",
      'urgent',
      'pastor-and-shepherds',
      'Long Wei'
    ),
  },
  { label: 'Shepherd assigned', ...shepherdAssignedEmail('David Lim', 'Long Wei') },
  {
    label: 'Person profile updated',
    ...personUpdatedEmail('Sarah Wong', 'Long Wei', [
      { field: 'phone', oldValue: '9123 4567', newValue: '9876 5432' },
      { field: 'membershipStatus', oldValue: 'attendee', newValue: 'member' },
      { field: 'homeAddress', oldValue: '', newValue: '123 Orchard Road, #04-01' },
    ]),
  },
  { label: 'Invite to app', ...inviteEmail('Long Wei') },
  {
    label: 'Signup confirmation (Supabase auth)',
    ...signupConfirmationEmail('{{ .ConfirmationURL }}'),
  },
  {
    label: 'Password reset (Supabase auth)',
    ...resetPasswordEmail('{{ .ConfirmationURL }}'),
  },
  {
    label: 'To-do reminder set',
    ...todoCreatedEmail('Call David about his job situation', '2026-04-30', 'day_before_9am'),
  },
];
