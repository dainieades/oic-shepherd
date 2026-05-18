'use client';

import React from 'react';
import { type Dispatch, type SetStateAction } from 'react';
import { type AppData, type Persona, type ThemePreference, type NotificationPreferences } from '../types';
import { MAP_PROVIDERS_STORAGE_KEY, type MapProvider } from '../utils';
import { createClient } from '@/utils/supabase/client';

interface PreferencesHookDeps {
  setData: Dispatch<SetStateAction<AppData>>;
  currentPersonaId: string;
}

export interface PreferencesHookResult {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  mapProvider: MapProvider;
  setMapProvider: (provider: MapProvider) => void;
  notificationPrefs: NotificationPreferences;
  setNotificationPreference: <K extends keyof NotificationPreferences>(key: K, value: boolean) => Promise<void>;
  calendarSyncEnabled: boolean;
  calendarFeedToken: string | null;
  enableCalendarSync: (pregenToken?: string) => Promise<string>;
  disableCalendarSync: () => Promise<void>;
  regenerateCalendarFeedToken: () => Promise<string>;
  applyPersonaSettings: (persona: Persona) => void;
}

const NOTIFY_PREF_COLUMNS: Record<keyof NotificationPreferences, string> = {
  personAdded: 'notify_person_added',
  noticeAdded: 'notify_notice_added',
  shepherdAssigned: 'notify_shepherd_assigned',
  personUpdated: 'notify_person_updated',
  todoCreated: 'notify_todo_created',
};

export function usePreferencesHook({ setData, currentPersonaId }: PreferencesHookDeps): PreferencesHookResult {
  const [themePreference, setThemePreferenceState] = React.useState<ThemePreference>('system');
  const [mapProvider, setMapProviderState] = React.useState<MapProvider>('google');
  const [notificationPrefs, setNotificationPrefsState] = React.useState<NotificationPreferences>({
    personAdded: true,
    noticeAdded: true,
    shepherdAssigned: true,
    personUpdated: false,
    todoCreated: true,
  });
  const [calendarSyncEnabled, setCalendarSyncEnabledState] = React.useState<boolean>(false);
  const [calendarFeedToken, setCalendarFeedTokenState] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('shepherd-app-theme') as ThemePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemePreferenceState(stored);
    }
    const storedMap = localStorage.getItem(MAP_PROVIDERS_STORAGE_KEY) as MapProvider | null;
    if (storedMap === 'apple' || storedMap === 'google') {
      setMapProviderState(storedMap);
    }
  }, []);

  React.useEffect(() => {
    const html = document.documentElement;
    if (themePreference === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (themePreference === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
  }, [themePreference]);

  const setThemePreference = React.useCallback(
    (pref: ThemePreference): void => {
      setThemePreferenceState(pref);
      localStorage.setItem('shepherd-app-theme', pref);
      createClient()
        .from('personas')
        .update({ theme_preference: pref })
        .eq('id', currentPersonaId)
        .then(() => {});
    },
    [currentPersonaId]
  );

  const setMapProvider = React.useCallback(
    (provider: MapProvider): void => {
      setMapProviderState(provider);
      localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, provider);
      createClient()
        .from('personas')
        .update({ map_provider: provider })
        .eq('id', currentPersonaId)
        .then(() => {});
    },
    [currentPersonaId]
  );

  const setNotificationPreference = React.useCallback(
    async <K extends keyof NotificationPreferences>(key: K, value: boolean): Promise<void> => {
      setNotificationPrefsState((prev) => ({ ...prev, [key]: value }));
      await createClient()
        .from('personas')
        .update({ [NOTIFY_PREF_COLUMNS[key]]: value })
        .eq('id', currentPersonaId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPersonaId]
  );

  const enableCalendarSync = React.useCallback(
    async (pregenToken?: string): Promise<string> => {
      const token =
        pregenToken ??
        calendarFeedToken ??
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36));
      setCalendarSyncEnabledState(true);
      setCalendarFeedTokenState(token);
      setData((prev) => ({
        ...prev,
        personas: prev.personas.map((p) =>
          p.id === currentPersonaId
            ? { ...p, calendarSyncEnabled: true, calendarFeedToken: token }
            : p
        ),
      }));
      await createClient()
        .from('personas')
        .update({ calendar_sync_enabled: true, calendar_feed_token: token })
        .eq('id', currentPersonaId);
      return `${window.location.origin}/api/calendar-feed/${token}.ics`;
    },
    [calendarFeedToken, currentPersonaId, setData]
  );

  const disableCalendarSync = React.useCallback(async (): Promise<void> => {
    setCalendarSyncEnabledState(false);
    setData((prev) => ({
      ...prev,
      personas: prev.personas.map((p) =>
        p.id === currentPersonaId ? { ...p, calendarSyncEnabled: false } : p
      ),
    }));
    await createClient()
      .from('personas')
      .update({ calendar_sync_enabled: false })
      .eq('id', currentPersonaId);
  }, [currentPersonaId, setData]);

  const regenerateCalendarFeedToken = React.useCallback(async (): Promise<string> => {
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    setCalendarFeedTokenState(token);
    setData((prev) => ({
      ...prev,
      personas: prev.personas.map((p) =>
        p.id === currentPersonaId ? { ...p, calendarFeedToken: token } : p
      ),
    }));
    await createClient()
      .from('personas')
      .update({ calendar_feed_token: token })
      .eq('id', currentPersonaId);
    return `${window.location.origin}/api/calendar-feed/${token}.ics`;
  }, [currentPersonaId, setData]);

  const applyPersonaSettings = React.useCallback((persona: Persona): void => {
    if (persona.themePreference) {
      setThemePreferenceState(persona.themePreference);
      localStorage.setItem('shepherd-app-theme', persona.themePreference);
    }
    if (persona.mapProvider === 'apple' || persona.mapProvider === 'google') {
      setMapProviderState(persona.mapProvider);
      localStorage.setItem(MAP_PROVIDERS_STORAGE_KEY, persona.mapProvider);
    }
    if (persona.notificationPrefs) {
      setNotificationPrefsState(persona.notificationPrefs);
    }
    setCalendarSyncEnabledState(persona.calendarSyncEnabled ?? false);
    setCalendarFeedTokenState(persona.calendarFeedToken ?? null);
  }, []);

  return {
    themePreference,
    setThemePreference,
    mapProvider,
    setMapProvider,
    notificationPrefs,
    setNotificationPreference,
    calendarSyncEnabled,
    calendarFeedToken,
    enableCalendarSync,
    disableCalendarSync,
    regenerateCalendarFeedToken,
    applyPersonaSettings,
  };
}
