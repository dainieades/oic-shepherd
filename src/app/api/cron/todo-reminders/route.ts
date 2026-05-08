import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import type { TodoReminder } from '@/lib/types';
import { todoCreatedEmail } from '@/lib/emails/templates';

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getResend() {
  const { Resend } = await import('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdminClient();

  // Find all unsent reminders that are due
  const { data: todos, error } = await admin
    .from('todos')
    .select('id, title, due_date, reminder, created_by')
    .lte('reminder_due_at', new Date().toISOString())
    .is('reminder_sent_at', null)
    .eq('completed', false)
    .not('reminder', 'is', null)
    .neq('reminder', 'none');

  if (error) {
    console.error('[cron/todo-reminders] query error', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!todos || todos.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Resolve persona → user_id for each unique created_by
  const personaIds = [...new Set(todos.map((t: { created_by: string }) => t.created_by))];
  const { data: personas } = await admin
    .from('personas')
    .select('id, user_id, notify_todo_created')
    .in('id', personaIds);

  const personaMap = new Map(
    (personas ?? []).map((p: { id: string; user_id: string | null; notify_todo_created: boolean | null }) => [
      p.id,
      { userId: p.user_id, notifyEnabled: p.notify_todo_created !== false },
    ])
  );

  const resend = await getResend();
  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  let sent = 0;

  for (const todo of todos as Array<{ id: string; title: string; due_date: string; reminder: TodoReminder; created_by: string }>) {
    const persona = personaMap.get(todo.created_by);
    if (!persona?.userId || !persona.notifyEnabled) {
      // Still mark as sent so we don't retry endlessly
      await admin.from('todos').update({ reminder_sent_at: new Date().toISOString() }).eq('id', todo.id);
      continue;
    }

    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(persona.userId);
    if (userErr || !user?.email) {
      await admin.from('todos').update({ reminder_sent_at: new Date().toISOString() }).eq('id', todo.id);
      continue;
    }

    try {
      const { subject, html } = todoCreatedEmail(todo.title, todo.due_date, todo.reminder);
      await resend.emails.send({ from, to: user.email, subject, html });
      sent++;
    } catch (err) {
      console.error(`[cron/todo-reminders] send failed for todo ${todo.id}`, err);
    }

    await admin.from('todos').update({ reminder_sent_at: new Date().toISOString() }).eq('id', todo.id);
  }

  return NextResponse.json({ sent });
}
