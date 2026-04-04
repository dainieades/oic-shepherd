import type { Metadata, Viewport } from 'next';
import { Lora } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import BottomNav from '@/components/BottomNav';
import PersonaSwitcherBar from '@/components/PersonaSwitcherBar';
import AuthSync from '@/components/AuthSync';

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
          <AuthSync />
          <PersonaSwitcherBar />
          <main className="max-w-[430px] mx-auto w-full pt-9 pb-20 px-4 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
