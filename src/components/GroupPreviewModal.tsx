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
      <div className="flex items-center justify-between py-3 shrink-0 border-b border-border-light" style={{ padding: '0.75rem 1.25rem' }}>
        <button
          onClick={onClose}
          className="text-14 text-text-secondary bg-transparent border-none cursor-pointer p-0"
        >
          Close
        </button>
        <span className="text-15 font-semibold text-text-primary flex-1 text-center overflow-hidden text-ellipsis whitespace-nowrap px-2">
          {group.name}
        </span>
        <Link
          href={`/groups/${group.id}`}
          onClick={onClose}
          className="text-13 text-sage no-underline whitespace-nowrap shrink-0"
        >
          View full group
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-bg" style={{ padding: '1rem 1.25rem 0.5rem' }}>
        {/* Stats + description */}
        <div
          className="bg-surface rounded border border-border-light"
          style={{ padding: '0.875rem 1rem', marginBottom: 14 }}
        >
          <div
            className="flex gap-2 flex-wrap"
            style={{ marginBottom: group.description ? 12 : 0 }}
          >
            <span
              className="text-11 font-medium rounded-pill bg-sage-light text-sage"
              style={{ padding: '0.1875rem 0.625rem' }}
            >
              {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
            </span>
            <span
              className="text-11 font-medium rounded-pill bg-blue-light text-blue"
              style={{ padding: '0.1875rem 0.625rem' }}
            >
              {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
            </span>
          </div>
          {group.description && (
            <p
              className="text-13 text-text-secondary leading-loose m-0 pl-3"
              style={{ borderLeft: '0.125rem solid var(--sage-mid)' }}
            >
              {group.description}
            </p>
          )}
        </div>

        {/* Leaders */}
        {leaders.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
              Leaders
            </p>
            <div
              className="no-last-border bg-surface rounded border border-border-light overflow-hidden"
            >
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
                    className="flex items-center gap-3 border-b border-border-light"
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center text-12 font-semibold shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        background: palette.bg,
                        color: palette.color,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-14 font-semibold text-text-primary m-0">
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
            <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
              Members · {members.length}
            </p>
            <div
              className="no-last-border bg-surface rounded border border-border-light overflow-hidden"
            >
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
                    className="flex items-center gap-3 border-b border-border-light"
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center text-12 font-semibold shrink-0"
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
                      <p className="text-14 font-medium text-text-primary m-0">{fullName(m)}</p>
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
