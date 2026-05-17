'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { isSideNavHidden } from '@/lib/navItems';
import SideNav from './SideNav';
import PageTransition from './PageTransition';

export default function AppShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const chromeless = isSideNavHidden(pathname);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  if (chromeless) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[26.875rem] px-4 pb-20 sm:max-w-[32rem] sm:px-12 md:px-16">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[14rem_1fr]">
      <SideNav />
      <main className="mx-auto min-h-screen w-full max-w-[26.875rem] px-4 pb-20 sm:max-w-none sm:px-12 md:px-16 lg:mx-0 lg:px-0 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
