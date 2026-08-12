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
    description:
      "When a person is added to the people's list or a newcomer is accepted into the directory",
    roles: ['admin', 'shepherd'],
  },
  {
    key: 'noticeAdded',
    label: 'New notice posted',
    description: 'When a care notice is shared with you',
    roles: ['admin', 'shepherd'],
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
    <div className="pb-12">
      <div
        className="settings-subpage-navbar border-border-light bg-bg z-page sticky top-0 -mx-4 flex items-center justify-between border-b px-4"
        style={{ height: 54 }}
      >
        <button
          onClick={() => router.push('/settings')}
          className="text-13 text-sage inline-flex cursor-pointer items-center gap-1 p-0"
          style={{ background: 'none', border: 'none' }}
        >
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span className="text-15 text-text-primary font-semibold">Notifications</span>
        <span className="w-[4.5rem]" />
      </div>

      <p className="text-13 text-text-muted mt-4 mb-3">
        Choose which email notifications you receive.
      </p>

      <div className="bg-surface border-border-light overflow-hidden rounded border">
        {visibleOptions.map(({ key, label, description }, i) => (
          <div
            key={key}
            className="flex items-center gap-3.5"
            style={{
              padding: '0.875rem 1rem',
              borderBottom:
                i < visibleOptions.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="text-15 text-text-primary tracking-tight-1 block font-medium">
                {label}
              </span>
              <span className="text-13 text-text-muted mt-0.5 block">{description}</span>
            </span>
            <ToggleSwitch
              checked={notificationPrefs[key]}
              onChange={(val) => void setNotificationPreference(key, val)}
              label={label}
            />
          </div>
        ))}
      </div>

      <p className="text-12 text-text-muted mt-3 leading-normal">
        Invitation emails are always sent and cannot be turned off.
      </p>
    </div>
  );
}
