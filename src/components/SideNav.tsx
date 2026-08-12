'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS, isSideNavHidden, isNavItemVisible } from '@/lib/navItems';
import { Logo } from '@/components/Logo';
import { AvatarBadge } from '@/components/AvatarBadge';
import { usePendingVisitorCount } from '@/lib/usePendingVisitorCount';

export default function SideNav() {
  const pathname = usePathname();
  const { data, currentPersona } = useApp();
  const pendingVisitorCount = usePendingVisitorCount();
  const personaPerson = currentPersona.personId
    ? data.people.find((p) => p.id === currentPersona.personId)
    : null;

  if (isSideNavHidden(pathname)) return null;

  const items = NAV_ITEMS.filter((item) => isNavItemVisible(item, currentPersona));

  return (
    <aside className="bg-surface border-border-light hidden border-r lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 text-[var(--logo-color)] no-underline"
      >
        <Logo height={32} />
        <span className="font-display text-17 tracking-tight-1 font-semibold">Shepherd</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.matches(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav-item text-15 relative flex items-center gap-3 rounded-md py-2.5 pr-3 pl-[calc(0.75rem+3px)] no-underline ${active ? 'bg-sage-light text-sage-dark font-semibold' : 'text-text-secondary bg-transparent font-medium'}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  aria-hidden
                  className="rounded-pill bg-sage-dark absolute top-1.5 bottom-1.5 left-0 w-[0.1875rem]"
                />
              )}
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span>{item.label}</span>
              {item.href === '/visitors/pending' && pendingVisitorCount > 0 && (
                <span className="text-11 rounded-pill bg-sage text-on-sage leading-comfortable ml-auto px-[0.4375rem] py-px font-bold">
                  {pendingVisitorCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="border-border-light text-text-primary flex items-center gap-3 border-t px-3 py-3 no-underline"
      >
        <AvatarBadge size={32} name={currentPersona.name} photo={personaPerson?.photo} />
        <div className="flex min-w-0 flex-col">
          <span className="text-13 leading-snug font-semibold">{currentPersona.name}</span>
          <span className="text-11 text-text-muted overflow-hidden leading-snug text-ellipsis whitespace-nowrap">
            {currentPersona.role}
          </span>
        </div>
      </Link>
    </aside>
  );
}
