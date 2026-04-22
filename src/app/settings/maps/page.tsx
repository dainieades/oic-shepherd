'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Check } from '@phosphor-icons/react';
import { type MapProvider, MAP_PROVIDER_LABELS, MAP_PROVIDERS_STORAGE_KEY } from '@/lib/utils';

const PROVIDERS: { value: MapProvider; description: string }[] = [
  { value: 'apple', description: 'Default on iPhone and Mac' },
  { value: 'google', description: 'Works on iPhone, Android, and web' },
  { value: 'waze', description: 'Community-based navigation' },
];

export default function MapsAppPage() {
  const router = useRouter();
  const [mapProvider, setMapProvider] = React.useState<MapProvider>('apple');

  React.useEffect(() => {
    const stored = localStorage.getItem(MAP_PROVIDERS_STORAGE_KEY) as MapProvider | null;
    if (stored && stored in MAP_PROVIDER_LABELS) setMapProvider(stored);
  }, []);

  const handleSelect = (provider: MapProvider) => {
    setMapProvider(provider);
    localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, provider);
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Nav bar */}
      <div style={navBarStyle}>
        <button onClick={() => router.back()} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Maps App</span>
        <span style={{ width: 72 }} />
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '16px 0 12px' }}>
        Choose which app opens when you tap an address.
      </p>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
        }}
      >
        {PROVIDERS.map(({ value, description }, i) => {
          const active = mapProvider === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: i < PROVIDERS.length - 1 ? '1px solid var(--border-light)' : 'none',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
              }}
            >
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
                  {MAP_PROVIDER_LABELS[value]}
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
  );
}

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 30,
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
