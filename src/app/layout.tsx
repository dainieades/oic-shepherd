import type { Metadata, Viewport } from 'next';
import { Lora } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import BottomNav from '@/components/BottomNav';

import AuthSync from '@/components/AuthSync';
import AccessGate from '@/components/AccessGate';
import { ToastProvider } from '@/components/Toast';

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
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lora.variable}>
      <body style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        <AppProvider>
          <ToastProvider>
            <AuthSync />
            <AccessGate />
            <main className="max-w-[430px] mx-auto w-full pb-20 px-4 min-h-screen">
              {children}
            </main>
            <BottomNav />
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
