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
    <aside
      className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col bg-surface border-r border-border-light"
    >
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 no-underline text-[var(--logo-color)]"
      >
        <Logo height={32} />
        <span className="font-display text-17 font-semibold tracking-tight-1">
          Shepherd
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.matches(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav-item relative flex items-center gap-3 py-2.5 pr-3 no-underline rounded-md text-15 pl-[calc(0.75rem+3px)] ${active ? 'bg-sage-light text-sage-dark font-semibold' : 'bg-transparent text-text-secondary font-medium'}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-[0.1875rem] rounded-pill bg-sage-dark"
                />
              )}
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span>{item.label}</span>
              {item.href === '/visitors/pending' && pendingVisitorCount > 0 && (
                <span
                  className="ml-auto text-11 font-bold rounded-pill bg-sage text-on-sage leading-comfortable py-px px-[0.4375rem]"
                >
                  {pendingVisitorCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-3 px-3 py-3 border-t border-border-light no-underline text-text-primary"
      >
        <AvatarBadge size={32} name={currentPersona.name} photo={personaPerson?.photo} />
        <div className="flex min-w-0 flex-col">
          <span className="text-13 font-semibold leading-snug">
            {currentPersona.name}
          </span>
          <span className="text-11 text-text-muted leading-snug overflow-hidden text-ellipsis whitespace-nowrap">
            {currentPersona.role}
          </span>
        </div>
      </Link>
    </aside>
  );
}
