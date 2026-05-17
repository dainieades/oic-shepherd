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
      className="group-side-preview"
      aria-label={`${group.name} preview`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100dvh',
        width: '26rem',
        maxWidth: '90vw',
        background: 'var(--bg)',
        borderLeft: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-elevated)',
        zIndex: 'var(--z-page)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slide-in-right 0.22s cubic-bezier(0.34, 1.2, 0.64, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--surface)',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={16} weight="bold" />
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => {
              onClose();
              router.push(expandPath);
            }}
            aria-label="Open full page"
            title="Open full page"
            style={{
              height: 32,
              padding: '0 0.75rem',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--sage-light)',
              color: 'var(--sage)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 'var(--text-13)',
              fontWeight: 'var(--font-semibold)',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowsOutSimple size={15} weight="bold" />
            Expand
          </button>
          <button
            onClick={() => setShowEdit(true)}
            aria-label="Edit group"
            style={{
              height: 32,
              padding: '0 0.75rem',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 'var(--text-13)',
              fontWeight: 'var(--font-semibold)',
              whiteSpace: 'nowrap',
            }}
          >
            <PencilSimpleIcon size={13} weight="bold" />
            Edit
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1rem 1.5rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
            padding: '0.875rem 1rem',
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontSize: 'var(--text-18)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight-1)',
              margin: '0 0 10px',
            }}
          >
            {group.name}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 'var(--text-11)',
                fontWeight: 'var(--font-medium)',
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
                fontSize: 'var(--text-11)',
                fontWeight: 'var(--font-medium)',
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
                fontSize: 'var(--text-13)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-loose)',
                paddingLeft: 12,
                borderLeft: '0.125rem solid var(--sage-mid)',
                margin: '12px 0 0',
              }}
            >
              {group.description}
            </p>
          )}
        </div>

        {leaders.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 'var(--text-10)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide-6)',
                margin: '0 0 8px',
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
                return (
                  <Link
                    key={leader.id}
                    href={`/person/${leader.id}${personFrom}`}
                    className="row-card-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0.625rem 1rem',
                      borderBottom: '1px solid var(--border-light)',
                      textDecoration: 'none',
                    }}
                  >
                    <AvatarBadge
                      name={fullName(leader)}
                      photo={leader.photo}
                      size={36}
                      bg={palette.bg}
                      color={palette.color}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 'var(--text-14)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {fullName(leader)}
                      </p>
                      <p style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)', margin: 0 }}>
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
            <p
              style={{
                fontSize: 'var(--text-10)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide-6)',
                margin: '0 0 8px',
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
                return (
                  <Link
                    key={m.id}
                    href={`/person/${m.id}${personFrom}`}
                    className="row-card-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0.625rem 1rem',
                      borderBottom: '1px solid var(--border-light)',
                      textDecoration: 'none',
                    }}
                  >
                    <AvatarBadge
                      name={fullName(m)}
                      photo={m.photo}
                      size={36}
                      bg={palette.bg}
                      color={palette.color}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 'var(--text-14)',
                          fontWeight: 'var(--font-medium)',
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {fullName(m)}
                      </p>
                      {m.alternativeName && (
                        <p style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)', margin: 0 }}>
                          {m.alternativeName}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No members yet.
          </p>
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
