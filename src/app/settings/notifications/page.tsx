'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import type { NotificationPreferences } from '@/lib/types';
import { ToggleSwitch } from '@/components/ToggleSwitch';

import type { Role } from '@/lib/types';

interface NotifOption {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  roles: Role[];
}

const NOTIFICATION_OPTIONS: NotifOption[] = [
  {
    key: 'personAdded',
    label: 'New person added',
    description: 'When someone is added to the directory',
    roles: ['admin'],
  },
  {
    key: 'noticeAdded',
    label: 'New notice posted',
    description: 'When a care notice is shared with you',
    roles: ['admin', 'shepherd', 'welcome-team'],
  },
  {
    key: 'shepherdAssigned',
    label: 'Shepherd assignment',
    description: 'When you are assigned as a shepherd',
    roles: ['admin', 'shepherd'],
  },
  {
    key: 'personUpdated',
    label: 'Profile updated',
    description: 'When a profile you shepherd is changed',
    roles: ['admin', 'shepherd'],
  },
  {
    key: 'todoCreated',
    label: 'To-do reminders',
    description: 'Email reminder when a to-do is due',
    roles: ['admin', 'shepherd'],
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { notificationPrefs, setNotificationPreference, currentPersona } = useApp();
  const visibleOptions = NOTIFICATION_OPTIONS.filter((o) => o.roles.includes(currentPersona.role));

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={navBarStyle}>
        <button onClick={() => router.push('/settings')} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={navTitleStyle}>Notifications</span>
        <span style={{ width: 72 }} />
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '1rem 0 0.75rem' }}>
        Choose which email notifications you receive.
      </p>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
        }}
      >
        {visibleOptions.map(({ key, label, description }, i) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0.875rem 1rem',
              borderBottom: i < visibleOptions.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.125rem',
                }}
              >
                {description}
              </span>
            </span>
            <ToggleSwitch
              checked={notificationPrefs[key]}
              onChange={(val) => void setNotificationPreference(key, val)}
              label={label}
            />
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.75rem',
          lineHeight: 1.5,
        }}
      >
        Invitation emails are always sent and cannot be turned off.
      </p>
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
