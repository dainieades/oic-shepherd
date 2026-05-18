'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Check } from '@phosphor-icons/react';
import { type MapProvider, MAP_PROVIDER_LABELS } from '@/lib/utils';
import { useApp } from '@/lib/context';

const PROVIDERS: MapProvider[] = ['google', 'apple'];

export default function MapsAppPage() {
  const router = useRouter();
  const { mapProvider, setMapProvider } = useApp();

  const handleSelect = (provider: MapProvider) => {
    setMapProvider(provider);
  };

  return (
    <div className="pb-12">
      {/* Nav bar */}
      <div
        className="settings-subpage-navbar sticky top-0 bg-bg -mx-4 px-4 border-b border-border-light flex items-center justify-between z-page"
        style={{ height: 54 }}
      >
        <button
          onClick={() => router.push('/settings')}
          className="inline-flex items-center gap-1 text-13 text-sage bg-none border-none cursor-pointer p-0"
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 font-semibold text-text-primary">Maps App</span>
        <span className="w-18" />
      </div>

      <p className="text-13 text-text-muted mt-4 mb-3">
        Choose which app opens when you tap an address.
      </p>

      <div className="bg-surface rounded border border-border-light overflow-hidden">
        {PROVIDERS.map((value, i) => {
          const active = mapProvider === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="w-full bg-none border-none p-4 cursor-pointer flex items-center gap-3.5 text-left"
              style={{
                borderBottom: i < PROVIDERS.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <span className="flex-1 text-15 font-medium text-text-primary tracking-tight-1">
                {MAP_PROVIDER_LABELS[value]}
              </span>
              {active && <Check size={17} color="var(--sage)" weight="bold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
