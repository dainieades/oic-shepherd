import type { Metadata, Viewport } from 'next';
import { Lora } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import BottomNav from '@/components/BottomNav';

import AccessGate from '@/components/AccessGate';
import { ToastProvider } from '@/components/Toast';
import AppShell from '@/components/AppShell';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shepherd · OIC',
  description: 'Shepherding care app for One In Christ Church',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
      <body className="bg-bg text-text-primary">
        <ToastProvider>
          <AppProvider>
            <AccessGate />
            <AppShell>{children}</AppShell>
            <BottomNav />
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
