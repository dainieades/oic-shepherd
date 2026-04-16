import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;

  if (!email) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    // Service key not configured — can't perform pre-login checks.
    // Return a special status so the client can show a helpful message.
    return NextResponse.json({ status: 'no-service-key' });
  }

  // Use the service role client so RLS doesn't block either check.
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Check the approved_emails allowlist (bypasses RLS with service key)
  const { data: approved } = await adminClient
    .from('approved_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (!approved) {
    return NextResponse.json({ status: 'not-invited' });
  }

  // 2. Check auth identity providers for this email
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );

  if (!res.ok) {
    // Auth admin API unavailable — treat as invited (no account yet)
    return NextResponse.json({ status: 'invited' });
  }

  const payload = await res.json();
  const users: Array<{ email: string; identities?: Array<{ provider: string }> }> =
    payload.users ?? [];

  const user = users.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    // In approved_emails but no auth account yet — guide to create password
    return NextResponse.json({ status: 'invited' });
  }

  const identities = user.identities ?? [];
  const hasGoogle = identities.some((i) => i.provider === 'google');
  const hasPassword = identities.some((i) => i.provider === 'email');

  if (hasGoogle && !hasPassword) {
    return NextResponse.json({ status: 'google' });
  }

  return NextResponse.json({ status: 'existing' });
}
