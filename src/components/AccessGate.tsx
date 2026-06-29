'use client';

import { useApp } from '@/lib/context';
import { Lock } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AccessGate() {
  const { accessDenied, authError, retryLogin } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/welcome') return null;
  if (!accessDenied && !authError) return null;

  async function handleBack() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('shepherd-app-persona');
    retryLogin();
    router.push('/signin');
  }

  return (
    <div
      className="fixed inset-0 bg-bg flex items-center justify-center py-6 px-4 z-toast"
    >
      <div
        className="w-full bg-surface rounded-xl border border-border text-center shadow-elevated"
        style={{ maxWidth: '22.5rem', padding: '2.5rem 1.75rem 2rem' }}
      >
        <div className="w-16 h-16 rounded-full bg-border-light flex items-center justify-center mx-auto mb-5">
          <Lock size={28} color="var(--text-muted)" weight="bold" />
        </div>
        <h2
          className="font-display text-22 font-bold text-text-primary mb-2.5"
        >
          {accessDenied ? 'Access Restricted' : 'Sign-In Failed'}
        </h2>
        <p className="text-15 text-text-secondary leading-loose mb-7">
          {accessDenied
            ? 'This app is for OIC church members only. Contact your pastor to request access.'
            : "Something went wrong while signing you in. Please try again — if it keeps happening, contact your pastor."}
        </p>
        <button
          onClick={handleBack}
          className="w-full rounded-md border-none bg-sage text-on-sage text-15 font-semibold cursor-pointer"
          style={{ padding: '0.8125rem 1.25rem' }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
