'use client';

import React from 'react';
import { createClient } from '@/utils/supabase/client';
import { useApp } from '@/lib/context';

export default function AuthSync() {
  const { loginWithSupabaseUser } = useApp();

  React.useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthSync] event:', event, 'hasUser:', !!session?.user, 'email:', session?.user?.email);
      if (!session?.user) return;
      const user = session.user;
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const email = user.email;
      const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

      if (event === 'SIGNED_IN') {
        // Always sync on an explicit sign-in (new session or re-auth)
        console.log('[AuthSync] → loginWithSupabaseUser (SIGNED_IN)');
        loginWithSupabaseUser(user.id, name, email, avatarUrl);
      } else if (event === 'INITIAL_SESSION') {
        // On page reload: only sync if no persona preference is stored yet.
        // This preserves dev-mode persona switcher overrides.
        const stored = localStorage.getItem('shepherd-app-persona');
        console.log('[AuthSync] INITIAL_SESSION, storedPersona:', stored);
        if (!stored) {
          console.log('[AuthSync] → loginWithSupabaseUser (INITIAL_SESSION)');
          loginWithSupabaseUser(user.id, name, email, avatarUrl);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loginWithSupabaseUser]);

  return null;
}
