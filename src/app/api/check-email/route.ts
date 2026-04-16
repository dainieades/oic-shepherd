import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;

  if (!email) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Check the approved_emails allowlist
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: approved } = await anonClient
    .from('approved_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (!approved) {
    return NextResponse.json({ status: 'not-invited' });
  }

  // 2. Check auth identity providers — requires service role key
  if (!serviceKey) {
    // Graceful fallback when service key is not configured
    return NextResponse.json({ status: 'invited' });
  }

  // Fetch all auth users (church app has a small, bounded user base)
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
    // Admin API unavailable — fall back to treating as invited
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
    // Google-only account
    return NextResponse.json({ status: 'google' });
  }

  // Has a password account (may also have Google linked)
  return NextResponse.json({ status: 'existing' });
}
