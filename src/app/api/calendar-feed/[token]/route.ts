import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { addHours } from 'date-fns';
import { buildIcsFeed, type IcsEventInput } from '@/lib/utils';
import type { TodoRepeat, TodoReminder } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface TodoFeedRow {
  id: string;
  title: string;
  due_date: string | null;
  end_date: string | null;
  repeat: TodoRepeat | null;
  reminder: TodoReminder | null;
  completed: boolean | null;
  created_at: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token: rawToken } = await params;
  const token = rawToken.replace(/\.ics$/i, '');

  if (!token || token.length < 16) {
    return new NextResponse('Not found', { status: 404 });
  }

  const admin = getAdminClient();

  const { data: persona, error: personaErr } = await admin
    .from('personas')
    .select('id, name, calendar_sync_enabled')
    .eq('calendar_feed_token', token)
    .maybeSingle();

  if (personaErr || !persona || !persona.calendar_sync_enabled) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { data: todos, error: todosErr } = await admin
    .from('todos')
    .select('id, title, due_date, end_date, repeat, reminder, completed, created_at')
    .eq('created_by', persona.id)
    .not('due_date', 'is', null);

  if (todosErr) {
    return new NextResponse('Error', { status: 500 });
  }

  const events: IcsEventInput[] = (todos as TodoFeedRow[] | null ?? [])
    .filter((t) => !!t.due_date)
    .map((t) => {
      const dueIso = t.due_date as string;
      const start = new Date(dueIso);
      const hasTime = dueIso.length >= 16 && dueIso.slice(11, 16) !== '00:00';
      const allDay = !hasTime;
      const end = t.end_date
        ? new Date(t.end_date)
        : allDay
          ? start
          : addHours(start, 1);
      const title = t.completed ? `✓ Done: ${t.title}` : t.title;
      return {
        title,
        uid: t.id,
        start,
        end,
        allDay,
        repeat: t.repeat ?? undefined,
        reminder: t.reminder ?? undefined,
      };
    });

  const ics = buildIcsFeed(events, `OIC Shepherd — ${persona.name}`);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': `inline; filename="oic-shepherd-${token.slice(0, 8)}.ics"`,
    },
  });
}
