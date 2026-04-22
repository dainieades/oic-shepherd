'use client';

import Link from 'next/link';
import { useApp } from '@/lib/context';
import { getMembershipLabel } from '@/lib/utils';
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
  const shepherds = data.people.filter(
    (p) => group.shepherdIds.includes(p.id) && !group.leaderIds.includes(p.id)
  );
  const members = data.people.filter(
    (p) =>
      group.memberIds.includes(p.id) &&
      !group.leaderIds.includes(p.id) &&
      !group.shepherdIds.includes(p.id)
  );

  return (
    <BottomSheet
      onClose={onClose}
      contentStyle={{ height: 'auto', maxHeight: 'calc(100dvh - 5rem)', paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
    >

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem 0.75rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Close
          </button>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              flex: 1,
              textAlign: 'center',
              padding: '0 0.5rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {group.name}
          </span>
          <Link
            href={`/groups/${group.id}`}
            onClick={onClose}
            style={{
              fontSize: 13,
              color: 'var(--sage)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            View full group
          </Link>
        </div>

        {/* Scrollable content */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem 0.5rem', background: 'var(--bg)' }}
        >
          {/* Stats + description */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              padding: '0.875rem 1rem',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: group.description ? 12 : 0,
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
                }}
              >
                {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '0.1875rem 0.625rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--avatar-s1-bg)',
                  color: 'var(--avatar-s1-text)',
                }}
              >
                {group.shepherdIds.length}{' '}
                {group.shepherdIds.length === 1 ? 'shepherd' : 'shepherds'}
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
                  margin: 0,
                }}
              >
                {group.description}
              </p>
            )}
          </div>

          {/* Leaders */}
          {leaders.length > 0 && (
            <div style={{ marginBottom: 14 }}>
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
                Leaders
              </p>
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
                  const initials = leader.englishName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const isAlsoShepherd = group.shepherdIds.includes(leader.id);
                  return (
                    <div
                      key={leader.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0.625rem 1rem',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: palette.bg,
                          color: palette.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                          }}
                        >
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              margin: 0,
                            }}
                          >
                            {leader.englishName}
                          </p>
                          {isAlsoShepherd && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '0.0625rem 0.375rem',
                                borderRadius: 'var(--radius-pill)',
                                background: 'var(--avatar-s1-bg)',
                                color: 'var(--avatar-s1-text)',
                              }}
                            >
                              Shepherd
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          {getMembershipLabel(leader.membershipStatus)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shepherds (not also leaders) */}
          {shepherds.length > 0 && (
            <div style={{ marginBottom: 14 }}>
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
                Shepherds
              </p>
              <div
                className="no-last-border"
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-light)',
                  overflow: 'hidden',
                }}
              >
                {shepherds.map((shepherd, _i) => {
                  const initials = shepherd.englishName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={shepherd.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0.625rem 1rem',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--avatar-s1-bg)',
                          color: 'var(--avatar-s1-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {shepherd.englishName}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          {getMembershipLabel(shepherd.membershipStatus)}
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
            <div style={{ marginBottom: 8 }}>
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
                Members · {members.length}
              </p>
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
                  const initials = m.englishName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0.625rem 1rem',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: palette.bg,
                          color: palette.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {m.englishName}
                        </p>
                        {m.chineseName && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                            {m.chineseName}
                          </p>
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
