'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function deleteApprovedEmail(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Allow if the caller's uid is linked to an admin persona, OR if an
  // unclaimed admin persona exists (setup phase before the admin has logged in).
  const { data: adminPersona } = await supabase
    .from('personas')
    .select('id')
    .eq('role', 'admin')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .maybeSingle();

  if (!adminPersona) return { error: 'Admin access required.' };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: 'Server misconfiguration.' };

  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { error } = await service.from('approved_emails').delete().eq('email', email);
  return { error: error?.message };
}
