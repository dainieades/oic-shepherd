'use client';

import React from 'react';
import {
  Megaphone,
  Heart,
  HandsPraying,
  Sparkle,
  CaretDown,
  CaretRight,
} from '@phosphor-icons/react';
import { fetchLatestVisitorSubmission } from '@/lib/mappers';
import { type VisitorSubmission, type Person, type ChurchAttendance } from '@/lib/types';
import { useApp } from '@/lib/context';
import { REFERRAL_LABELS, INTEREST_LABELS } from '@/lib/constants';

const ACTIVE_VISITOR_ATTENDANCE: readonly ChurchAttendance[] = ['visitor'];

export function VisitorCardPanel({ person }: { person: Person }) {
  const { data } = useApp();
  const [submission, setSubmission] = React.useState<VisitorSubmission | null | undefined>(
    undefined
  );
  const isActiveVisitor = ACTIVE_VISITOR_ATTENDANCE.includes(person.churchAttendance);
  const [expanded, setExpanded] = React.useState(isActiveVisitor);

  React.useEffect(() => {
    setExpanded(isActiveVisitor);
  }, [isActiveVisitor]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchLatestVisitorSubmission(person.id);
      if (!cancelled) setSubmission(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [person.id]);

  if (!submission) return null;

  const hasCardContent =
    !!submission.referralSource ||
    submission.interests.length > 0 ||
    !!submission.prayerRequest;
  if (!hasCardContent) return null;

  const referralLabel = submission.referralSource
    ? REFERRAL_LABELS[submission.referralSource] +
      (submission.referralDetail ? ` — ${submission.referralDetail}` : '')
    : null;

  const submittedDate = new Date(submission.submittedAt).toLocaleDateString();

  if (!isActiveVisitor && !expanded) {
    const summaryParts: string[] = [];
    if (submission.referralSource)
      summaryParts.push(`Visited via ${REFERRAL_LABELS[submission.referralSource]}`);
    else summaryParts.push('Visitor card');
    summaryParts.push(submittedDate);

    return (
      <div>
        <p style={sectionLabelStyle}>Visitor card</p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="field-row-hover"
          style={{
            width: '100%',
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Sparkle size={14} color="var(--text-muted)" />
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
            {summaryParts.join(' · ')}
          </span>
          <CaretRight size={14} color="var(--text-muted)" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <p style={{ ...sectionLabelStyle, marginBottom: 0 }}>Visitor card</p>
        {!isActiveVisitor && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-muted)',
              padding: 0,
            }}
          >
            Collapse
            <CaretDown size={11} />
          </button>
        )}
      </div>
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          padding: '0.875rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {referralLabel && (
          <Row icon={<Megaphone size={15} color="var(--text-muted)" />} label="Heard via">
            {referralLabel}
          </Row>
        )}

        {submission.interests.length > 0 && (
          <Row icon={<Heart size={15} color="var(--text-muted)" />} label="Interested in">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {submission.interests.map((i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--sage-light)',
                    color: 'var(--sage-dark, var(--sage))',
                  }}
                >
                  {INTEREST_LABELS[i]}
                </span>
              ))}
            </div>
          </Row>
        )}

        {submission.prayerRequest && (
          <Row icon={<HandsPraying size={15} color="var(--text-muted)" />} label="Prayer request">
            <span style={{ whiteSpace: 'pre-wrap' }}>{submission.prayerRequest}</span>
          </Row>
        )}

        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Sparkle size={11} />
          {submission.source === 'qr'
            ? 'Self-submitted via public form'
            : `Filled by ${data.personas.find((p) => p.id === submission.submittedBy)?.name ?? 'Welcome Team'}`}
          {' · '}
          {submittedDate}
        </div>
      </div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
};

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ paddingTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
