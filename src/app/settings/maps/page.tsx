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
        className="settings-subpage-navbar bg-bg border-border-light z-page sticky top-0 -mx-4 flex items-center justify-between border-b px-4"
        style={{ height: 54 }}
      >
        <button
          onClick={() => router.push('/settings')}
          className="text-13 text-sage inline-flex cursor-pointer items-center gap-1 border-none bg-none p-0"
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 text-text-primary font-semibold">Maps App</span>
        <span className="w-18" />
      </div>

      <p className="text-13 text-text-muted mt-4 mb-3">
        Choose which app opens when you tap an address.
      </p>

      <div className="bg-surface border-border-light overflow-hidden rounded border">
        {PROVIDERS.map((value, i) => {
          const active = mapProvider === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="flex w-full cursor-pointer items-center gap-3.5 border-none bg-none p-4 text-left"
              style={{
                borderBottom: i < PROVIDERS.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <span className="text-15 text-text-primary tracking-tight-1 flex-1 font-medium">
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
