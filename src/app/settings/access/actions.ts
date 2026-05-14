'use server';

import { createClient } from '@/utils/supabase/server';

async function requireAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: adminPersona } = await supabase
    .from('personas')
    .select('id')
    .eq('role', 'admin')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminPersona) return { error: 'Admin access required.' };
  return {};
}

export async function deleteApprovedEmail(email: string): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from('approved_emails').delete().eq('email', email);
  return { error: error?.message };
}

export async function updateApprovedEmail(
  oldEmail: string,
  newEmail: string
): Promise<{ error?: string }> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const normalized = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: 'Enter a valid email address.' };
  }
  if (normalized === oldEmail.toLowerCase()) return {};

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('approved_emails')
    .select('email')
    .eq('email', normalized)
    .maybeSingle();
  if (existing) return { error: 'This email is already approved.' };

  const { error } = await supabase
    .from('approved_emails')
    .update({ email: normalized })
    .eq('email', oldEmail);
  return { error: error?.message };
}
