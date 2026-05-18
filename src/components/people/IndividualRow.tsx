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
      className="row-hover border-b border-border-light"
    >
      <div className="flex items-center gap-3 py-2.5">
        <AvatarBadge name={fullName(person)} photo={person.photo} size={44} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-[3px]">
            <div className="flex items-center gap-[5px] min-w-0 overflow-hidden">
              {person.isShepherd && (
                <HandHeart size={14} color="var(--sage)" className="shrink-0" />
              )}
              <span className="text-15 font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis shrink">
                {fullName(person)}
              </span>
              {person.alternativeName && (
                <span className="text-12 text-text-muted shrink-0 whitespace-nowrap">
                  {person.alternativeName}
                </span>
              )}
            </div>
            <LogStatusTag daysSince={daysSinceNote} lastNoteTs={lastNoteTs} />
          </div>

          <div className="leading-normal">
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
            <span className="text-12 text-text-muted">
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
                    <span className="text-12 text-text-muted">·</span>{' '}
                    <span className="text-10 rounded-pill bg-blue-light text-blue font-semibold inline-block align-middle py-[0.125rem] px-[0.4375rem]">
                      {group.name}
                    </span>
                    {extra > 0 && (
                      <>
                        {' '}
                        <span className="text-10 rounded-pill bg-blue-light text-blue font-semibold inline-block align-middle py-[0.125rem] px-[0.375rem]">
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
