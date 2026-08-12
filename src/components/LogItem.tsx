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
      className="row-card-hover border-border-light cursor-pointer border-b border-none py-2.5 text-left"
      onClick={onClick}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
          <span
            className="text-10 rounded-pill bg-sage-light text-sage inline-flex shrink-0 items-center gap-1 font-semibold"
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
              className="text-10 text-blue rounded-pill bg-blue-light inline-flex shrink-0 items-center gap-[0.1875rem] font-medium"
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
              className="text-10 text-blue rounded-pill bg-blue-light shrink-0 font-medium"
              style={{ padding: '0.0625rem 0.375rem' }}
            >
              +{targetChips.length - 1}
            </span>
          )}
        </div>
        <span className="text-11 text-text-muted ml-2 shrink-0">{getTimeAgo(note.createdAt)}</span>
      </div>
      {note.content && (
        <p
          className="text-13 text-text-primary mb-1 overflow-hidden leading-normal text-ellipsis"
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
        <p className="text-11 text-text-muted mb-0.5 inline-flex max-w-full items-center gap-1 overflow-hidden">
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
