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
    <div className="bg-bg z-toast fixed inset-0 flex items-center justify-center px-4 py-6">
      <div
        className="bg-surface border-border shadow-elevated w-full rounded-xl border text-center"
        style={{ maxWidth: '22.5rem', padding: '2.5rem 1.75rem 2rem' }}
      >
        <div className="bg-border-light mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full">
          <Lock size={28} color="var(--text-muted)" weight="bold" />
        </div>
        <h2 className="font-display text-22 text-text-primary mb-2.5 font-bold">
          {accessDenied ? 'Access Restricted' : 'Sign-In Failed'}
        </h2>
        <p className="text-15 text-text-secondary mb-7 leading-loose">
          {accessDenied
            ? 'This app is for OIC church members only. Contact your pastor to request access.'
            : 'Something went wrong while signing you in. Please try again — if it keeps happening, contact your pastor.'}
        </p>
        <button
          onClick={handleBack}
          className="bg-sage text-on-sage text-15 w-full cursor-pointer rounded-md border-none font-semibold"
          style={{ padding: '0.8125rem 1.25rem' }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
