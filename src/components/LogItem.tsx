'use client';

import React from 'react';
import {
  CheckCircle,
  HandsPraying,
  CalendarBlank,
  NotePencil,
  House,
  User,
} from '@phosphor-icons/react';
import { type Note } from '@/lib/types';
import { getTimeAgo, getNoteTypeLabel } from '@/lib/utils';

export function LogItem({
  note,
  onClick,
  creatorName,
  targetChips,
}: {
  note: Note;
  onClick: () => void;
  creatorName?: string;
  targetChips?: { label: string; isFamily: boolean }[];
}) {
  return (
    <button
      className="row-card-hover"
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        paddingTop: 10,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'nowrap',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--sage-light)',
              color: 'var(--sage)',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {note.type === 'check-in' && <CheckCircle size={11} weight="bold" />}
            {note.type === 'prayer-request' && <HandsPraying size={11} weight="bold" />}
            {note.type === 'event' && <CalendarBlank size={11} weight="bold" />}
            {note.type === 'general' && <NotePencil size={11} weight="bold" />}
            {getNoteTypeLabel(note.type)}
          </span>
          {targetChips && targetChips.length > 0 && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--blue)',
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--blue-light)',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
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
              style={{
                fontSize: 10,
                color: 'var(--blue)',
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--blue-light)',
                flexShrink: 0,
              }}
            >
              +{targetChips.length - 1}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
          {getTimeAgo(note.createdAt)}
        </span>
      </div>
      {note.content && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {note.content}
        </p>
      )}
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        by {creatorName ?? 'Unknown'}
      </p>
    </button>
  );
}
