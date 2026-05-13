import type { Metadata, Viewport } from 'next';
import { Lora } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import BottomNav from '@/components/BottomNav';

import AuthSync from '@/components/AuthSync';
import AccessGate from '@/components/AccessGate';
import { ToastProvider } from '@/components/Toast';
import PageTransition from '@/components/PageTransition';
import SideNav from '@/components/SideNav';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shepherd Care · OIC',
  description: 'Shepherding care app for One In Christ Church',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lora.variable} suppressHydrationWarning>
      <head>
        {/* Runs synchronously before paint to apply stored theme and prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('shepherd-app-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        <ToastProvider>
          <AppProvider>
            <AuthSync />
            <AccessGate />
            <div className="lg:grid lg:min-h-screen lg:grid-cols-[16rem_1fr]">
              <SideNav />
              <main className="mx-auto min-h-screen w-full max-w-[26.875rem] px-4 pb-20 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-0">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
            <BottomNav />
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
