'use client';

import Link from 'next/link';
import { useApp } from '@/lib/context';
import { getMembershipLabel } from '@/lib/utils';

const avatarPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(30,26,24,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxWidth: 430,
          maxHeight: 'calc(100dvh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            margin: '14px auto 0',
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px 12px',
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
              padding: '0 8px',
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
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 8px', background: 'var(--bg)' }}
        >
          {/* Stats + description */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              padding: '14px 16px',
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
                  padding: '3px 10px',
                  borderRadius: '999px',
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
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: '#EBF1F7',
                  color: '#6B8EAE',
                }}
              >
                {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: '#EAF2EE',
                  color: '#5B8A72',
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
                  borderLeft: '2px solid var(--sage-mid)',
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
                  const palette = avatarPalette[i % avatarPalette.length];
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
                        padding: '10px 16px',
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
                                padding: '1px 6px',
                                borderRadius: '999px',
                                background: '#EAF2EE',
                                color: '#5B8A72',
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
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#EAF2EE',
                          color: '#5B8A72',
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
                  const palette = avatarPalette[i % avatarPalette.length];
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
                        padding: '10px 16px',
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
      </div>
    </div>
  );
}
