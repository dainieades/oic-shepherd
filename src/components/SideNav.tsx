'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS, isSideNavHidden } from '@/lib/navItems';
import { Logo } from '@/components/Logo';
import { AvatarBadge } from '@/components/AvatarBadge';

export default function SideNav() {
  const pathname = usePathname();
  const { currentPersona } = useApp();
  const isWelcome = currentPersona.role === 'welcome-team';

  if (isSideNavHidden(pathname)) return null;

  const items = NAV_ITEMS.filter((item) => !(isWelcome && item.shepherdOnly));

  return (
    <aside
      className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-light)',
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5"
        style={{ textDecoration: 'none', color: 'var(--logo-color)' }}
      >
        <Logo height={32} />
        <span
          className="font-display"
          style={{ fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em' }}
        >
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
              className="side-nav-item relative flex items-center gap-3 py-2.5 pr-3"
              aria-current={active ? 'page' : undefined}
              style={{
                paddingLeft: 'calc(0.75rem + 3px)',
                borderRadius: 'var(--radius-md)',
                background: active ? 'var(--sage-light)' : 'transparent',
                color: active ? 'var(--sage-dark)' : 'var(--text-secondary)',
                fontSize: '0.9375rem',
                fontWeight: active ? 600 : 500,
                textDecoration: 'none',
              }}
            >
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.375rem',
                    bottom: '0.375rem',
                    width: '3px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--sage-dark)',
                  }}
                />
              )}
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-3 px-3 py-3"
        style={{
          borderTop: '1px solid var(--border-light)',
          textDecoration: 'none',
          color: 'var(--text-primary)',
        }}
      >
        <AvatarBadge size={32} name={currentPersona.name} />
        <div className="flex min-w-0 flex-col">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.25 }}>
            {currentPersona.name}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentPersona.role}
          </span>
        </div>
      </Link>
    </aside>
  );
}
