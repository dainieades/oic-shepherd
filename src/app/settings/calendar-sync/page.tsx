'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, ArrowsClockwise } from '@phosphor-icons/react';
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
    regenerateCalendarFeedToken,
  } = useApp();
  const { showToast } = useToast();
  const [origin, setOrigin] = React.useState('');
  const [showRegenConfirm, setShowRegenConfirm] = React.useState(false);

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

  async function handleSubscribeGoogle() {
    const url = await enableCalendarSync();
    window.open(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
    showToast('Approve the calendar in Google Calendar to finish');
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

  async function handleRegenerate() {
    await regenerateCalendarFeedToken();
    setShowRegenConfirm(false);
    showToast('Feed URL reset. Old URL no longer works.');
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
        Add OIC to-dos to your calendar app. New items appear automatically; how often updates show
        up depends on your calendar app.
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
            onSubscribeGoogle={() => void handleSubscribeGoogle()}
            onCopy={() => void handleCopy()}
          />

          <p className="text-12 font-semibold text-text-muted uppercase tracking-wide-4 mt-6 mb-2">Manage</p>
          <button onClick={() => setShowRegenConfirm(true)} className="flex items-center gap-[0.625rem] py-[0.625rem] px-[0.875rem] bg-surface border border-border-light rounded-sm cursor-pointer w-full text-14 text-red">
            <ArrowsClockwise size={16} color="var(--red)" />
            <span className="flex-1 text-left">Reset feed URL</span>
          </button>
          <p className="block text-13 text-text-muted mt-2 leading-normal">
            Resetting disconnects every calendar app currently subscribed. Use only if you think the
            URL has been shared by mistake — you will need to re-subscribe in each app.
          </p>
        </>
      )}

      {showRegenConfirm && (
        <div
          className="fixed inset-0 bg-[var(--backdrop)] flex items-center justify-center p-4 z-[100]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRegenConfirm(false);
          }}
        >
          <div className="bg-surface rounded p-5 max-w-[20rem] w-full border border-border-light">
            <p className="text-15 font-semibold text-text-primary m-0 mb-2">
              Reset feed URL?
            </p>
            <p className="block text-13 text-text-muted mt-[0.125rem] leading-normal mb-4">
              Every calendar app currently subscribed will stop receiving updates. You will need to
              subscribe again with the new URL.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRegenConfirm(false)} className="py-2 px-[0.875rem] bg-transparent border border-border-light rounded-sm cursor-pointer text-13 text-text-primary">
                Cancel
              </button>
              <button onClick={() => void handleRegenerate()} className="py-2 px-[0.875rem] bg-[var(--red)] border-none rounded-sm cursor-pointer text-13 text-white font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

