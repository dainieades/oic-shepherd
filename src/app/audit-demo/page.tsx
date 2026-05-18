'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { type AuditLog } from '@/lib/types';
import { SHEET_MAX_WIDTH } from '@/lib/constants';
import { format, parseISO } from 'date-fns';

const FIELD_LABELS: Record<string, string> = {
  englishName: 'English Name',
  chineseName: 'Chinese Name',
  photo: 'Photo',
  phone: 'Mobile Phone',
  homePhone: 'Home Phone',
  email: 'Email',
  homeAddress: 'Home Address',
  membershipStatus: 'Membership Status',
  churchAttendance: 'Church Attendance',
  membershipDate: 'Membership Date',
  language: 'Language',
  gender: 'Gender',
  maritalStatus: 'Marital Status',
  birthday: 'Birthday',
  baptismDate: 'Baptism Date',
  anniversary: 'Anniversary',
  isShepherd: 'Is Shepherd',
  isBeingDiscipled: 'Being Discipled',
  churchPositions: 'Church Positions',
  appRole: 'App Role',
};

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    personId: 'p1',
    changedByPersonaId: 'persona-1',
    changedByName: 'Pastor David',
    fieldName: 'churchAttendance',
    oldValue: 'on-leave',
    newValue: 'regular',
    createdAt: '2026-04-23T14:32:00.000Z',
  },
  {
    id: '2',
    personId: 'p1',
    changedByPersonaId: 'persona-1',
    changedByName: 'Pastor David',
    fieldName: 'membershipStatus',
    oldValue: 'non-member',
    newValue: 'membership-track',
    createdAt: '2026-04-23T14:32:00.000Z',
  },
  {
    id: '3',
    personId: 'p1',
    changedByPersonaId: 'persona-2',
    changedByName: 'Shepherd Grace',
    fieldName: 'phone',
    oldValue: '',
    newValue: '604-555-0192',
    createdAt: '2026-04-21T09:15:00.000Z',
  },
  {
    id: '4',
    personId: 'p1',
    changedByPersonaId: 'persona-2',
    changedByName: 'Shepherd Grace',
    fieldName: 'homeAddress',
    oldValue: '',
    newValue: '1234 Maple St, Vancouver, BC',
    createdAt: '2026-04-21T09:15:00.000Z',
  },
  {
    id: '5',
    personId: 'p1',
    changedByPersonaId: 'persona-1',
    changedByName: 'Pastor David',
    fieldName: 'appRole',
    oldValue: 'no-access',
    newValue: 'shepherd',
    createdAt: '2026-04-18T16:45:00.000Z',
  },
  {
    id: '6',
    personId: 'p1',
    changedByPersonaId: 'persona-1',
    changedByName: 'Pastor David',
    fieldName: 'isBeingDiscipled',
    oldValue: 'No',
    newValue: 'Yes',
    createdAt: '2026-04-18T16:45:00.000Z',
  },
  {
    id: '7',
    personId: 'p1',
    changedByPersonaId: 'persona-3',
    changedByName: 'Shepherd James',
    fieldName: 'englishName',
    oldValue: 'Timothy Chan',
    newValue: 'Timothy Chang',
    createdAt: '2026-04-10T11:20:00.000Z',
  },
  {
    id: '8',
    personId: 'p1',
    changedByPersonaId: 'persona-3',
    changedByName: 'Shepherd James',
    fieldName: 'birthday',
    oldValue: '',
    newValue: '1995-03-14',
    createdAt: '2026-04-10T11:20:00.000Z',
  },
  {
    id: '9',
    personId: 'p1',
    changedByPersonaId: 'persona-2',
    changedByName: 'Shepherd Grace',
    fieldName: 'language',
    oldValue: 'English',
    newValue: 'English, Mandarin Chinese',
    createdAt: '2026-04-03T13:05:00.000Z',
  },
];

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function fmtTimestamp(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

function groupByDate(logs: AuditLog[]): { date: string; items: AuditLog[] }[] {
  const map = new Map<string, AuditLog[]>();
  for (const log of logs) {
    const key = format(parseISO(log.createdAt), 'MMMM d, yyyy');
    const existing = map.get(key);
    if (existing) existing.push(log);
    else map.set(key, [log]);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function AuditDemoPage() {
  const router = useRouter();
  const { setFullPageModalOpen } = useApp();
  const groups = groupByDate(MOCK_LOGS);

  React.useEffect(() => {
    setFullPageModalOpen(true);
    return () => setFullPageModalOpen(false);
  }, [setFullPageModalOpen]);

  return (
    <div className="min-h-[100dvh] bg-bg pb-20">
      <div style={{ maxWidth: SHEET_MAX_WIDTH, margin: '0 auto' }} className="px-4">
        <div className={navBarStyle}>
          <button onClick={() => router.back()} className={backBtnStyle}>
            <CaretLeft size={16} weight="bold" />
            Timothy Chang
          </button>
          <span className={navTitleStyle}>Audit Log</span>
          <span className="w-16" />
        </div>

        <div className="pt-5 flex flex-col gap-8">
          {groups.map((group) => (
            <div key={group.date}>
              <p className={dateLabelStyle}>{group.date}</p>
              <div className="bg-surface rounded border border-border-light overflow-hidden">
                {group.items.map((log, i) => (
                  <AuditEntry key={log.id} log={log} isLast={i === group.items.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditEntry({ log, isLast }: { log: AuditLog; isLast: boolean }) {
  const isEmpty = (v: string | null) => v === null || v === '';
  return (
    <div
      className={`py-3 px-4${isLast ? '' : ' border-b border-border-light'}`}
    >
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <span className="text-13 font-semibold text-text-primary">
          {fieldLabel(log.fieldName)}
        </span>
        <span className="text-12 text-text-muted whitespace-nowrap">
          {fmtTimestamp(log.createdAt)}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ValueChip value={log.oldValue} empty={isEmpty(log.oldValue)} />
        <span className="text-12 text-text-muted">→</span>
        <ValueChip value={log.newValue} empty={isEmpty(log.newValue)} />
      </div>
      <p className="text-12 text-text-muted mt-1.5">
        by {log.changedByName}
      </p>
    </div>
  );
}

function ValueChip({ value, empty }: { value: string | null; empty: boolean }) {
  return (
    <span
      className="text-13"
      style={{
        color: empty ? 'var(--text-muted)' : 'var(--text-primary)',
        background: empty ? 'transparent' : 'var(--sage-light)',
        borderRadius: 'var(--radius-sm)',
        padding: empty ? 0 : '0.125rem 0.375rem',
        fontStyle: empty ? 'italic' : 'normal',
      }}
    >
      {empty ? 'Not set' : value}
    </span>
  );
}

const navBarStyle = 'sticky top-0 z-50 bg-bg -mx-4 px-4 border-b border-border-light flex items-center justify-between h-[3.375rem]';
const backBtnStyle = 'inline-flex items-center gap-1 text-13 text-sage bg-transparent border-none cursor-pointer p-0';
const navTitleStyle = 'text-15 font-semibold text-text-primary';
const dateLabelStyle = 'text-11 font-semibold text-text-muted uppercase tracking-wide-6 mb-2';
