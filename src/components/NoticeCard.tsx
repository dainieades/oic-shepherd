'use client';

import React from 'react';
import { FirstAid, HandsPraying, UsersThree, Brain, DotsThree, Eye } from '@phosphor-icons/react';
import { type Notice, type NoticeUrgency } from '@/lib/types';
import { URGENCY_STYLE } from '@/components/AddNoticeModal';

export const URGENCY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  moderate: 'Moderate',
  ongoing: 'Ongoing',
};

export const CATEGORY_LABEL: Record<string, string> = {
  'physical-need': 'Physical Need',
  'spiritual-need': 'Spiritual Need',
  'social-need': 'Social Need',
  'psychological-need': 'Psychological Need',
  other: 'Other',
};

export const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  'physical-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'spiritual-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'social-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'psychological-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  other: { bg: 'var(--sage-light)', color: 'var(--sage)' },
};

export const CATEGORY_ICON: Record<string, React.ReactNode> = {
  'physical-need': <FirstAid size={11} />,
  'spiritual-need': <HandsPraying size={11} />,
  'social-need': <UsersThree size={11} />,
  'psychological-need': <Brain size={11} />,
  other: <DotsThree size={11} />,
};

export const PRIVACY_LABEL: Record<string, string> = {
  'pastor-only': 'Admin and You',
  'pastor-and-shepherds': 'Admin and Shepherds',
  everyone: 'Everyone',
};

export function NoticeCard({ notice, onClick }: { notice: Notice; onClick: () => void }) {
  const style = URGENCY_STYLE[notice.urgency as NoticeUrgency];
  return (
    <button
      onClick={onClick}
      className="row-card-hover border-border-light flex w-full cursor-pointer flex-col gap-1.5 rounded-md border px-3.5 py-3 text-left"
      style={{ background: style.bg }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="text-11 rounded-pill tracking-wide-3 px-2 py-0.5 font-bold"
          style={{ background: style.pillBg, color: style.color }}
        >
          {URGENCY_LABEL[notice.urgency]}
        </span>
        {notice.categories.map((cat) => (
          <span
            key={cat}
            className="text-11 rounded-pill flex items-center gap-0.75 px-2 py-0.5 font-medium"
            style={{
              background: CATEGORY_STYLE[cat]?.bg,
              color: CATEGORY_STYLE[cat]?.color,
            }}
          >
            {CATEGORY_ICON[cat]}
            {CATEGORY_LABEL[cat]}
          </span>
        ))}
      </div>
      <p
        className="text-14 text-text-primary m-0 overflow-hidden leading-normal"
        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
      >
        {notice.content}
      </p>
      <p className="text-11 text-text-muted m-0 flex items-center gap-1">
        <Eye size={11} />
        {PRIVACY_LABEL[notice.privacy] ?? notice.privacy}
      </p>
    </button>
  );
}
