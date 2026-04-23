'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { CaretLeft, ClockCounterClockwise } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { type AuditLog } from '@/lib/types';
import { SHEET_MAX_WIDTH } from '@/lib/constants';

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

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function fmtTimestamp(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
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

export default function AuditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data, currentPersona, fetchAuditLogs } = useApp();

  const person = data.people.find((p) => p.id === id);

  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (currentPersona.role !== 'admin') {
      router.replace(`/person/${id}`);
      return;
    }
    fetchAuditLogs(id).then((result) => {
      setLogs(result);
      setLoading(false);
    });
  }, [id, currentPersona.role, fetchAuditLogs, router]);

  if (currentPersona.role !== 'admin') return null;

  const personName = person?.englishName ?? 'Unknown';
  const groups = groupByDate(logs);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingBottom: '5rem',
      }}
    >
      <div
        style={{
          maxWidth: SHEET_MAX_WIDTH,
          margin: '0 auto',
          padding: '0 1rem',
        }}
      >
        {/* Header */}
        <div style={navBarStyle}>
          <button onClick={() => router.back()} style={backBtnStyle}>
            <CaretLeft size={16} weight="bold" />
            {personName}
          </button>
          <span style={navTitleStyle}>Audit Log</span>
          <span style={{ width: 64 }} />
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              paddingTop: '4rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div
            style={{
              paddingTop: '4rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: 'var(--text-muted)',
            }}
          >
            <ClockCounterClockwise size={40} weight="light" />
            <p style={{ fontSize: '0.875rem' }}>No edits recorded yet.</p>
            <p style={{ fontSize: '0.8125rem', textAlign: 'center', maxWidth: '18rem' }}>
              Changes made through the app will appear here going forward.
            </p>
          </div>
        ) : (
          <div style={{ paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {groups.map((group) => (
              <div key={group.date}>
                <p style={dateLabelStyle}>{group.date}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.items.map((log, i) => (
                    <AuditEntry key={log.id} log={log} isLast={i === group.items.length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditEntry({ log, isLast }: { log: AuditLog; isLast: boolean }) {
  const isEmpty = (v: string | null) => v === null || v === '';

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: isLast ? '0 0 var(--radius) var(--radius)' : undefined,
        padding: '0.75rem 1rem',
        borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
        ...(log === log && !isLast ? {} : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {fieldLabel(log.fieldName)}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {fmtTimestamp(log.createdAt)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ValueChip value={log.oldValue} empty={isEmpty(log.oldValue)} label="before" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
        <ValueChip value={log.newValue} empty={isEmpty(log.newValue)} label="after" />
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
        by {log.changedByName}
      </p>
    </div>
  );
}

function ValueChip({
  value,
  empty,
  label: _label,
}: {
  value: string | null;
  empty: boolean;
  label: string;
}) {
  return (
    <span
      style={{
        fontSize: '0.8125rem',
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

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
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
  fontSize: 13,
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const dateLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
};
