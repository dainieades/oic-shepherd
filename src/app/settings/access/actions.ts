'use server';

import { createClient } from '@/utils/supabase/server';

export async function deleteApprovedEmail(email: string): Promise<{ error?: string }> {
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

  const { error } = await supabase.from('approved_emails').delete().eq('email', email);
  return { error: error?.message };
}
