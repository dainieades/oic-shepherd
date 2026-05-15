'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
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
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/Toast';
import { createClient } from '@/utils/supabase/client';
import { mapVisitorSubmission } from '@/lib/mappers';
import { type VisitorSubmission, type Interest, type ReferralSource } from '@/lib/types';
import PageContainer from '@/components/PageContainer';
import ConfirmActionSheet from '@/components/ConfirmActionSheet';

const REFERRAL_LABELS: Record<ReferralSource, string> = {
  flyer: 'Flyer',
  online: 'Online',
  'drive-by': 'Drive-by',
  school: 'School',
  friend: 'Friend',
  other: 'Other',
};

const INTEREST_LABELS: Record<Interest, string> = {
  salvation: 'Salvation',
  growth: 'Growth in Christ',
  serving: 'Serving',
  'small-groups': 'Small Groups',
};

const MOCK_PREFIX = 'mock-';
const isMockId = (id: string) => id.startsWith(MOCK_PREFIX);

function buildMockSubmissions(): VisitorSubmission[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
  return [
    {
      id: `${MOCK_PREFIX}1`,
      submittedAt: hoursAgo(2),
      submittedBy: null,
      source: 'qr',
      status: 'pending',
      personId: null,
      preferredName: 'Maria',
      lastName: 'Garcia',
      phone: '+1-555-0142',
      email: 'maria.garcia@example.com',
      isStudent: false,
      languages: ['English', 'Spanish'],
      referralSource: 'friend',
      referralDetail: 'Invited by Sarah Williams',
      interests: ['salvation', 'small-groups'],
      prayerRequest: 'Please pray for my mother who is in the hospital.',
    },
    {
      id: `${MOCK_PREFIX}2`,
      submittedAt: hoursAgo(26),
      submittedBy: null,
      source: 'qr',
      status: 'pending',
      personId: null,
      preferredName: 'Jonathan',
      lastName: 'Chen',
      phone: '+1-555-0193',
      email: 'jchen.student@example.edu',
      isStudent: true,
      languages: ['English', 'Mandarin Chinese'],
      referralSource: 'school',
      interests: ['growth', 'small-groups'],
    },
    {
      id: `${MOCK_PREFIX}3`,
      submittedAt: hoursAgo(72),
      submittedBy: null,
      source: 'qr',
      status: 'pending',
      personId: null,
      preferredName: 'Lily',
      isStudent: false,
      languages: ['English'],
      referralSource: 'online',
      interests: [],
    },
    {
      id: `${MOCK_PREFIX}4`,
      submittedAt: hoursAgo(96),
      submittedBy: null,
      source: 'qr',
      status: 'pending',
      personId: null,
      preferredName: 'Emmanuel',
      lastName: 'Adeyemi',
      alternativeName: 'Manny',
      phone: '+1-555-0234',
      email: 'emmanuel.a@example.com',
      isStudent: false,
      languages: ['English', 'French', 'Yoruba'],
      referralSource: 'other',
      referralDetail: 'Moved to the area last month',
      interests: ['serving', 'growth'],
      prayerRequest: 'Praying for a new job and for my family back home.',
    },
    {
      id: `${MOCK_PREFIX}5`,
      submittedAt: hoursAgo(144),
      submittedBy: null,
      source: 'qr',
      status: 'pending',
      personId: null,
      preferredName: 'Sarah',
      lastName: 'Williams',
      phone: '+1-555-0387',
      isStudent: false,
      languages: ['English'],
      referralSource: 'drive-by',
      interests: [],
    },
    {
      id: `${MOCK_PREFIX}6`,
      submittedAt: hoursAgo(192),
      submittedBy: null,
      source: 'qr',
      status: 'pending',
      personId: null,
      preferredName: 'David',
      lastName: 'Park',
      email: 'dpark@example.com',
      isStudent: true,
      languages: ['English', 'Korean'],
      referralSource: 'flyer',
      interests: ['salvation'],
      prayerRequest: 'I have been searching for truth for a long time and would love to learn more.',
    },
  ];
}

export default function PendingVisitorsPage() {
  const { currentPersona, promoteVisitorSubmission, discardVisitorSubmission } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [submissions, setSubmissions] = React.useState<VisitorSubmission[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = React.useState<VisitorSubmission | null>(null);
  const inFlightRef = React.useRef<Set<string>>(new Set());

  const canAccess =
    currentPersona.role === 'admin' || currentPersona.canTriageVisitors === true;

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('visitor_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });
    const rows = (data ?? []).map((row) =>
      mapVisitorSubmission(row as Record<string, unknown>)
    );
    if (process.env.NODE_ENV !== 'production' && rows.length === 0) {
      setSubmissions(buildMockSubmissions());
    } else {
      setSubmissions(rows);
    }
  }, []);

  React.useEffect(() => {
    if (canAccess) void load();
  }, [canAccess, load]);

  if (!canAccess) {
    return (
      <PageContainer width="2xl">
        <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
          You don't have access to this page.
        </div>
      </PageContainer>
    );
  }

  const handlePromote = async (sub: VisitorSubmission) => {
    if (inFlightRef.current.has(sub.id)) return;
    inFlightRef.current.add(sub.id);
    if (isMockId(sub.id)) {
      setSubmissions((prev) => (prev ?? []).filter((s) => s.id !== sub.id));
      showToast('Mock submission — not saved to DB');
      inFlightRef.current.delete(sub.id);
      return;
    }
    setBusyId(sub.id);
    try {
      const personId = await promoteVisitorSubmission(sub.id);
      showToast('Newcomer added to directory');
      router.push(`/person/${personId}?tab=todos`);
    } catch {
      showToast('Could not promote submission', 'error');
      setBusyId(null);
      inFlightRef.current.delete(sub.id);
    }
  };

  const handleDiscard = async (sub: VisitorSubmission) => {
    if (inFlightRef.current.has(sub.id)) return;
    inFlightRef.current.add(sub.id);
    if (isMockId(sub.id)) {
      setSubmissions((prev) => (prev ?? []).filter((s) => s.id !== sub.id));
      showToast('Mock submission discarded');
      inFlightRef.current.delete(sub.id);
      return;
    }
    setBusyId(sub.id);
    try {
      await discardVisitorSubmission(sub.id);
      setSubmissions((prev) => (prev ?? []).filter((s) => s.id !== sub.id));
      showToast('Submission discarded');
    } catch {
      showToast('Could not discard submission', 'error');
    } finally {
      setBusyId(null);
      inFlightRef.current.delete(sub.id);
    }
  };

  return (
    <PageContainer width="3xl">
      <div style={{ paddingTop: 20, paddingBottom: 48 }}>
        <header style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            Newcomers
          </h1>
          {submissions && submissions.length > 0 && (
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              {submissions.length} card{submissions.length === 1 ? '' : 's'} awaiting review
            </p>
          )}
        </header>

        {submissions === null ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
        ) : submissions.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              padding: '2.5rem 1.25rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <HandWaving size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ marginBottom: 4 }}>No newcomer cards pending.</p>
            <p style={{ fontSize: 12 }}>
              New self-submissions from <code>/welcome</code> will appear here for review.
            </p>
            <a
              href="/welcome"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open welcome form
              <ArrowSquareOut size={16} weight="bold" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                busy={busyId === sub.id}
                onPromote={() => handlePromote(sub)}
                onDiscard={() => setConfirmDiscard(sub)}
              />
            ))}
          </div>
        )}
      </div>
      {confirmDiscard && (
        <ConfirmActionSheet
          title="Discard newcomer card?"
          description={`The card from ${confirmDiscard.preferredName}${
            confirmDiscard.lastName ? ` ${confirmDiscard.lastName}` : ''
          } will be permanently removed. This cannot be undone.`}
          confirmLabel="Discard"
          tone="danger"
          onConfirm={() => {
            const sub = confirmDiscard;
            setConfirmDiscard(null);
            void handleDiscard(sub);
          }}
          onCancel={() => setConfirmDiscard(null)}
        />
      )}
    </PageContainer>
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
          {submittedAt.toLocaleDateString()}{' '}
          {submittedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        {submission.phone && (
          <Row icon={<Phone size={13} color="var(--text-muted)" />}>{submission.phone}</Row>
        )}
        {submission.email && (
          <Row icon={<Envelope size={13} color="var(--text-muted)" />}>{submission.email}</Row>
        )}
        {submission.languages.length > 0 && (
          <Row icon={<Globe size={13} color="var(--text-muted)" />}>
            {submission.languages.join(', ')}
          </Row>
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
