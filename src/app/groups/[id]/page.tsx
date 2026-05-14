'use client';

import React from 'react';
import { SectionLabel } from '@/components/SectionLabel';
import { AvatarBadge } from '@/components/AvatarBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getTimeAgo, getDueLabel, fullName } from '@/lib/utils';
import { PencilSimpleIcon, CaretRight, Crown, CaretLeft } from '@phosphor-icons/react';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';
import PageContainer from '@/components/PageContainer';
import EditGroupDrawer from '@/components/EditGroupDrawer';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data, currentPersona, updateGroup, updateGroupMembers } = useApp();

  const [scrolled, setScrolled] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const group = data.groups.find((g) => g.id === id);
  if (!group) {
    return (
      <PageContainer width="3xl">
        <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
          Group not found
        </div>
      </PageContainer>
    );
  }

  const myPersonId = currentPersona.personId;
  const iAmLeader = myPersonId ? group.leaderIds.includes(myPersonId) : false;

  const leaders = data.people.filter((p) => group.leaderIds.includes(p.id));
  const members = data.people.filter(
    (p) => group.memberIds.includes(p.id) && !group.leaderIds.includes(p.id)
  );

  return (
    <PageContainer width="3xl">
    <div style={{ paddingBottom: 32 }}>
      {/* ── Sticky nav bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-header)',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 54,
        }}
      >
        <button
          onClick={() => router.push('/groups')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            color: 'var(--sage)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <CaretLeft size={16} />
          Back
        </button>

        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            flex: 1,
            textAlign: 'center',
            padding: '0 0.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {scrolled ? group.name : ''}
        </span>

        <button
          onClick={() => setShowEdit(true)}
          style={{
            height: scrolled ? 30 : 36,
            padding: scrolled ? '0 0.625rem' : '0 0.75rem',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--sage)',
            color: 'var(--on-sage)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: scrolled ? 13 : 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <PencilSimpleIcon size={scrolled ? 13 : 15} weight="bold" />
          Edit
        </button>
      </div>

      {/* ── Group header card ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '1.25rem',
          marginBottom: 14,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: iAmLeader ? 4 : 0,
            }}
          >
            {group.name}
          </h1>
          {iAmLeader && (
            <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
              You&apos;re a leader
            </span>
          )}
        </div>

        {/* Consistent chip row: always show all three */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: group.description ? 14 : 0,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '0.1875rem 0.625rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--sage-light)',
              color: 'var(--sage)',
            }}
          >
            {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '0.1875rem 0.625rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--blue-light)',
              color: 'var(--blue)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={11} />
            {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
          </span>
        </div>

        {group.description && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              paddingLeft: 12,
              borderLeft: '0.125rem solid var(--sage-mid)',
              marginTop: 14,
            }}
          >
            {group.description}
          </p>
        )}
      </div>

      {/* ── Leaders ── */}
      {leaders.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Leaders</SectionLabel>
          <div
            className="no-last-border"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
            }}
          >
            {leaders.map((leader, i) => {
              const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
              return (
                <Link
                  key={leader.id}
                  href={`/person/${leader.id}?from=/groups/${id}`}
                  className="row-card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border-light)',
                    textDecoration: 'none',
                  }}
                >
                  <AvatarBadge
                    name={fullName(leader)}
                    photo={leader.photo}
                    size={40}
                    bg={palette.bg}
                    color={palette.color}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fullName(leader)}
                      </span>
                      {leader.alternativeName && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {leader.alternativeName}
                        </span>
                      )}
                    </div>
                  </div>
                  <CaretRight size={14} color="var(--text-muted)" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      <div>
        <SectionLabel>Group members · {members.length}</SectionLabel>
        {members.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No members yet. Tap Edit to add members.
          </p>
        ) : (
          <div
            className="no-last-border"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
            }}
          >
            {members.map((m, i) => {
              const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
              const due = getDueLabel(m.nextFollowUpDate);

              return (
                <Link
                  key={m.id}
                  href={`/person/${m.id}?from=/groups/${id}`}
                  className="row-card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border-light)',
                    textDecoration: 'none',
                  }}
                >
                  <AvatarBadge
                    name={fullName(m)}
                    photo={m.photo}
                    size={40}
                    bg={palette.bg}
                    color={palette.color}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fullName(m)}
                      </span>
                      {m.alternativeName && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {m.alternativeName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {m.lastContactDate && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          &nbsp;· {getTimeAgo(m.lastContactDate)}
                        </span>
                      )}
                      {due.status !== 'ok' && due.status !== 'none' && (
                        <span
                          style={{
                            fontSize: 12,
                            color: due.status === 'overdue' ? 'var(--red)' : 'var(--amber)',
                            fontWeight: 500,
                          }}
                        >
                          &nbsp;· {due.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <CaretRight size={14} color="var(--text-muted)" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Drawer ── */}
      {showEdit && (
        <EditGroupDrawer
          group={group}
          onClose={() => setShowEdit(false)}
          onSave={(updates, newMemberIds) => {
            updateGroup(group.id, updates);
            updateGroupMembers(group.id, newMemberIds);
            setShowEdit(false);
          }}
        />
      )}
    </div>
    </PageContainer>
  );
}
