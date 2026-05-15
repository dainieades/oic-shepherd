'use server';

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Returns true when `userId` is no longer present in `auth.users` (e.g. the
 * auth account was deleted but a persona still has a dangling `user_id` ref).
 * Used by the login flow to safely reclaim a persona whose previous auth link
 * is stale, rather than refusing to link and creating an orphan persona.
 */
export async function isStaleAuthUser(userId: string): Promise<boolean> {
  if (!userId) return true;
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return true;
  return !data?.user;
}
