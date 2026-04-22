'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

const personaLabels: Record<string, string> = {
  admin: 'Admin',
  'shepherd-1': 'Shepherd 1',
  'shepherd-2': 'Shepherd 2',
  'welcome-team': 'Welcome',
};

export default function PersonaSwitcherBar() {
  const { data, currentPersona, switchPersona } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const isSignIn = pathname === '/signin';

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') return null;
  if (pathname === '/signup') return null;

  return (
    <div className="dev-rail fixed top-0 right-0 left-0 z-50">
      <div className="mx-auto flex h-9 max-w-[26.875rem] items-center gap-3 px-3">
        {/* DEV badge */}
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.5625rem',
            letterSpacing: '0.08em',
            color: '#888',
            border: '1px solid #444',
            borderRadius: '0.25rem',
            padding: '0.0625rem 0.3125rem',
            flexShrink: 0,
          }}
        >
          DEV
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: '#333', flexShrink: 0 }} />

        {/* Persona pills */}
        <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
          {data.personas.map((persona) => {
            const isActive = currentPersona.id === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => {
                  switchPersona(persona.id);
                  if (isSignIn) router.push('/');
                }}
                style={{
                  flexShrink: 0,
                  fontSize: '0.6875rem',
                  fontWeight: isActive ? 600 : 400,
                  padding: '0.125rem 0.625rem',
                  borderRadius: 'var(--radius-pill)',
                  border: isActive ? '1px solid var(--sage)' : '1px solid #3A3A3A',
                  background: isActive ? 'var(--sage)' : 'transparent',
                  color: isActive ? 'var(--on-sage)' : '#999',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {personaLabels[persona.id] ?? persona.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Current persona label */}
        <span
          style={{
            fontSize: '0.625rem',
            color: '#666',
            flexShrink: 0,
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {currentPersona.name.split(' ').slice(0, 2).join(' ')}
        </span>
      </div>
    </div>
  );
}
