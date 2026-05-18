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
      className="row-hover border-b border-border-light"
    >
      <div className="flex items-center gap-3 py-2.5">
        <AvatarBadge
          name={family.label}
          photo={family.photo}
          size={44}
          bg="var(--sage)"
          color="var(--sage-light)"
          icon={<House size={22} color="var(--sage-light)" />}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-[3px]">
            <div className="flex items-center gap-[5px] min-w-0 overflow-hidden">
              <span className="text-15 font-semibold text-text-primary truncate shrink">
                {family.label}
              </span>
            </div>
            <LogStatusTag daysSince={daysSinceNote} lastNoteTs={lastNoteTs} />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              {members.every((m) => m.assignedShepherdIds.length === 0) && (
                <>
                  <StatusBadge
                    label="No shepherd"
                    bg="var(--amber-light)"
                    color="var(--amber)"
                    border="1px solid var(--amber-border)"
                  />
                  <span className="text-12 text-text-muted">·</span>
                </>
              )}
            </span>
            {members.map((m, i) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-[3px] text-12 text-text-muted"
              >
                {i > 0 && <span>,&nbsp;</span>}
                {m.isShepherd && (
                  <HandHeart size={11} color="var(--sage)" className="shrink-0" />
                )}
                {m.preferredName}
              </span>
            ))}
            {family.childCount && family.childCount > 0 ? (
              <span className="text-12 text-text-muted">
                , +{family.childCount} kid{family.childCount !== 1 ? 's' : ''}
              </span>
            ) : null}
            {group &&
              (() => {
                const allGroupIds = [...new Set(members.flatMap((m) => m.groupIds))];
                const extra = allGroupIds.length - 1;
                return (
                  <>
                    <span className="text-12 text-text-muted">·</span>
                    <span className="text-10 py-0.5 px-[7px] rounded-pill bg-blue-light text-blue font-semibold shrink-0">
                      {group.name}
                    </span>
                    {extra > 0 && (
                      <span className="text-10 py-0.5 px-1.5 rounded-pill bg-blue-light text-blue font-semibold shrink-0">
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
