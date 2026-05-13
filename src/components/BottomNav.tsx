'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS, isHiddenRoute } from '@/lib/navItems';

export default function BottomNav() {
  const pathname = usePathname();
  const { currentPersona, fullPageModalOpen } = useApp();
  const isWelcome = currentPersona.role === 'welcome-team';

  if (isHiddenRoute(pathname) || fullPageModalOpen) return null;

  const items = NAV_ITEMS.filter((item) => !(isWelcome && item.shepherdOnly));

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
              <Icon size={24} weight={active ? 'fill' : 'regular'} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
