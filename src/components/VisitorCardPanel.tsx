'use client';

import React from 'react';
import { Megaphone, Heart, HandsPraying, Sparkle } from '@phosphor-icons/react';
import { createClient } from '@/utils/supabase/client';
import {
  VisitorSubmissionRowSchema,
  type VisitorSubmissionRow,
} from '@/lib/schemas';
import { mapVisitorSubmission } from '@/lib/mappers';
import { type VisitorSubmission, type Interest, type ReferralSource } from '@/lib/types';

const REFERRAL_LABELS: Record<ReferralSource, string> = {
  'flyer': 'Flyer',
  'online': 'Online',
  'drive-by': 'Drive-by',
  'school': 'School',
  'friend': 'Friend',
  'other': 'Other',
};

const INTEREST_LABELS: Record<Interest, string> = {
  'salvation': 'Salvation',
  'growth': 'Growth in Christ',
  'serving': 'Serving',
  'small-groups': 'Small Groups',
};

export function VisitorCardPanel({ personId }: { personId: string }) {
  const [submission, setSubmission] = React.useState<VisitorSubmission | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('visitor_submissions')
        .select('*')
        .eq('person_id', personId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn('VisitorCardPanel: query failed', error);
        setSubmission(null);
        return;
      }
      if (!data) {
        setSubmission(null);
        return;
      }
      try {
        const parsed = VisitorSubmissionRowSchema.parse(data) as VisitorSubmissionRow;
        setSubmission(mapVisitorSubmission(parsed));
      } catch (parseError) {
        console.warn('VisitorCardPanel: parse failed', parseError);
        setSubmission(null);
      }
    })();
    return () => { cancelled = true; };
  }, [personId]);

  if (!submission) return null;

  const referralLabel = submission.referralSource
    ? REFERRAL_LABELS[submission.referralSource] +
      (submission.referralDetail ? ` — ${submission.referralDetail}` : '')
    : null;

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        Visitor card
      </p>
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

        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Sparkle size={11} />
          {submission.source === 'qr' ? 'Self-submitted via public form' : 'Filled by Welcome Team'}
          {' · '}
          {new Date(submission.submittedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ paddingTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>{children}</div>
      </div>
    </div>
  );
}
