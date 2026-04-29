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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oic-shepherd.vercel.app';

const LOGO = `<svg width="76" height="41" viewBox="0 0 114 61" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#oic-logo)"><path d="M56.0985 5.64532C58.0241 7.18568 59.9725 8.72206 61.9099 10.2446H61.9109C61.9386 8.2862 61.9623 6.30801 61.9672 4.34469C61.9593 4.33833 61.0268 3.64699 59.9117 2.82017C58.2476 1.58636 56.1767 0.0508834 56.1637 0.0396136L56.1094 0V0.0673528C56.1121 0.0749345 56.1083 1.20166 56.1042 2.44037C56.0992 3.95553 56.0936 5.63824 56.0985 5.64532Z" fill="#705a8c"/><path fill-rule="evenodd" clip-rule="evenodd" d="M56.0376 30.4569L54.0886 30.4562C52.3296 53.7688 24.2977 64.9634 7.46073 47.8807C2.45119 42.7069 -0.310813 35.442 0.0278889 28.2583C0.028805 27.6734 0.0679333 27.04 0.104386 26.4513V26.4496L0.1128 26.3128C0.324136 23.7135 0.896885 21.1459 1.85178 18.7131C6.37053 6.8677 19.2444 -0.260523 31.669 2.11588C42.9127 4.05635 51.7854 13.3689 53.7566 24.4359C54.4919 24.4359 55.2426 24.436 56.0022 24.4363C55.9583 16.9707 55.9241 11.1724 55.9238 11.147L55.984 11.1946C55.9887 11.204 56.766 11.8251 57.7477 12.6096L57.7503 12.6117L57.7526 12.6135L57.7532 12.614L57.7556 12.6159L57.7561 12.6163L57.7566 12.6167L57.7568 12.6168L57.7607 12.62C59.4538 13.9729 61.7452 15.804 61.7371 15.8265C61.7371 15.8561 61.7605 19.3768 61.7943 24.4407C62.4791 24.4414 63.1576 24.4422 63.8251 24.4429L65.1556 24.4444C65.1679 24.3619 65.1805 24.2797 65.1933 24.1979C65.5804 21.9364 66.246 19.6918 67.2098 17.6115C67.7884 16.3198 68.5251 15.0242 69.3112 13.8473L69.4287 13.6661L69.5541 13.4907C69.9658 12.9073 70.4043 12.3238 70.8556 11.7721C71.22 11.3402 71.6061 10.8865 71.9971 10.4794C72.4484 9.99399 73.0488 9.41647 73.5337 8.96774C73.6821 8.832 73.8995 8.64799 74.1063 8.47299L74.1065 8.47288C74.2588 8.34398 74.4054 8.21997 74.5142 8.12378C74.6099 8.05112 74.8024 7.90059 74.9991 7.74685L74.9998 7.74623L75.0083 7.73963C75.1167 7.65484 75.226 7.56943 75.3205 7.49591C75.4095 7.4267 75.4854 7.36803 75.5353 7.33033C77.9665 5.54629 80.7009 4.17135 83.5903 3.31351C95.136 -0.0901342 107.049 4.69934 113.69 14.6309L113.73 14.6883H113.66C113.644 14.6883 109.538 14.721 109.523 14.721C108.08 13.0529 106.224 11.7929 104.259 10.8211C99.8246 8.68246 94.8269 7.64532 89.9102 7.84641C88.2798 7.93457 86.6268 8.22185 85.0685 8.70524C78.0425 10.8974 73.1308 16.9578 71.7759 24.1296C71.7559 24.2365 71.7367 24.3436 71.7182 24.4509C74.1988 24.452 75.7875 24.4498 75.795 24.4396H75.8849L75.8434 24.5189L72.7061 30.4633L71.479 30.4629C71.8323 34.3744 73.1783 38.1927 75.5146 41.3588C78.9244 46.067 84.4148 49.0308 90.2222 49.2012C95.1449 49.3716 100.911 47.7401 105.072 45.1091C106.791 44.0046 108.386 42.6188 109.442 40.8476L109.646 40.492L109.662 40.4643H109.692L113.911 40.4573H114C112.911 42.493 111.555 44.382 109.997 46.0819C105.402 51.111 98.9052 54.5365 92.0511 54.8019H92.052C91.8763 54.8019 91.6782 54.806 91.4736 54.8102H91.4729C91.0789 54.8182 90.6606 54.8268 90.3299 54.8079C89.0461 54.7702 87.7367 54.6534 86.4767 54.4225C84.0781 54.0045 81.7259 53.223 79.5376 52.1561C73.584 49.222 68.85 44.0353 66.5254 37.7966C65.6399 35.4552 65.094 32.9584 64.9176 30.4604L61.8345 30.4592L61.8927 39.1586C61.9663 50.1739 62.0383 60.9525 62.0383 61L61.9514 60.9416L56.1933 57.0139C56.1933 56.9712 56.1112 42.9752 56.0376 30.4569ZM75.7346 24.4931L75.7428 24.4775C75.7271 24.483 75.6878 24.4882 75.6263 24.4931H75.7346ZM46.955 24.4452C44.5397 24.4535 42.862 24.4683 42.4804 24.4931H42.47L42.4662 24.4822L42.4585 24.4931H42.4327L42.4339 24.4968C42.4082 24.4995 42.396 24.5022 42.3981 24.505L44.4146 30.4257L44.4234 30.4525L47.3005 30.4536C46.627 44.9261 31.6558 54.6207 17.9883 49.222C9.10192 45.8263 3.05256 36.2503 4.08843 26.7001C4.35409 24.5189 4.93077 22.3634 5.81358 20.3564C10.519 9.33821 23.6694 4.01878 34.593 8.93603C40.9583 11.6732 45.6408 17.6997 46.955 24.4452ZM42.4332 24.529C42.4325 24.5292 42.4324 24.5295 42.4327 24.5298L42.4332 24.529ZM55.9429 11.2551C55.9467 11.2584 55.953 11.2636 55.9616 11.2707L55.9633 11.5476C55.9566 11.3776 55.9498 11.278 55.9429 11.2551ZM61.9812 60.6063L61.9826 60.8283L62.005 60.8436C61.9968 60.8186 61.9889 60.7382 61.9812 60.6063Z" fill="#705a8c"/></g><defs><clipPath id="oic-logo"><rect width="114" height="61" fill="white"/></clipPath></defs></svg>`;

function wrap(title: string, body: string, footer = 'You received this because you have an active role in OIC Shepherd.'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <tr><td>
          <div style="margin-bottom:24px">${LOGO}</div>
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111">${title}</h1>
          ${body}
          <div style="margin:28px 0 0;text-align:center">
            <a href="${APP_URL}/signin" style="display:inline-block;padding:12px 28px;background:#111;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">Log in to OIC Shepherd</a>
          </div>
          <hr style="margin:28px 0;border:none;border-top:1px solid #eee">
          <p style="margin:0;font-size:12px;color:#aaa">${footer}</p>
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

export function inviteEmail(invitedByName: string): EmailTemplate {
  return {
    subject: `You've been invited to OIC Shepherd`,
    html: wrap(
      `You're invited`,
      `
      <p style="margin:0 0 20px;font-size:15px;color:#333">
        <strong>${invitedByName}</strong> has approved your access to OIC Shepherd, a care and shepherding tool for our church community.
      </p>
      <p style="margin:0;font-size:14px;color:#555">
        To get started, click the button below and sign in with Google, or use your email address to create a password.
      </p>
      `,
      'You received this because you were invited to join OIC Shepherd.',
    ),
  };
}

export function ownProfileUpdatedEmail(updatedByName: string): EmailTemplate {
  return {
    subject: 'Your profile was updated',
    html: wrap('Your profile was updated', `
      <p style="margin:0 0 20px;font-size:15px;color:#333">
        <strong>${updatedByName}</strong> made changes to your profile in OIC Shepherd.
      </p>
      <p style="margin:0;font-size:14px;color:#555">Log in to review the changes.</p>
    `),
  };
}
