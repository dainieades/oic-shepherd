'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  X,
  Phone,
  Envelope,
  Megaphone,
  Heart,
  HandsPraying,
  Users,
  Globe,
  HandWaving,
  ArrowSquareOut,
  Plus,
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
      lifeStage: ['Family'],
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
      lifeStage: ['Student'],
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
      lifeStage: [],
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
      lifeStage: ['Young Professional'],
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
      lifeStage: [],
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
      lifeStage: ['Student'],
      languages: ['English', 'Korean'],
      referralSource: 'flyer',
      interests: ['salvation'],
      prayerRequest: 'I have been searching for truth for a long time and would love to learn more.',
    },
  ];
}

export default function PendingVisitorsPage() {
  const { promoteVisitorSubmission, discardVisitorSubmission } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [submissions, setSubmissions] = React.useState<VisitorSubmission[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmPromote, setConfirmPromote] = React.useState<VisitorSubmission | null>(null);
  const [confirmDiscard, setConfirmDiscard] = React.useState<VisitorSubmission | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const inFlightRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    void load();
  }, [load]);

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

  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 'var(--text-13)' : 'var(--text-14)';
  const btnPad = scrolled ? '0 0.75rem' : '0 0.875rem';

  const actionButtons = (
    <a
      href="/welcome"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xs bg-sage text-on-sage font-semibold border-none cursor-pointer inline-flex items-center gap-1 no-underline shrink-0"
      style={{
        height: btnSize,
        padding: btnPad,
        fontSize: btnFont,
        transition: 'height 0.25s ease, padding 0.25s ease, font-size 0.25s ease',
      }}
    >
      <Plus size={15} weight="bold" />
      Newcomer
    </a>
  );

  return (
    <PageContainer width="3xl">
    <div className="pb-8">
      {/* Sticky collapsing header */}
      <header
        className="-mx-4 px-4 lg:mx-0 lg:px-0 sticky top-0 bg-bg z-sticky"
        style={{
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            height: scrolled ? '2.75rem' : '4.125rem',
            transition: 'height 0.25s ease',
          }}
        >
          <span
            className="text-text-primary leading-none"
            style={{
              fontSize: scrolled ? 'var(--text-17)' : 'var(--text-32)',
              fontWeight: scrolled ? 'var(--font-semibold)' : 'var(--font-extrabold)',
              letterSpacing: scrolled ? 'var(--tracking-tight-1)' : 'var(--tracking-tight-3)',
              transition: 'font-size 0.25s ease, letter-spacing 0.25s ease',
            }}
          >
            Newcomers
          </span>
          {submissions !== null && submissions.length > 0 && actionButtons}
        </div>
      </header>

      {submissions !== null && submissions.length > 0 && (
        <p className="mb-3 text-13 text-text-muted">
          {submissions.length} card{submissions.length === 1 ? '' : 's'} awaiting review
        </p>
      )}

      {submissions === null ? (
        <p className="text-text-muted text-14">Loading…</p>
      ) : submissions.length === 0 ? (
        <div
          className="bg-surface rounded border border-border-light text-center text-text-muted text-14 py-10 px-5"
        >
          <HandWaving size={32} color="var(--text-muted)" className="block mx-auto mb-3" />
          <p className="mb-1">No newcomer cards pending.</p>
          <p className="text-12">
            New self-submissions from <code>/welcome</code> will appear here for review.
          </p>
          <a
            href="/welcome"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-md bg-sage text-on-sage text-15 font-semibold no-underline"
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
              onPromote={() => setConfirmPromote(sub)}
              onDiscard={() => setConfirmDiscard(sub)}
            />
          ))}
        </div>
      )}
    </div>
      {confirmPromote && (
        <ConfirmActionSheet
          title="Add to directory?"
          description={`${confirmPromote.preferredName}${
            confirmPromote.lastName ? ` ${confirmPromote.lastName}` : ''
          } will be added as a person in the directory and you'll be taken to their profile.`}
          confirmLabel="Add to directory"
          tone="neutral"
          onConfirm={() => {
            const sub = confirmPromote;
            setConfirmPromote(null);
            void handlePromote(sub);
          }}
          onCancel={() => setConfirmPromote(null)}
        />
      )}
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
      className="bg-surface rounded border border-border-light flex flex-col gap-2.5"
      style={{ padding: '1rem 1.125rem' }}
    >
      <div className="flex justify-between items-baseline">
        <h2 className="text-17 font-semibold text-text-primary">{name}</h2>
        <span className="text-11 text-text-muted">
          {submittedAt.toLocaleDateString()}{' '}
          {submittedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>

      <div
        className="flex-1 flex flex-col gap-1.5 text-13 text-text-secondary"
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
        {submission.lifeStage.length > 0 && (
          <Row icon={<Users size={13} color="var(--text-muted)" />}>
            {submission.lifeStage.join(', ')}
          </Row>
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
            <span className="whitespace-pre-wrap">{submission.prayerRequest}</span>
          </Row>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onPromote}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md border-none bg-sage text-on-sage text-14 font-semibold"
          style={{
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
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 border border-border bg-transparent text-text-muted text-14 font-medium rounded-md"
          style={{
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
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
