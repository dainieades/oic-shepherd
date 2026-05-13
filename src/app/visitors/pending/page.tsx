'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CaretLeft,
  CheckCircle,
  X,
  Phone,
  Envelope,
  Megaphone,
  Heart,
  HandsPraying,
  GraduationCap,
  Globe,
  HandWaving,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';
import { createClient } from '@/utils/supabase/client';
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

export default function PendingVisitorsPage() {
  const { currentPersona, promoteVisitorSubmission, discardVisitorSubmission } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [submissions, setSubmissions] = React.useState<VisitorSubmission[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const canAccess =
    currentPersona.role === 'admin' ||
    currentPersona.role === 'welcome-team' ||
    currentPersona.role === 'shepherd';

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('visitor_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });
    setSubmissions((data ?? []).map((row) => mapVisitorSubmission(row as Record<string, unknown>)));
  }, []);

  React.useEffect(() => {
    if (canAccess) void load();
  }, [canAccess, load]);

  if (!canAccess) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
        You don't have access to this page.
      </div>
    );
  }

  const handlePromote = async (sub: VisitorSubmission) => {
    setBusyId(sub.id);
    try {
      const personId = await promoteVisitorSubmission(sub.id);
      showToast('Visitor added to directory');
      router.push(`/person/${personId}`);
    } catch {
      showToast('Could not promote submission', 'error');
      setBusyId(null);
    }
  };

  const handleDiscard = async (sub: VisitorSubmission) => {
    if (!confirm(`Discard the card from ${sub.preferredName}? This cannot be undone.`)) return;
    setBusyId(sub.id);
    try {
      await discardVisitorSubmission(sub.id);
      setSubmissions((prev) => (prev ?? []).filter((s) => s.id !== sub.id));
      showToast('Submission discarded');
    } catch {
      showToast('Could not discard submission', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ paddingTop: 16, paddingBottom: 48 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <CaretLeft size={20} />
        </Link>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Pending visitors
        </h1>
      </header>

      {submissions === null ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      ) : submissions.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          padding: '2rem 1.25rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}>
          <HandWaving size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ marginBottom: 4 }}>No pending visitor cards.</p>
          <p style={{ fontSize: 12 }}>
            New self-submissions from <code>/welcome</code> will appear here for review.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {submissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              busy={busyId === sub.id}
              onPromote={() => handlePromote(sub)}
              onDiscard={() => handleDiscard(sub)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  busy,
  onPromote,
  onDiscard,
}: {
  submission: VisitorSubmission;
  busy: boolean;
  onPromote: () => void;
  onDiscard: () => void;
}) {
  const name = [submission.preferredName, submission.lastName].filter(Boolean).join(' ');
  const submittedAt = new Date(submission.submittedAt);

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-light)',
        padding: '1rem 1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</h2>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {submittedAt.toLocaleDateString()} {submittedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
        {submission.phone && (
          <Row icon={<Phone size={13} color="var(--text-muted)" />}>{submission.phone}</Row>
        )}
        {submission.email && (
          <Row icon={<Envelope size={13} color="var(--text-muted)" />}>{submission.email}</Row>
        )}
        {submission.languages.length > 0 && (
          <Row icon={<Globe size={13} color="var(--text-muted)" />}>{submission.languages.join(', ')}</Row>
        )}
        {submission.isStudent && (
          <Row icon={<GraduationCap size={13} color="var(--text-muted)" />}>Student</Row>
        )}
        {submission.referralSource && (
          <Row icon={<Megaphone size={13} color="var(--text-muted)" />}>
            {REFERRAL_LABELS[submission.referralSource]}
            {submission.referralDetail ? ` — ${submission.referralDetail}` : ''}
          </Row>
        )}
        {submission.interests.length > 0 && (
          <Row icon={<Heart size={13} color="var(--text-muted)" />}>
            {submission.interests.map((i) => INTEREST_LABELS[i]).join(', ')}
          </Row>
        )}
        {submission.prayerRequest && (
          <Row icon={<HandsPraying size={13} color="var(--text-muted)" />}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{submission.prayerRequest}</span>
          </Row>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onPromote}
          disabled={busy}
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--sage)',
            color: 'var(--on-sage)',
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <CheckCircle size={15} weight="bold" />
          Add to directory
        </button>
        <button
          onClick={onDiscard}
          disabled={busy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 500,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          <X size={14} />
          Discard
        </button>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div style={{ paddingTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
