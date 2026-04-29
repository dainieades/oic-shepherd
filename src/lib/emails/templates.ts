import type { NoticePrivacy, NoticeUrgency } from '@/lib/types';

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

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888">OIC Shepherd</p>
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111">${title}</h1>
          ${body}
          <hr style="margin:28px 0;border:none;border-top:1px solid #eee">
          <p style="margin:0;font-size:12px;color:#aaa">You received this because you have an active role in OIC Shepherd. Log in to view details.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;font-size:13px;color:#888;white-space:nowrap;padding-right:16px">${label}</td>
    <td style="padding:4px 0;font-size:13px;color:#111;font-weight:500">${value}</td>
  </tr>`;
}

export function personAddedEmail(personName: string, addedByName: string): EmailTemplate {
  return {
    subject: `New person added: ${personName}`,
    html: wrap('New person added', `
      <p style="margin:0 0 20px;font-size:15px;color:#333">A new person has been added to the directory.</p>
      <table cellpadding="0" cellspacing="0">
        ${row('Name', personName)}
        ${row('Added by', addedByName)}
      </table>
    `),
  };
}

export function noticeAddedEmail(
  aboutName: string,
  content: string,
  urgency: NoticeUrgency,
  privacy: NoticePrivacy,
  addedByName: string,
): EmailTemplate {
  return {
    subject: `New notice about ${aboutName}`,
    html: wrap(`New notice: ${aboutName}`, `
      <p style="margin:0 0 20px;font-size:15px;color:#333">${addedByName} added a notice about <strong>${aboutName}</strong>.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="margin:0;font-size:14px;color:#333;line-height:1.6">${content}</p>
      </div>
      <table cellpadding="0" cellspacing="0">
        ${row('Urgency', URGENCY_LABEL[urgency])}
        ${row('Visibility', PRIVACY_LABEL[privacy])}
      </table>
    `),
  };
}

export function shepherdAssignedEmail(personName: string, assignedByName: string): EmailTemplate {
  return {
    subject: `You have been assigned to shepherd ${personName}`,
    html: wrap(`New assignment: ${personName}`, `
      <p style="margin:0 0 20px;font-size:15px;color:#333">
        <strong>${assignedByName}</strong> has assigned <strong>${personName}</strong> to your care.
      </p>
      <p style="margin:0;font-size:14px;color:#555">Log in to view their profile and begin following up.</p>
    `),
  };
}

export function personUpdatedEmail(personName: string, updatedByName: string): EmailTemplate {
  return {
    subject: `Update: ${personName}'s profile has changed`,
    html: wrap(`Profile updated: ${personName}`, `
      <p style="margin:0 0 20px;font-size:15px;color:#333">
        <strong>${updatedByName}</strong> made changes to <strong>${personName}</strong>'s profile.
      </p>
      <p style="margin:0;font-size:14px;color:#555">Log in to review the updated information.</p>
    `),
  };
}
