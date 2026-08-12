'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowsOutSimple, Crown, PencilSimpleIcon, X } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { fullName, getMembershipLabel } from '@/lib/utils';
import { AvatarBadge } from '@/components/AvatarBadge';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';
import EditGroupDrawer from '@/components/EditGroupDrawer';

interface Props {
  groupId: string;
  onClose: () => void;
}

export default function GroupSidePreview({ groupId, onClose }: Props) {
  const router = useRouter();
  const { data, updateGroup, updateGroupMembers } = useApp();
  const group = data.groups.find((g) => g.id === groupId);

  const [showEdit, setShowEdit] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showEdit) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showEdit]);

  if (!group) return null;

  const leaders = data.people.filter((p) => group.leaderIds.includes(p.id));
  const members = data.people.filter(
    (p) => group.memberIds.includes(p.id) && !group.leaderIds.includes(p.id)
  );

  const expandPath = `/groups/${group.id}`;
  const personFrom = `?from=/groups`;

  return (
    <>
      <aside
        className="group-side-preview bg-bg border-border-light z-page fixed top-0 right-0 flex h-dvh w-[26rem] max-w-[90vw] flex-col border-l shadow-[var(--shadow-elevated)]"
        aria-label={`${group.name} preview`}
        style={{
          animation: 'slide-in-right 0.22s cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      >
        <div className="border-border-light bg-surface flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="text-text-secondary inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xs border-none bg-transparent"
          >
            <X size={16} weight="bold" />
          </button>

          <div className="inline-flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                router.push(expandPath);
              }}
              aria-label="Open full page"
              title="Open full page"
              className="bg-sage-light text-sage text-13 inline-flex h-8 cursor-pointer items-center gap-[5px] rounded-xs border-none px-3 font-semibold whitespace-nowrap"
            >
              <ArrowsOutSimple size={15} weight="bold" />
              Expand
            </button>
            <button
              onClick={() => setShowEdit(true)}
              aria-label="Edit group"
              className="bg-sage text-on-sage text-13 inline-flex h-8 cursor-pointer items-center gap-[5px] rounded-xs border-none px-3 font-semibold whitespace-nowrap"
            >
              <PencilSimpleIcon size={13} weight="bold" />
              Edit
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-6">
          <div className="bg-surface border-border-light mb-3.5 rounded border p-3.5">
            <h2 className="text-18 text-text-primary tracking-tight-1 m-0 mb-2.5 font-bold">
              {group.name}
            </h2>
            <div className="flex flex-wrap gap-2">
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
                className="text-13 text-text-secondary mt-3 pl-3 leading-loose"
                style={{ borderLeft: '0.125rem solid var(--sage-mid)', margin: '12px 0 0' }}
              >
                {group.description}
              </p>
            )}
          </div>

          {leaders.length > 0 && (
            <div className="mb-3.5">
              <p className="text-10 text-text-muted tracking-wide-6 m-0 mb-2 font-semibold uppercase">
                Leaders
              </p>
              <div className="no-last-border bg-surface border-border-light overflow-hidden rounded border">
                {leaders.map((leader, i) => {
                  const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                  return (
                    <Link
                      key={leader.id}
                      href={`/person/${leader.id}${personFrom}`}
                      className="row-card-hover border-border-light flex items-center gap-3 border-b px-4 py-2.5 no-underline"
                    >
                      <AvatarBadge
                        name={fullName(leader)}
                        photo={leader.photo}
                        size={36}
                        bg={palette.bg}
                        color={palette.color}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-14 text-text-primary m-0 font-semibold">
                          {fullName(leader)}
                        </p>
                        <p className="text-12 text-text-muted m-0">
                          {getMembershipLabel(leader.membershipStatus)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {members.length > 0 ? (
            <div>
              <p className="text-10 text-text-muted tracking-wide-6 m-0 mb-2 font-semibold uppercase">
                Members · {members.length}
              </p>
              <div className="no-last-border bg-surface border-border-light overflow-hidden rounded border">
                {members.map((m, i) => {
                  const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                  return (
                    <Link
                      key={m.id}
                      href={`/person/${m.id}${personFrom}`}
                      className="row-card-hover border-border-light flex items-center gap-3 border-b px-4 py-2.5 no-underline"
                    >
                      <AvatarBadge
                        name={fullName(m)}
                        photo={m.photo}
                        size={36}
                        bg={palette.bg}
                        color={palette.color}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-14 text-text-primary m-0 font-medium">{fullName(m)}</p>
                        {m.alternativeName && (
                          <p className="text-12 text-text-muted m-0">{m.alternativeName}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-13 text-text-muted italic">No members yet.</p>
          )}
        </div>
      </aside>
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
    </>
  );
}
