import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import type { NoticePrivacy, NoticeUrgency } from '@/lib/types';
import {
  personAddedEmail,
  noticeAddedEmail,
  shepherdAssignedEmail,
  personUpdatedEmail,
} from '@/lib/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

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
      updatedByName: string;
      actorEmail: string;
    };

async function getEmailsByRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roles: string[],
  exclude: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('personas')
    .select('email')
    .in('role', roles)
    .not('email', 'is', null);
  return (data ?? [])
    .map((r: { email: string | null }) => r.email)
    .filter((e): e is string => !!e && e !== exclude);
}

async function getEmailsByPersonaIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
  exclude: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from('personas')
    .select('email')
    .in('id', ids)
    .not('email', 'is', null);
  return (data ?? [])
    .map((r: { email: string | null }) => r.email)
    .filter((e): e is string => !!e && e !== exclude);
}

async function send(emails: string[], subject: string, html: string): Promise<void> {
  if (emails.length === 0) return;
  await Promise.all(
    emails.map((to) =>
      resend.emails.send({ from: FROM, to, subject, html })
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
      const emails = await getEmailsByPersonaIds(
        supabase,
        body.shepherdPersonaIds,
        body.actorEmail,
      );
      const { subject, html } = personUpdatedEmail(body.personName, body.updatedByName);
      await send(emails, subject, html);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notify]', err);
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
