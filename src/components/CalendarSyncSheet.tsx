'use client';

import React from 'react';
import { AppleLogo, GoogleLogo, Link as LinkIcon, Check, CalendarPlus, X } from '@phosphor-icons/react';
import { BottomSheet, ModalHeader } from './BottomSheet';
import { useApp } from '@/lib/context';
import { useToast } from './Toast';
import { buildGoogleCalendarUrl, buildIcsContent } from '@/lib/utils';
import type { CalendarConnectedApp, TodoRepeat, TodoReminder } from '@/lib/types';

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

const APP_LABEL: Record<CalendarConnectedApp, string> = {
  apple: 'Apple Calendar',
  google: 'Google Calendar',
  other: 'your calendar',
};

export default function CalendarSyncSheet({ onClose, singleEvent }: Props) {
  const { calendarSyncEnabled, calendarConnectedApp, enableCalendarSync, disableCalendarSync } = useApp();
  const { showToast } = useToast();

  async function getFeedUrl(app: CalendarConnectedApp): Promise<string> {
    return await enableCalendarSync(app);
  }

  async function handleApple() {
    const url = await getFeedUrl('apple');
    const webcal = url.replace(/^https?:\/\//, 'webcal://');
    window.location.href = webcal;
    onClose();
  }

  async function handleGoogle() {
    const url = await getFeedUrl('google');
    const cidUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url)}`;
    window.open(cidUrl, '_blank', 'noopener,noreferrer');
    showToast('Approve the calendar in Google Calendar to finish');
    onClose();
  }

  async function handleCopy() {
    const url = await getFeedUrl('other');
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
      buildGoogleCalendarUrl(singleEvent.title, singleEvent.start, singleEvent.end, singleEvent.allDay, singleEvent.repeat),
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
    <BottomSheet onClose={onClose} compact aria-labelledby="calendar-sync-title" zIndex={70}>
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
        {calendarSyncEnabled && calendarConnectedApp ? (
          <ConnectedBlock
            app={calendarConnectedApp}
            onDisable={handleDisable}
          />
        ) : (
          <SetupBlock
            onApple={handleApple}
            onGoogle={handleGoogle}
            onCopy={handleCopy}
          />
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

function SetupBlock({
  onApple,
  onGoogle,
  onCopy,
}: {
  onApple: () => void;
  onGoogle: () => void;
  onCopy: () => void;
}) {
  return (
    <>
      <p style={sectionHeaderStyle}>Auto-sync your to-dos</p>
      <p style={sectionDescStyle}>
        Subscribe once and all your to-dos appear in your calendar automatically.
        Updates may take up to an hour to show.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <BigActionButton
          icon={<AppleLogo size={20} color="var(--text-primary)" weight="fill" />}
          label="Subscribe in Apple Calendar"
          onClick={onApple}
        />
        <BigActionButton
          icon={<GoogleLogo size={20} color="var(--text-primary)" />}
          label="Add to Google Calendar"
          onClick={onGoogle}
        />
        <BigActionButton
          icon={<LinkIcon size={20} color="var(--text-primary)" />}
          label="Copy feed URL"
          subLabel="For Outlook, Fantastical, etc."
          onClick={onCopy}
        />
      </div>
    </>
  );
}

function ConnectedBlock({
  app,
  onDisable,
}: {
  app: CalendarConnectedApp;
  onDisable: () => void;
}) {
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
        <span style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
          Synced to <strong>{APP_LABEL[app]}</strong>
        </span>
      </div>
      <p style={sectionDescStyle}>
        New to-dos appear in your calendar automatically. To manage the feed URL or rotate it,
        open Settings → Calendar Sync.
      </p>
      <SmallActionButton
        icon={<X size={16} color="var(--text-muted)" />}
        label="Turn off calendar sync"
        onClick={onDisable}
      />
    </>
  );
}

function BigActionButton({
  icon,
  label,
  subLabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '0.875rem 1rem',
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        {subLabel && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            {subLabel}
          </span>
        )}
      </span>
    </button>
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
        fontSize: '0.875rem',
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
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '0 0 0.375rem',
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--text-muted)',
  margin: '0 0 0.875rem',
  lineHeight: 1.5,
};
