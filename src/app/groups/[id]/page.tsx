'use client';

import React from 'react';
import { SectionLabel } from '@/components/SectionLabel';
import { AvatarBadge } from '@/components/AvatarBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getTimeAgo, fullName } from '@/lib/utils';
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
        <div className="text-text-muted pt-16 text-center">Group not found</div>
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
      <div className="pb-8">
        {/* ── Sticky nav bar ── */}
        <div className="bg-bg z-header sticky top-0 flex h-[54px] items-center justify-between">
          <button
            onClick={() => router.push('/groups')}
            className="text-13 text-sage inline-flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent"
          >
            <CaretLeft size={16} />
            Back
          </button>

          <span className="text-14 text-text-secondary flex-1 overflow-hidden px-2 text-center font-medium text-ellipsis whitespace-nowrap">
            {scrolled ? group.name : ''}
          </span>

          <button
            onClick={() => setShowEdit(true)}
            className="bg-sage text-on-sage flex shrink-0 cursor-pointer items-center rounded-xs border-none font-semibold whitespace-nowrap"
            style={{
              height: scrolled ? 30 : 36,
              padding: scrolled ? '0 0.625rem' : '0 0.75rem',
              gap: 5,
              fontSize: scrolled ? 'var(--text-13)' : 'var(--text-14)',
              transition: 'height 0.25s ease, padding 0.25s ease, font-size 0.25s ease',
            }}
          >
            <PencilSimpleIcon size={scrolled ? 13 : 15} weight="bold" />
            Edit
          </button>
        </div>

        {/* ── Group header card ── */}
        <div className="bg-surface border-border-light mb-3.5 rounded-lg border p-5">
          <div className="mb-2.5">
            <h1
              className="text-22 text-text-primary tracking-tight-2 font-bold"
              style={{ marginBottom: iAmLeader ? 4 : 0 }}
            >
              {group.name}
            </h1>
            {iAmLeader && (
              <span className="text-12 text-sage font-medium">You&apos;re a leader</span>
            )}
          </div>

          {/* Consistent chip row: always show all three */}
          <div
            className="flex flex-wrap gap-2"
            style={{ marginBottom: group.description ? 14 : 0 }}
          >
            <span
              className="text-11 rounded-pill bg-sage-light text-sage font-medium"
              style={{ padding: '0.1875rem 0.625rem' }}
            >
              {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
            </span>
            <span
              className="text-11 rounded-pill bg-blue-light text-blue inline-flex items-center gap-1 font-medium"
              style={{ padding: '0.1875rem 0.625rem' }}
            >
              <Crown size={11} />
              {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
            </span>
          </div>

          {group.description && (
            <p
              className="text-13 text-text-secondary mt-3.5 pl-3 leading-loose"
              style={{ borderLeft: '0.125rem solid var(--sage-mid)' }}
            >
              {group.description}
            </p>
          )}
        </div>

        {/* ── Leaders ── */}
        {leaders.length > 0 && (
          <div className="mb-3.5">
            <SectionLabel>Leaders</SectionLabel>
            <div className="no-last-border bg-surface border-border-light overflow-hidden rounded border">
              {leaders.map((leader, i) => {
                const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                return (
                  <Link
                    key={leader.id}
                    href={`/person/${leader.id}?from=/groups/${id}`}
                    className="row-card-hover border-border-light flex items-center gap-3 border-b py-3 no-underline"
                  >
                    <AvatarBadge
                      name={fullName(leader)}
                      photo={leader.photo}
                      size={40}
                      bg={palette.bg}
                      color={palette.color}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-14 text-text-primary font-semibold">
                          {fullName(leader)}
                        </span>
                        {leader.alternativeName && (
                          <span className="text-11 text-text-muted">{leader.alternativeName}</span>
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
            <p className="text-13 text-text-muted italic">
              No members yet. Tap Edit to add members.
            </p>
          ) : (
            <div className="no-last-border bg-surface border-border-light overflow-hidden rounded border">
              {members.map((m, i) => {
                const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];

                return (
                  <Link
                    key={m.id}
                    href={`/person/${m.id}?from=/groups/${id}`}
                    className="row-card-hover border-border-light flex items-center gap-3 border-b py-3 no-underline"
                  >
                    <AvatarBadge
                      name={fullName(m)}
                      photo={m.photo}
                      size={40}
                      bg={palette.bg}
                      color={palette.color}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-14 text-text-primary font-semibold">
                          {fullName(m)}
                        </span>
                        {m.alternativeName && (
                          <span className="text-11 text-text-muted">{m.alternativeName}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {m.lastContactDate && (
                          <span className="text-12 text-text-muted">
                            &nbsp;· {getTimeAgo(m.lastContactDate)}
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
