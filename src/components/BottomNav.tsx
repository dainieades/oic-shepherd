'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS, isHiddenRoute, isNavItemVisible } from '@/lib/navItems';
import { usePendingVisitorCount } from '@/lib/usePendingVisitorCount';

export default function BottomNav() {
  const pathname = usePathname();
  const { currentPersona, fullPageModalOpen } = useApp();
  const pendingVisitorCount = usePendingVisitorCount();

  if (isHiddenRoute(pathname) || fullPageModalOpen) return null;

  const items = NAV_ITEMS.filter((item) => isNavItemVisible(item, currentPersona));

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 lg:hidden"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-[26.875rem] items-end justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.matches(pathname);
          const showBadge =
            item.href === '/visitors/pending' && pendingVisitorCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-tab flex w-16 flex-col items-center justify-end gap-0.5 pb-1.5"
              style={{
                color: active ? 'var(--sage)' : 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              <span style={{ position: 'relative', lineHeight: 0 }}>
                <Icon size={24} weight={active ? 'fill' : 'regular'} />
                {showBadge && (
                  <span
                    aria-label={`${pendingVisitorCount} pending`}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      minWidth: '1.125rem',
                      height: '1.125rem',
                      padding: '0 0.25rem',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      lineHeight: '1.125rem',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--sage)',
                      color: 'var(--on-sage)',
                    }}
                  >
                    {pendingVisitorCount}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
