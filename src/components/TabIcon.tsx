import React from 'react';
import { Notepad, CheckCircle, Info, Bell } from '@phosphor-icons/react';

type TabIconTab = 'logs' | 'todos' | 'notices' | 'info';

export function TabIcon({ tab, active }: { tab: TabIconTab; active: boolean }) {
  const weight = active ? 'fill' : 'regular';
  if (tab === 'logs') return <Notepad size={16} weight={weight} />;
  if (tab === 'todos') return <CheckCircle size={16} weight={weight} />;
  if (tab === 'notices') return <Bell size={16} weight={weight} />;
  return <Info size={16} weight={weight} />;
}
