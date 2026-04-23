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
  followUpFrequencyDays: 'Follow-up Frequency',
  isShepherd: 'Is Shepherd',
  isBeingDiscipled: 'Being Discipled',
  churchPositions: 'Church Positions',
  appRole: 'App Role',
};

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1', personId: 'p1', changedByPersonaId: 'persona-1', changedByName: 'Pastor David',
    fieldName: 'churchAttendance', oldValue: 'on-leave', newValue: 'regular',
    createdAt: '2026-04-23T14:32:00.000Z',
  },
  {
    id: '2', personId: 'p1', changedByPersonaId: 'persona-1', changedByName: 'Pastor David',
    fieldName: 'membershipStatus', oldValue: 'non-member', newValue: 'membership-track',
    createdAt: '2026-04-23T14:32:00.000Z',
  },
  {
    id: '3', personId: 'p1', changedByPersonaId: 'persona-2', changedByName: 'Shepherd Grace',
    fieldName: 'phone', oldValue: '', newValue: '604-555-0192',
    createdAt: '2026-04-21T09:15:00.000Z',
  },
  {
    id: '4', personId: 'p1', changedByPersonaId: 'persona-2', changedByName: 'Shepherd Grace',
    fieldName: 'homeAddress', oldValue: '', newValue: '1234 Maple St, Vancouver, BC',
    createdAt: '2026-04-21T09:15:00.000Z',
  },
  {
    id: '5', personId: 'p1', changedByPersonaId: 'persona-1', changedByName: 'Pastor David',
    fieldName: 'appRole', oldValue: 'no-access', newValue: 'shepherd',
    createdAt: '2026-04-18T16:45:00.000Z',
  },
  {
    id: '6', personId: 'p1', changedByPersonaId: 'persona-1', changedByName: 'Pastor David',
    fieldName: 'isBeingDiscipled', oldValue: 'No', newValue: 'Yes',
    createdAt: '2026-04-18T16:45:00.000Z',
  },
  {
    id: '7', personId: 'p1', changedByPersonaId: 'persona-3', changedByName: 'Shepherd James',
    fieldName: 'englishName', oldValue: 'Timothy Chan', newValue: 'Timothy Chang',
    createdAt: '2026-04-10T11:20:00.000Z',
  },
  {
    id: '8', personId: 'p1', changedByPersonaId: 'persona-3', changedByName: 'Shepherd James',
    fieldName: 'birthday', oldValue: '', newValue: '1995-03-14',
    createdAt: '2026-04-10T11:20:00.000Z',
  },
  {
    id: '9', personId: 'p1', changedByPersonaId: 'persona-2', changedByName: 'Shepherd Grace',
    fieldName: 'language', oldValue: 'English', newValue: 'English, Mandarin Chinese',
    createdAt: '2026-04-03T13:05:00.000Z',
  },
  {
    id: '10', personId: 'p1', changedByPersonaId: 'persona-1', changedByName: 'Pastor David',
    fieldName: 'followUpFrequencyDays', oldValue: '14', newValue: '7',
    createdAt: '2026-03-28T10:00:00.000Z',
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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: SHEET_MAX_WIDTH, margin: '0 auto', padding: '0 1rem' }}>
        <div style={navBarStyle}>
          <button onClick={() => router.back()} style={backBtnStyle}>
            <CaretLeft size={16} weight="bold" />
            Timothy Chang
          </button>
          <span style={navTitleStyle}>Audit Log</span>
          <span style={{ width: 64 }} />
        </div>

        <div style={{ paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {groups.map((group) => (
            <div key={group.date}>
              <p style={dateLabelStyle}>{group.date}</p>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
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
    <div style={{ padding: '0.75rem 1rem', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {fieldLabel(log.fieldName)}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {fmtTimestamp(log.createdAt)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ValueChip value={log.oldValue} empty={isEmpty(log.oldValue)} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
        <ValueChip value={log.newValue} empty={isEmpty(log.newValue)} />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
        by {log.changedByName}
      </p>
    </div>
  );
}

function ValueChip({ value, empty }: { value: string | null; empty: boolean }) {
  return (
    <span style={{
      fontSize: '0.8125rem',
      color: empty ? 'var(--text-muted)' : 'var(--text-primary)',
      background: empty ? 'transparent' : 'var(--sage-light)',
      borderRadius: 'var(--radius-sm)',
      padding: empty ? 0 : '0.125rem 0.375rem',
      fontStyle: empty ? 'italic' : 'normal',
    }}>
      {empty ? 'Not set' : value}
    </span>
  );
}

const navBarStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)',
  marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
  borderBottom: '1px solid var(--border-light)', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between', height: 54,
};
const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13,
  color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
};
const navTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' };
const dateLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
};
