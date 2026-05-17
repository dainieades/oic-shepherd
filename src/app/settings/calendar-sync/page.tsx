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
    <div style={{ paddingBottom: 48 }}>
      <div className="settings-subpage-navbar" style={navBarStyle}>
        <button onClick={() => router.push('/settings')} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Calendar Sync</span>
        <span style={{ width: 72 }} />
      </div>

      <p
        style={{
          fontSize: 'var(--text-13)',
          color: 'var(--text-muted)',
          margin: '1rem 0 0.75rem',
          lineHeight: 'var(--leading-normal)',
        }}
      >
        Add OIC to-dos to your calendar app. New items appear automatically; how often updates show
        up depends on your calendar app.
      </p>

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
            <span style={labelStyle}>Calendar sync</span>
            <span style={descStyle}>
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
          <p style={sectionHeaderStyle}>Your calendar app</p>
          <CalendarSubscribeOptions
            feedUrl={feedUrl}
            onSubscribeApple={() => void handleSubscribeApple()}
            onSubscribeGoogle={() => void handleSubscribeGoogle()}
            onCopy={() => void handleCopy()}
          />

          <p style={sectionHeaderStyle}>Manage</p>
          <button onClick={() => setShowRegenConfirm(true)} style={resetBtnStyle}>
            <ArrowsClockwise size={16} color="var(--red)" />
            <span style={{ flex: 1, textAlign: 'left' }}>Reset feed URL</span>
          </button>
          <p style={{ ...descStyle, marginTop: '0.5rem' }}>
            Resetting disconnects every calendar app currently subscribed. Use only if you think the
            URL has been shared by mistake — you will need to re-subscribe in each app.
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
            <p
              style={{
                fontSize: 'var(--text-15)',
                fontWeight: 'var(--font-semibold)',
                margin: '0 0 0.5rem',
                color: 'var(--text-primary)',
              }}
            >
              Reset feed URL?
            </p>
            <p style={{ ...descStyle, marginBottom: '1rem' }}>
              Every calendar app currently subscribed will stop receiving updates. You will need to
              subscribe again with the new URL.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRegenConfirm(false)} style={ghostBtnStyle}>
                Cancel
              </button>
              <button onClick={() => void handleRegenerate()} style={dangerBtnStyle}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  fontSize: 'var(--text-13)',
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-15)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-primary)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-15)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--text-primary)',
  letterSpacing: 'var(--tracking-tight-1)',
};

const descStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-13)',
  color: 'var(--text-muted)',
  marginTop: '0.125rem',
  lineHeight: 'var(--leading-normal)',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 'var(--text-12)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide-4)',
  margin: '1.5rem 0 0.5rem',
};

const resetBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.625rem 0.875rem',
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  width: '100%',
  fontSize: 'var(--text-14)',
  color: 'var(--red)',
};

const ghostBtnStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'none',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--text-13)',
  color: 'var(--text-primary)',
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  background: 'var(--red)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--text-13)',
  color: 'white',
  fontWeight: 'var(--font-medium)',
};
