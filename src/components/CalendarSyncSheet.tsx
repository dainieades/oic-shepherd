'use client';

import React from 'react';
import { GoogleLogo, Check, CalendarPlus, X } from '@phosphor-icons/react';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { buildGoogleCalendarUrl, buildIcsContent } from '@/lib/utils';
import { CalendarSubscribeOptions } from './CalendarSubscribeOptions';
import type { TodoRepeat, TodoReminder } from '@/lib/types';

export interface SingleEventInput {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  repeat?: TodoRepeat;
  reminder?: TodoReminder;
}

interface Props {
  onClose: () => void;
  singleEvent?: SingleEventInput;
}

export default function CalendarSyncSheet({ onClose, singleEvent }: Props) {
  const { calendarSyncEnabled, calendarFeedToken, enableCalendarSync, disableCalendarSync } =
    useApp();
  const { showToast } = useToast();
  const [origin, setOrigin] = React.useState('');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const feedUrl =
    calendarFeedToken && origin ? `${origin}/api/calendar-feed/${calendarFeedToken}.ics` : '';

  function handleSubscribeApple() {
    // Compute URL synchronously so window.location.href runs within the user-gesture context.
    // iOS Safari blocks webcal:// redirects that happen after an await.
    const token =
      calendarFeedToken ??
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    const url = `${origin}/api/calendar-feed/${token}.ics`;
    window.location.href = url.replace(/^https?:\/\//, 'webcal://');
    void enableCalendarSync(token);
    onClose();
  }

  async function handleSubscribeGoogle() {
    console.log('[CalendarSync] button clicked — origin:', origin, 'calendarFeedToken:', calendarFeedToken);
    const win = window.open('about:blank', '_blank');
    console.log('[CalendarSync] win is null (popup blocked)?', win === null);
    const feedUrl = await enableCalendarSync();
    const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://');
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${webcalUrl}`;
    console.log('[CalendarSync] feedUrl:', feedUrl);
    console.log('[CalendarSync] googleUrl:', googleUrl);
    if (win) {
      win.location.href = googleUrl;
    } else {
      window.open(googleUrl, '_blank');
    }
    showToast('Click "Add" in Google Calendar to finish');
    onClose();
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

  async function handleDisable() {
    await disableCalendarSync();
    showToast('Calendar sync turned off');
    onClose();
  }

  function handleOneOffGoogle() {
    if (!singleEvent) return;
    window.open(
      buildGoogleCalendarUrl(
        singleEvent.title,
        singleEvent.start,
        singleEvent.end,
        singleEvent.allDay,
        singleEvent.repeat
      ),
      '_blank',
      'noopener,noreferrer'
    );
    onClose();
  }

  function handleOneOffIcs() {
    if (!singleEvent) return;
    const uid = Date.now().toString(36);
    const content = buildIcsContent(
      singleEvent.title,
      uid,
      singleEvent.start,
      singleEvent.end,
      singleEvent.allDay,
      singleEvent.repeat,
      singleEvent.reminder
    );
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${singleEvent.title.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <BottomSheet
      onClose={onClose}
      compact
      variant="confirm"
      contentStyle={{ maxWidth: '26rem' }}
      allowBackdropClose
      aria-labelledby="calendar-sync-title"
      zIndex={70}
    >
      <ModalHeader
        title="Calendar Sync"
        titleId="calendar-sync-title"
        onCancel={onClose}
        cancelLabel="Close"
        onAction={onClose}
        actionLabel="Done"
        actionVariant="text"
      />

      <div className="px-5 pt-4 pb-5">
        {calendarSyncEnabled ? (
          <ConnectedBlock onDisable={handleDisable} />
        ) : (
          <>
            <p className="text-13 font-semibold text-text-muted uppercase tracking-wide-4 mb-1.5">Auto-sync your to-dos</p>
            <p className="text-13 text-text-muted mb-3.5 leading-normal">
              Add OIC to-dos to your calendar app. New items appear automatically; how often updates
              show up depends on your calendar app.
            </p>
            <CalendarSubscribeOptions
              feedUrl={feedUrl}
              onSubscribeApple={() => void handleSubscribeApple()}
              onSubscribeGoogle={() => void handleSubscribeGoogle()}
              onCopy={() => void handleCopy()}
            />
          </>
        )}

        {singleEvent && (
          <>
            <Divider />
            <p className="text-13 font-semibold text-text-muted uppercase tracking-wide-4 mb-1.5">Just this one</p>
            <p className="text-13 text-text-muted mb-3.5 leading-normal">
              Add only this to-do to your calendar without setting up sync.
            </p>
            <div className="flex flex-col gap-2">
              <SmallActionButton
                icon={<GoogleLogo size={16} color="var(--text-muted)" />}
                label="Add to Google Calendar"
                onClick={handleOneOffGoogle}
              />
              <SmallActionButton
                icon={<CalendarPlus size={16} color="var(--text-muted)" />}
                label="Download .ics file"
                onClick={handleOneOffIcs}
              />
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function ConnectedBlock({ onDisable }: { onDisable: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 py-3.5 px-4 bg-sage-light border border-sage-mid rounded mb-3">
        <Check size={20} weight="bold" color="var(--sage)" />
        <span className="flex-1 text-15 text-text-primary">
          Synced to <strong>your calendar</strong>
        </span>
      </div>
      <p className="text-13 text-text-muted mb-3.5 leading-normal">
        New to-dos appear in your calendar automatically. To manage the feed URL or rotate it, open
        Settings → Calendar Sync.
      </p>
      <SmallActionButton
        icon={<X size={16} color="var(--text-muted)" />}
        label="Turn off calendar sync"
        onClick={onDisable}
      />
    </>
  );
}

function SmallActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 py-2.5 px-3.5 bg-surface border border-border-light rounded-sm cursor-pointer text-left w-full text-14 text-text-primary"
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-border-light my-5" />;
}
