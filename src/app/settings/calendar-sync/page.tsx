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
  const { calendarSyncEnabled, calendarFeedToken, enableCalendarSync, disableCalendarSync } =
    useApp();
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
      <div className="settings-subpage-navbar bg-bg border-border-light z-page sticky top-0 -mx-4 flex h-[54px] items-center justify-between border-b px-4">
        <button
          onClick={() => router.push('/settings')}
          className="text-13 text-sage inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0"
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 text-text-primary font-semibold">Calendar Sync</span>
        <span className="w-[72px]" />
      </div>

      <p className="text-13 text-text-muted mt-4 mb-3 leading-normal">
        Subscribe your to-dos to Apple Calendar and new items appear automatically. For Google
        Calendar, Outlook, or other apps, copy the feed URL and add it as a subscribed calendar.
      </p>

      <div className="bg-surface border-border-light overflow-hidden rounded border">
        <div className="flex items-center gap-[14px] px-4 py-[0.875rem]">
          <span className="min-w-0 flex-1">
            <span className="text-15 text-text-primary tracking-tight-1 block font-medium">
              Calendar sync
            </span>
            <span className="text-13 text-text-muted mt-[0.125rem] block leading-normal">
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
          <p className="text-12 text-text-muted tracking-wide-4 mt-6 mb-2 font-semibold uppercase">
            Your calendar app
          </p>
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
