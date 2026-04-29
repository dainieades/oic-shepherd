import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import type { NoticePrivacy, NoticeUrgency } from '@/lib/types';
import {
  personAddedEmail,
  noticeAddedEmail,
  shepherdAssignedEmail,
  personUpdatedEmail,
  ownProfileUpdatedEmail,
} from '@/lib/emails/templates';

async function getResend() {
  const { Resend } = await import('resend');
  return new Resend(process.env.RESEND_API_KEY);
}
function getFrom() {
  return process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
}

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type NotifyPayload =
  | { type: 'person.added'; personName: string; addedByName: string; actorEmail: string }
  | {
      type: 'notice.added';
      aboutName: string;
      content: string;
      urgency: NoticeUrgency;
      privacy: NoticePrivacy;
      addedByName: string;
      actorEmail: string;
    }
  | {
      type: 'shepherd.assigned';
      personName: string;
      shepherdPersonaIds: string[];
      assignedByName: string;
      actorEmail: string;
    }
  | {
      type: 'person.updated';
      personName: string;
      shepherdPersonaIds: string[];
      personUserId?: string;
      updatedByName: string;
      actorEmail: string;
    };

async function resolveEmailsForUserIds(userIds: string[], exclude: string): Promise<string[]> {
  const admin = getAdminClient();
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const userIdSet = new Set(userIds);
  return users
    .filter((u) => userIdSet.has(u.id) && u.email && u.email !== exclude)
    .map((u) => u.email as string);
}

async function getEmailsByRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roles: string[],
  exclude: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('personas')
    .select('user_id')
    .in('role', roles)
    .not('user_id', 'is', null);
  const userIds = (data ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean);
  return resolveEmailsForUserIds(userIds, exclude);
}

async function getEmailsByPersonaIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
  exclude: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from('personas')
    .select('user_id')
    .in('id', ids)
    .not('user_id', 'is', null);
  const userIds = (data ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean);
  return resolveEmailsForUserIds(userIds, exclude);
}

async function send(emails: string[], subject: string, html: string): Promise<void> {
  if (emails.length === 0) return;
  const resend = getResend();
  const from = getFrom();
  await Promise.all(
    emails.map((to) =>
      resend.emails.send({ from, to, subject, html })
    )
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: NotifyPayload;
  try {
    body = (await req.json()) as NotifyPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    if (body.type === 'person.added') {
      const emails = await getEmailsByRole(supabase, ['admin'], body.actorEmail);
      const { subject, html } = personAddedEmail(body.personName, body.addedByName);
      await send(emails, subject, html);
    }

    if (body.type === 'notice.added') {
      let roles: string[];
      if (body.privacy === 'pastor-only') roles = ['admin'];
      else if (body.privacy === 'pastor-and-shepherds') roles = ['admin', 'shepherd'];
      else roles = ['admin', 'shepherd', 'welcome-team'];

      const emails = await getEmailsByRole(supabase, roles, body.actorEmail);
      const { subject, html } = noticeAddedEmail(
        body.aboutName,
        body.content,
        body.urgency,
        body.privacy,
        body.addedByName,
      );
      await send(emails, subject, html);
    }

    if (body.type === 'shepherd.assigned') {
      const emails = await getEmailsByPersonaIds(
        supabase,
        body.shepherdPersonaIds,
        body.actorEmail,
      );
      const { subject, html } = shepherdAssignedEmail(body.personName, body.assignedByName);
      await send(emails, subject, html);
    }

    if (body.type === 'person.updated') {
      const [shepherdEmails, personEmails] = await Promise.all([
        getEmailsByPersonaIds(supabase, body.shepherdPersonaIds, body.actorEmail),
        body.personUserId
          ? resolveEmailsForUserIds([body.personUserId], body.actorEmail)
          : Promise.resolve([] as string[]),
      ]);
      const { subject, html } = personUpdatedEmail(body.personName, body.updatedByName);
      const { subject: selfSubject, html: selfHtml } = ownProfileUpdatedEmail(body.updatedByName);
      await Promise.all([
        send(shepherdEmails, subject, html),
        send(personEmails, selfSubject, selfHtml),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notify]', err);
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
