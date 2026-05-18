'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Sun, Moon, CircleHalf, Check } from '@phosphor-icons/react';
import type { ThemePreference } from '@/lib/types';
import { useApp } from '@/lib/context';

const OPTIONS: {
  value: ThemePreference;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    value: 'light',
    icon: <Sun size={22} weight="regular" />,
    label: 'Light',
    description: 'Always use light mode',
  },
  {
    value: 'dark',
    icon: <Moon size={22} weight="regular" />,
    label: 'Dark',
    description: 'Always use dark mode',
  },
  {
    value: 'system',
    icon: <CircleHalf size={22} weight="regular" />,
    label: 'System',
    description: 'Match your device settings',
  },
];

export default function AppearancePage() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useApp();

  return (
    <div className="pb-12">
      {/* Nav bar */}
      <div className="settings-subpage-navbar sticky top-0 -mx-4 px-4 border-b border-border-light bg-bg flex items-center justify-between z-page" style={{ height: 54 }}>
        <button onClick={() => router.push('/settings')} className="inline-flex items-center gap-1 text-13 text-sage cursor-pointer p-0" style={{ background: 'none', border: 'none' }}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 font-semibold text-text-primary">Theme</span>
        <span className="w-[4.5rem]" />
      </div>

      <div className="mt-6">
        <div className="bg-surface rounded border border-border-light overflow-hidden">

          {OPTIONS.map(({ value, icon, label, description }, i) => {
            const active = themePreference === value;
            return (
              <button
                key={value}
                onClick={() => setThemePreference(value)}
                className="w-full flex items-center gap-3.5 p-4 cursor-pointer text-left"
                style={{
                  background: active ? 'color-mix(in srgb, var(--sage) 10%, transparent)' : 'none',
                  border: 'none',
                  borderBottom: i < OPTIONS.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
              >
                <span
                  className="shrink-0 flex items-center justify-center rounded-sm"
                  style={{
                    color: active ? 'var(--sage)' : 'var(--text-muted)',
                    width: 36,
                    height: 36,
                    background: active
                      ? 'color-mix(in srgb, var(--sage) 15%, transparent)'
                      : 'var(--surface-raised, var(--border-light))',
                  }}
                >
                  {icon}
                </span>
                <span className="flex-1">
                  <span
                    className="block text-15 tracking-tight-1"
                    style={{
                      fontWeight: active ? 'var(--font-semibold)' : 'var(--font-medium)',
                      color: active ? 'var(--sage)' : 'var(--text-primary)',
                    }}
                  >
                    {label}
                  </span>
                  <span className="block text-13 text-text-muted mt-0.5">
                    {description}
                  </span>
                </span>
                <span className="flex items-center justify-center shrink-0" style={{ width: 22, height: 22 }}>
                  {active && <Check size={20} color="var(--sage)" weight="bold" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

