'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { CaretLeft, ClockCounterClockwise } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { type AuditLog } from '@/lib/types';
import { SHEET_MAX_WIDTH } from '@/lib/constants';
import { fullName } from '@/lib/utils';

const FIELD_LABELS: Record<string, string> = {
  preferredName: 'Preferred Name',
  lastName: 'Last Name',
  alternativeName: 'Alternative Name',
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

  const personName = person ? fullName(person) : 'Unknown';
  const groups = groupByDate(logs);

  return (
    <div className="min-h-dvh bg-bg pb-20">
      <div
        className="mx-auto px-4"
        style={{ maxWidth: SHEET_MAX_WIDTH }}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-bg -mx-4 px-4 border-b border-border-light flex items-center justify-between h-[3.375rem]">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-13 text-sage bg-transparent border-0 cursor-pointer p-0">
            <CaretLeft size={16} weight="bold" />
            {personName}
          </button>
          <span className="text-15 font-semibold text-text-primary">Audit Log</span>
          <span className="w-16" />
        </div>

        {/* Content */}
        {loading ? (
          <div className="pt-16 text-center text-text-muted text-14">
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div className="pt-16 flex flex-col items-center gap-3 text-text-muted">
            <ClockCounterClockwise size={40} weight="light" />
            <p className="text-14">No edits recorded yet.</p>
            <p className="text-13 text-center max-w-[18rem]">
              Changes made through the app will appear here going forward.
            </p>
          </div>
        ) : (
          <div className="pt-5 flex flex-col gap-8">
            {groups.map((group) => (
              <div key={group.date}>
                <p className="text-11 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">{group.date}</p>
                <div className="flex flex-col gap-px">
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
      className="bg-surface py-3 px-4"
      style={{
        borderRadius: isLast ? '0 0 var(--radius) var(--radius)' : undefined,
        borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
      }}
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
        <ValueChip value={log.oldValue} empty={isEmpty(log.oldValue)} label="before" />
        <span className="text-12 text-text-muted">→</span>
        <ValueChip value={log.newValue} empty={isEmpty(log.newValue)} label="after" />
      </div>

      <p className="text-12 text-text-muted mt-1.5">
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
      className="text-13 rounded-sm"
      style={{
        color: empty ? 'var(--text-muted)' : 'var(--text-primary)',
        background: empty ? 'transparent' : 'var(--sage-light)',
        padding: empty ? 0 : '0.125rem 0.375rem',
        fontStyle: empty ? 'italic' : 'normal',
      }}
    >
      {empty ? 'Not set' : value}
    </span>
  );
}

