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
    !!submission.referralSource || submission.interests.length > 0 || !!submission.prayerRequest;
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
    else summaryParts.push('Newcomer card');
    summaryParts.push(submittedDate);

    return (
      <div>
        <p className="text-10 text-text-muted tracking-wide-6 mb-2 font-semibold uppercase">
          Newcomer card
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="field-row-hover bg-surface flex w-full cursor-pointer items-center gap-2 rounded border-0 px-4 py-3 text-left"
        >
          <Sparkle size={14} color="var(--text-muted)" />
          <span className="text-13 text-text-muted flex-1">{summaryParts.join(' · ')}</span>
          <CaretRight size={14} color="var(--text-muted)" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-10 text-text-muted tracking-wide-6 mb-0 font-semibold uppercase">
          Newcomer card
        </p>
        {!isActiveVisitor && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-11 text-text-muted flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0"
          >
            Collapse
            <CaretDown size={11} />
          </button>
        )}
      </div>
      <div className="bg-surface flex flex-col gap-3 rounded px-4 py-[14px]">
        {referralLabel && (
          <Row icon={<Megaphone size={15} color="var(--text-muted)" />} label="Heard via">
            {referralLabel}
          </Row>
        )}

        {submission.interests.length > 0 && (
          <Row icon={<Heart size={15} color="var(--text-muted)" />} label="Interested in">
            <div className="flex flex-wrap gap-1.5">
              {submission.interests.map((i) => (
                <span
                  key={i}
                  className="text-12 rounded-pill bg-sage-light text-sage-dark px-2 py-0.5 font-semibold"
                >
                  {INTEREST_LABELS[i]}
                </span>
              ))}
            </div>
          </Row>
        )}

        {submission.prayerRequest && (
          <Row icon={<HandsPraying size={15} color="var(--text-muted)" />} label="Prayer request">
            <span className="whitespace-pre-wrap">{submission.prayerRequest}</span>
          </Row>
        )}

        <div className="text-11 text-text-muted flex items-center gap-1">
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
    <div className="flex items-start gap-2.5">
      <div className="pt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-11 text-text-muted mb-0.5">{label}</p>
        <div className="text-14 text-text-primary leading-comfortable">{children}</div>
      </div>
    </div>
  );
}
