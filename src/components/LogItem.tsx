'use client';

import React from 'react';
import {
  CheckCircle,
  HandsPraying,
  CalendarBlank,
  NotePencil,
  House,
  User,
  ListChecks,
} from '@phosphor-icons/react';
import { type Note } from '@/lib/types';
import { getTimeAgo, getNoteTypeLabel } from '@/lib/utils';

export function LogItem({
  note,
  onClick,
  creatorName,
  targetChips,
  linkedTodoTitle,
}: {
  note: Note;
  onClick: () => void;
  creatorName?: string;
  targetChips?: { label: string; isFamily: boolean }[];
  linkedTodoTitle?: string;
}) {
  return (
    <button
      className="row-card-hover text-left cursor-pointer border-none py-2.5 border-b border-border-light"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 flex-nowrap flex-1 min-w-0 overflow-hidden">
          <span
            className="text-10 font-semibold rounded-pill bg-sage-light text-sage shrink-0 inline-flex items-center gap-1"
            style={{ padding: '0.125rem 0.4375rem' }}
          >
            {note.type === 'check-in' && <CheckCircle size={11} weight="bold" />}
            {note.type === 'prayer-request' && <HandsPraying size={11} weight="bold" />}
            {note.type === 'event' && <CalendarBlank size={11} weight="bold" />}
            {note.type === 'general' && <NotePencil size={11} weight="bold" />}
            {getNoteTypeLabel(note.type)}
          </span>
          {targetChips && targetChips.length > 0 && (
            <span
              className="text-10 text-blue font-medium rounded-pill bg-blue-light shrink-0 inline-flex items-center gap-[0.1875rem]"
              style={{ padding: '0.0625rem 0.375rem' }}
            >
              {targetChips[0].isFamily ? (
                <House size={10} weight="bold" />
              ) : (
                <User size={10} weight="bold" />
              )}
              {targetChips[0].label}
            </span>
          )}
          {targetChips && targetChips.length > 1 && (
            <span
              className="text-10 text-blue font-medium rounded-pill bg-blue-light shrink-0"
              style={{ padding: '0.0625rem 0.375rem' }}
            >
              +{targetChips.length - 1}
            </span>
          )}
        </div>
        <span className="text-11 text-text-muted shrink-0 ml-2">
          {getTimeAgo(note.createdAt)}
        </span>
      </div>
      {note.content && (
        <p
          className="text-13 text-text-primary leading-normal mb-1 overflow-hidden text-ellipsis"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {note.content}
        </p>
      )}
      {linkedTodoTitle && (
        <p className="text-11 text-text-muted inline-flex items-center gap-1 mb-0.5 max-w-full overflow-hidden">
          <ListChecks size={11} weight="bold" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            From to-do: {linkedTodoTitle}
          </span>
        </p>
      )}
      <p className="text-11 text-text-muted">by {creatorName ?? 'Unknown'}</p>
    </button>
  );
}
