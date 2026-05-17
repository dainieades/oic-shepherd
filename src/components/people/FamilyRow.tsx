'use client';

import React from 'react';
import Link from 'next/link';
import { differenceInCalendarDays } from 'date-fns';
import { HandHeart, House } from '@phosphor-icons/react';
import { AvatarBadge } from '@/components/AvatarBadge';
import { StatusBadge } from '@/components/StatusBadge';
import LogStatusTag from '@/components/people/LogStatusTag';
import type { Family, Group, Person } from '@/lib/types';

interface FamilyRowProps {
  family: Family;
  members: Person[];
  lastNoteTs: number | null;
  group: Group | null;
}

const FamilyRow = React.memo(function FamilyRow({
  family,
  members,
  lastNoteTs,
  group,
}: FamilyRowProps) {
  const daysSinceNote =
    lastNoteTs !== null ? differenceInCalendarDays(new Date(), new Date(lastNoteTs)) : null;

  return (
    <Link
      href={`/family/${family.id}`}
      className="row-hover"
      style={{ borderBottom: '1px solid var(--border-light)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.625rem 0' }}>
        <AvatarBadge
          name={family.label}
          photo={family.photo}
          size={44}
          bg="var(--sage)"
          color="var(--sage-light)"
          icon={<House size={22} color="var(--sage-light)" />}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-15)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 1,
                }}
              >
                {family.label}
              </span>
            </div>
            <LogStatusTag daysSince={daysSinceNote} lastNoteTs={lastNoteTs} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {members.every((m) => m.assignedShepherdIds.length === 0) && (
                <>
                  <StatusBadge
                    label="No shepherd"
                    bg="var(--amber-light)"
                    color="var(--amber)"
                    border="1px solid var(--amber-border)"
                  />
                  <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>·</span>
                </>
              )}
            </span>
            {members.map((m, i) => (
              <span
                key={m.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 'var(--text-12)',
                  color: 'var(--text-muted)',
                }}
              >
                {i > 0 && <span>,&nbsp;</span>}
                {m.isShepherd && (
                  <HandHeart size={11} color="var(--sage)" style={{ flexShrink: 0 }} />
                )}
                {m.preferredName}
              </span>
            ))}
            {family.childCount && family.childCount > 0 ? (
              <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>
                , +{family.childCount} kid{family.childCount !== 1 ? 's' : ''}
              </span>
            ) : null}
            {group &&
              (() => {
                const allGroupIds = [...new Set(members.flatMap((m) => m.groupIds))];
                const extra = allGroupIds.length - 1;
                return (
                  <>
                    <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>·</span>
                    <span
                      style={{
                        fontSize: 'var(--text-10)',
                        padding: '0.125rem 0.4375rem',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--blue-light)',
                        color: 'var(--blue)',
                        fontWeight: 'var(--font-semibold)',
                        flexShrink: 0,
                      }}
                    >
                      {group.name}
                    </span>
                    {extra > 0 && (
                      <span
                        style={{
                          fontSize: 'var(--text-10)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--blue-light)',
                          color: 'var(--blue)',
                          fontWeight: 'var(--font-semibold)',
                          flexShrink: 0,
                        }}
                      >
                        +{extra}
                      </span>
                    )}
                  </>
                );
              })()}
          </div>
        </div>
      </div>
    </Link>
  );
});

export default FamilyRow;
