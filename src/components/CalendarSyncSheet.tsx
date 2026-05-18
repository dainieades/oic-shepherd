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

  function handleSubscribeGoogle() {
    // Compute URL and open window synchronously so popup blockers don't fire.
    // window.open after an await is treated as an untrusted open and blocked.
    const token =
      calendarFeedToken ??
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    const url = `${origin}/api/calendar-feed/${token}.ics`;
    window.open(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
    void enableCalendarSync(token);
    showToast('Approve the calendar in Google Calendar to finish');
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

      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        {calendarSyncEnabled ? (
          <ConnectedBlock onDisable={handleDisable} />
        ) : (
          <>
            <p style={sectionHeaderStyle}>Auto-sync your to-dos</p>
            <p style={sectionDescStyle}>
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
            <p style={sectionHeaderStyle}>Just this one</p>
            <p style={sectionDescStyle}>
              Add only this to-do to your calendar without setting up sync.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--sage-light)',
          border: '1px solid var(--sage-mid)',
          borderRadius: 'var(--radius)',
          marginBottom: '0.75rem',
        }}
      >
        <Check size={20} weight="bold" color="var(--sage)" />
        <span style={{ flex: 1, fontSize: 'var(--text-15)', color: 'var(--text-primary)' }}>
          Synced to <strong>your calendar</strong>
        </span>
      </div>
      <p style={sectionDescStyle}>
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 0.875rem',
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        fontSize: 'var(--text-14)',
        color: 'var(--text-primary)',
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--border-light)',
        margin: '1.25rem 0',
      }}
    />
  );
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 'var(--text-13)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide-4)',
  margin: '0 0 0.375rem',
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: 'var(--text-13)',
  color: 'var(--text-muted)',
  margin: '0 0 0.875rem',
  lineHeight: 'var(--leading-normal)',
};
