'use client';

import Link from 'next/link';
import { useApp } from '@/lib/context';
import { getMembershipLabel, fullName } from '@/lib/utils';
import { BottomSheet } from './BottomSheet';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';

interface Props {
  groupId: string;
  onClose: () => void;
}

export default function GroupPreviewModal({ groupId, onClose }: Props) {
  const { data } = useApp();
  const group = data.groups.find((g) => g.id === groupId);
  if (!group) return null;

  const leaders = data.people.filter((p) => group.leaderIds.includes(p.id));
  const members = data.people.filter(
    (p) => group.memberIds.includes(p.id) && !group.leaderIds.includes(p.id)
  );

  return (
    <BottomSheet
      onClose={onClose}
      variant="dialog"
      allowBackdropClose
      contentStyle={{
        height: 'auto',
        maxHeight: 'calc(100dvh - 5rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 1rem)',
      }}
    >
      {/* Header */}
      <div
        className="border-border-light flex shrink-0 items-center justify-between border-b py-3"
        style={{ padding: '0.75rem 1.25rem' }}
      >
        <button
          onClick={onClose}
          className="text-14 text-text-secondary cursor-pointer border-none bg-transparent p-0"
        >
          Close
        </button>
        <span className="text-15 text-text-primary flex-1 overflow-hidden px-2 text-center font-semibold text-ellipsis whitespace-nowrap">
          {group.name}
        </span>
        <Link
          href={`/groups/${group.id}`}
          onClick={onClose}
          className="text-13 text-sage shrink-0 whitespace-nowrap no-underline"
        >
          View full group
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="bg-bg flex-1 overflow-y-auto" style={{ padding: '1rem 1.25rem 0.5rem' }}>
        {/* Stats + description */}
        <div
          className="bg-surface border-border-light rounded border"
          style={{ padding: '0.875rem 1rem', marginBottom: 14 }}
        >
          <div
            className="flex flex-wrap gap-2"
            style={{ marginBottom: group.description ? 12 : 0 }}
          >
            <span
              className="text-11 rounded-pill bg-sage-light text-sage font-medium"
              style={{ padding: '0.1875rem 0.625rem' }}
            >
              {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
            </span>
            <span
              className="text-11 rounded-pill bg-blue-light text-blue font-medium"
              style={{ padding: '0.1875rem 0.625rem' }}
            >
              {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
            </span>
          </div>
          {group.description && (
            <p
              className="text-13 text-text-secondary m-0 pl-3 leading-loose"
              style={{ borderLeft: '0.125rem solid var(--sage-mid)' }}
            >
              {group.description}
            </p>
          )}
        </div>

        {/* Leaders */}
        {leaders.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p className="text-10 text-text-muted tracking-wide-6 mb-2 font-semibold uppercase">
              Leaders
            </p>
            <div className="no-last-border bg-surface border-border-light overflow-hidden rounded border">
              {leaders.map((leader, i) => {
                const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                const initials = fullName(leader)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={leader.id}
                    className="border-border-light flex items-center gap-3 border-b"
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    <div
                      className="text-12 flex shrink-0 items-center justify-center rounded-full font-semibold"
                      style={{
                        width: 36,
                        height: 36,
                        background: palette.bg,
                        color: palette.color,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-14 text-text-primary m-0 font-semibold">
                          {fullName(leader)}
                        </p>
                      </div>
                      <p className="text-12 text-text-muted m-0">
                        {getMembershipLabel(leader.membershipStatus)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Members */}
        {members.length > 0 && (
          <div className="mb-2">
            <p className="text-10 text-text-muted tracking-wide-6 mb-2 font-semibold uppercase">
              Members · {members.length}
            </p>
            <div className="no-last-border bg-surface border-border-light overflow-hidden rounded border">
              {members.map((m, i) => {
                const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                const initials = fullName(m)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={m.id}
                    className="border-border-light flex items-center gap-3 border-b"
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    <div
                      className="text-12 flex shrink-0 items-center justify-center rounded-full font-semibold"
                      style={{
                        width: 36,
                        height: 36,
                        background: palette.bg,
                        color: palette.color,
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-14 text-text-primary m-0 font-medium">{fullName(m)}</p>
                      {m.alternativeName && (
                        <p className="text-12 text-text-muted m-0">{m.alternativeName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
