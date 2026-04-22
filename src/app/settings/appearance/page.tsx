'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Sun, Moon, CircleHalf, Check } from '@phosphor-icons/react';
import type { ThemePreference } from '@/lib/types';
import { useApp } from '@/lib/context';

const OPTIONS: { value: ThemePreference; icon: React.ReactNode; label: string; description: string }[] = [
  { value: 'light', icon: <Sun size={22} weight="regular" />, label: 'Light', description: 'Always use light mode' },
  { value: 'dark', icon: <Moon size={22} weight="regular" />, label: 'Dark', description: 'Always use dark mode' },
  { value: 'system', icon: <CircleHalf size={22} weight="regular" />, label: 'System', description: 'Match your device settings' },
];

export default function AppearancePage() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useApp();

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Nav bar */}
      <div style={navBarStyle}>
        <button onClick={() => router.back()} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Theme</span>
        <span style={{ width: 72 }} />
      </div>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
            overflow: 'hidden',
          }}
        >
          {OPTIONS.map(({ value, icon, label, description }, i) => {
            const active = themePreference === value;
            return (
              <button
                key={value}
                onClick={() => setThemePreference(value)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < OPTIONS.length - 1 ? '1px solid var(--border-light)' : 'none',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left',
                }}
              >
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {description}
                  </span>
                </span>
                {active && <Check size={17} color="var(--sage)" weight="bold" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 'var(--z-page)',
  background: 'var(--bg)',
  marginLeft: -16,
  marginRight: -16,
  paddingLeft: 16,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 54,
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
};
