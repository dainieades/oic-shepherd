import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { z } from 'zod';

const BodySchema = z.object({
  email: z.string().email(),
  label: z.string().nullish(),
});

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, label } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const admin = getAdminClient();

  const { error: approvedError } = await admin
    .from('approved_emails')
    .upsert({ email: normalizedEmail, label: label ?? null }, { onConflict: 'email' });

  if (approvedError) {
    return NextResponse.json({ error: approvedError.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oic-shepherd.vercel.app';
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo: `${appUrl}/auth/callback`,
  });

  if (inviteError) {
    // User already has an auth account — they're approved and can just log in.
    const alreadyExists =
      inviteError.message?.toLowerCase().includes('already') ||
      inviteError.message?.toLowerCase().includes('registered') ||
      inviteError.status === 422;
    if (alreadyExists) {
      return NextResponse.json({ ok: true, existing: true });
    }
    console.error('[invite] inviteUserByEmail failed', inviteError);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
