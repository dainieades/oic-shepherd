'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { CalendarSubscribeOptions } from '@/components/CalendarSubscribeOptions';

export default function CalendarSyncPage() {
  const router = useRouter();
  const {
    calendarSyncEnabled,
    calendarFeedToken,
    enableCalendarSync,
    disableCalendarSync,
  } = useApp();
  const { showToast } = useToast();
  const [origin, setOrigin] = React.useState('');
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const feedUrl =
    calendarFeedToken && origin ? `${origin}/api/calendar-feed/${calendarFeedToken}.ics` : '';

  async function handleToggle(val: boolean) {
    if (val) {
      await enableCalendarSync();
      showToast('Calendar sync enabled');
    } else {
      await disableCalendarSync();
      showToast('Calendar sync disabled');
    }
  }

  async function handleSubscribeApple() {
    const url = await enableCalendarSync();
    window.location.href = url.replace(/^https?:\/\//, 'webcal://');
  }

  async function handleCopy() {
    const url = feedUrl || (await enableCalendarSync());
    try {
      await navigator.clipboard.writeText(url);
      showToast('Feed URL copied');
    } catch {
      showToast('Could not copy — long-press to copy');
    }
  }

  return (
    <div className="pb-12">
      <div className="settings-subpage-navbar sticky top-0 bg-bg -mx-4 px-4 border-b border-border-light flex items-center justify-between h-[54px] z-page">
        <button onClick={() => router.push('/settings')} className="inline-flex items-center gap-1 text-13 text-sage bg-transparent border-none cursor-pointer p-0">
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 font-semibold text-text-primary">Calendar Sync</span>
        <span className="w-[72px]" />
      </div>

      <p className="text-13 text-text-muted mt-4 mb-3 leading-normal">
        Subscribe your to-dos to Apple Calendar and new items appear automatically. For Google
        Calendar, Outlook, or other apps, copy the feed URL and add it as a subscribed calendar.
      </p>

      <div className="bg-surface rounded border border-border-light overflow-hidden">
        <div className="flex items-center gap-[14px] py-[0.875rem] px-4">
          <span className="flex-1 min-w-0">
            <span className="block text-15 font-medium text-text-primary tracking-tight-1">Calendar sync</span>
            <span className="block text-13 text-text-muted mt-[0.125rem] leading-normal">
              {calendarSyncEnabled
                ? 'On — feed is active'
                : 'Off — to-dos will not appear in your calendar'}
            </span>
          </span>
          <ToggleSwitch
            checked={calendarSyncEnabled}
            onChange={(val) => void handleToggle(val)}
            label="Calendar sync"
          />
        </div>
      </div>

      {calendarSyncEnabled && (
        <>
          <p className="text-12 font-semibold text-text-muted uppercase tracking-wide-4 mt-6 mb-2">Your calendar app</p>
          <CalendarSubscribeOptions
            feedUrl={feedUrl}
            onSubscribeApple={() => void handleSubscribeApple()}
            onCopy={() => void handleCopy()}
          />

        </>
      )}
    </div>
  );
}

