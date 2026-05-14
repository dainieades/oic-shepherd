import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { z } from 'zod';
import { inviteEmail } from '@/lib/emails/templates';
import { isMailerConfigured, sendEmail } from '@/lib/emails/mailer';

const BodySchema = z.object({
  email: z.string().email(),
  label: z.string().nullish(),
  personId: z.string().nullish(),
});

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, label, personId } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const admin = getAdminClient();

  const { error: approvedError } = await admin
    .from('approved_emails')
    .upsert(
      { email: normalizedEmail, label: label ?? null, person_id: personId ?? null },
      { onConflict: 'email' }
    );

  if (approvedError) {
    return NextResponse.json({ error: approvedError.message }, { status: 500 });
  }

  // Resolve inviter's display name for the email
  const { data: persona } = await admin
    .from('personas')
    .select('english_name')
    .eq('user_id', user.id)
    .maybeSingle();
  const invitedByName =
    (persona as { english_name?: string } | null)?.english_name ?? user.email ?? 'Your pastor';

  if (isMailerConfigured()) {
    const { subject, html } = inviteEmail(invitedByName);
    const { error: emailError } = await sendEmail({ to: normalizedEmail, subject, html });
    if (emailError) {
      console.error('[invite] Email error:', emailError);
      return NextResponse.json(
        { error: `Email delivery failed: ${emailError.message}` },
        { status: 500 }
      );
    }
  } else {
    console.warn('[invite] Mailer not configured — invite email not sent');
  }

  return NextResponse.json({ ok: true });
}
