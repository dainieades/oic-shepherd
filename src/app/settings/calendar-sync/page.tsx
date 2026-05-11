'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CaretLeft,
  AppleLogo,
  GoogleLogo,
  Link as LinkIcon,
  Copy,
  ArrowsClockwise,
  Check,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import type { CalendarConnectedApp } from '@/lib/types';

const APP_LABEL: Record<CalendarConnectedApp, string> = {
  apple: 'Apple Calendar',
  google: 'Google Calendar',
  other: 'your calendar',
};

export default function CalendarSyncPage() {
  const router = useRouter();
  const {
    calendarSyncEnabled,
    calendarFeedToken,
    calendarConnectedApp,
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

  const feedUrl = calendarFeedToken && origin
    ? `${origin}/api/calendar-feed/${calendarFeedToken}.ics`
    : '';

  async function handleToggle(val: boolean) {
    if (val) {
      await enableCalendarSync(calendarConnectedApp ?? 'other');
      showToast('Calendar sync enabled');
    } else {
      await disableCalendarSync();
      showToast('Calendar sync disabled');
    }
  }

  async function handleSubscribe(app: CalendarConnectedApp) {
    const url = await enableCalendarSync(app);
    if (app === 'apple') {
      window.location.href = url.replace(/^https?:\/\//, 'webcal://');
    } else if (app === 'google') {
      window.open(
        `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url)}`,
        '_blank',
        'noopener,noreferrer'
      );
      showToast('Approve the calendar in Google Calendar to finish');
    }
  }

  async function handleCopy() {
    if (!feedUrl) {
      const url = await enableCalendarSync(calendarConnectedApp ?? 'other');
      try {
        await navigator.clipboard.writeText(url);
        showToast('Feed URL copied');
      } catch {
        showToast('Could not copy — long-press to copy');
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(feedUrl);
      showToast('Feed URL copied');
    } catch {
      showToast('Could not copy — long-press to copy');
    }
  }

  async function handleRegenerate() {
    await regenerateCalendarFeedToken();
    setShowRegenConfirm(false);
    showToast('Feed URL regenerated. Old URL no longer works.');
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={navBarStyle}>
        <button onClick={() => router.push('/settings')} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Calendar Sync</span>
        <span style={{ width: 72 }} />
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '1rem 0 0.75rem', lineHeight: 1.5 }}>
        Subscribe your calendar app to your personal feed. New to-dos appear in your calendar
        automatically — updates may take up to an hour to show.
      </p>

      {/* Toggle */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0.875rem 1rem',
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={labelStyle}>Auto-sync to-dos to my calendar</span>
            <span style={descStyle}>
              {calendarSyncEnabled && calendarConnectedApp
                ? `Connected to ${APP_LABEL[calendarConnectedApp]}`
                : 'Off — to-dos will not appear in your calendar'}
            </span>
          </span>
          <ToggleSwitch
            checked={calendarSyncEnabled}
            onChange={(val) => void handleToggle(val)}
            label="Auto-sync"
          />
        </div>
      </div>

      {calendarSyncEnabled && (
        <>
          {/* Subscribe buttons */}
          <p style={sectionHeaderStyle}>Subscribe in your calendar app</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SubscribeButton
              icon={<AppleLogo size={20} color="var(--text-primary)" weight="fill" />}
              label="Open in Apple Calendar"
              onClick={() => void handleSubscribe('apple')}
              checked={calendarConnectedApp === 'apple'}
            />
            <SubscribeButton
              icon={<GoogleLogo size={20} color="var(--text-primary)" />}
              label="Open in Google Calendar"
              onClick={() => void handleSubscribe('google')}
              checked={calendarConnectedApp === 'google'}
            />
          </div>

          {/* Feed URL */}
          <p style={sectionHeaderStyle}>Feed URL</p>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
              marginBottom: '0.5rem',
            }}
          >
            {feedUrl || 'Generating…'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <ActionButton
              icon={<Copy size={16} color="var(--text-muted)" />}
              label="Copy feed URL"
              onClick={handleCopy}
            />
            <ActionButton
              icon={<LinkIcon size={16} color="var(--text-muted)" />}
              label="Mark as connected to another app"
              onClick={() => void enableCalendarSync('other')}
            />
            <ActionButton
              icon={<ArrowsClockwise size={16} color="var(--red)" />}
              label="Regenerate feed URL"
              destructive
              onClick={() => setShowRegenConfirm(true)}
            />
          </div>

          <p style={{ ...descStyle, marginTop: '1rem' }}>
            Anyone with this URL can read your to-do list. Regenerate it if you think it has been shared
            by mistake — your existing calendar subscriptions will need to be re-added.
          </p>
        </>
      )}

      {showRegenConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--backdrop)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRegenConfirm(false);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem',
              maxWidth: '20rem',
              width: '100%',
              border: '1px solid var(--border-light)',
            }}
          >
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
              Regenerate feed URL?
            </p>
            <p style={{ ...descStyle, marginBottom: '1rem' }}>
              Any calendar app currently subscribed will stop receiving updates. You will need to
              subscribe again with the new URL.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRegenConfirm(false)}
                style={ghostBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleRegenerate()}
                style={dangerBtnStyle}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscribeButton({
  icon,
  label,
  onClick,
  checked,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  checked?: boolean;
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
      <span style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{label}</span>
      {checked && <Check size={18} weight="bold" color="var(--sage)" />}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
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
        color: destructive ? 'var(--red)' : 'var(--text-primary)',
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
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
  fontSize: '0.8125rem',
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.9375rem',
  fontWeight: 500,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const descStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--text-muted)',
  marginTop: '0.125rem',
  lineHeight: 1.5,
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '1.5rem 0 0.5rem',
};

const ghostBtnStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'none',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  color: 'var(--text-primary)',
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--red)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  color: 'white',
  fontWeight: 500,
};
