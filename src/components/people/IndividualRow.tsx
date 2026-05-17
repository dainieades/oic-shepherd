'use client';

import React from 'react';
import Link from 'next/link';
import { differenceInCalendarDays } from 'date-fns';
import { HandHeart } from '@phosphor-icons/react';
import { AvatarBadge } from '@/components/AvatarBadge';
import { StatusBadge } from '@/components/StatusBadge';
import LogStatusTag from '@/components/people/LogStatusTag';
import { fullName, getMembershipLabel, getChurchAttendanceLabel } from '@/lib/utils';
import type { Group, Person } from '@/lib/types';

interface IndividualRowProps {
  person: Person;
  lastNoteTs: number | null;
  group: Group | null;
}

const IndividualRow = React.memo(function IndividualRow({
  person,
  lastNoteTs,
  group,
}: IndividualRowProps) {
  const daysSinceNote =
    lastNoteTs !== null ? differenceInCalendarDays(new Date(), new Date(lastNoteTs)) : null;

  return (
    <Link
      href={`/person/${person.id}`}
      className="row-hover"
      style={{ borderBottom: '1px solid var(--border-light)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.625rem 0' }}>
        <AvatarBadge name={fullName(person)} photo={person.photo} size={44} />

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
              {person.isShepherd && (
                <HandHeart size={14} color="var(--sage)" style={{ flexShrink: 0 }} />
              )}
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
                {fullName(person)}
              </span>
              {person.alternativeName && (
                <span
                  style={{
                    fontSize: 'var(--text-12)',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {person.alternativeName}
                </span>
              )}
            </div>
            <LogStatusTag daysSince={daysSinceNote} lastNoteTs={lastNoteTs} />
          </div>

          <div style={{ lineHeight: 'var(--leading-normal)' }}>
            {person.assignedShepherdIds.length === 0 && (
              <>
                <StatusBadge
                  label="No shepherd"
                  bg="var(--amber-light)"
                  color="var(--amber)"
                  border="1px solid var(--amber-border)"
                />{' '}
              </>
            )}
            <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>
              {person.assignedShepherdIds.length === 0 && '· '}
              {getMembershipLabel(person.membershipStatus)} ·{' '}
              {getChurchAttendanceLabel(person.churchAttendance)}
            </span>
            {group &&
              (() => {
                const extra = person.groupIds.length - 1;
                return (
                  <>
                    {' '}
                    <span style={{ fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>·</span>{' '}
                    <span
                      style={{
                        fontSize: 'var(--text-10)',
                        padding: '0.125rem 0.4375rem',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--blue-light)',
                        color: 'var(--blue)',
                        fontWeight: 'var(--font-semibold)',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                    >
                      {group.name}
                    </span>
                    {extra > 0 && (
                      <>
                        {' '}
                        <span
                          style={{
                            fontSize: 'var(--text-10)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-pill)',
                            background: 'var(--blue-light)',
                            color: 'var(--blue)',
                            fontWeight: 'var(--font-semibold)',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                        >
                          +{extra}
                        </span>
                      </>
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

export default IndividualRow;
