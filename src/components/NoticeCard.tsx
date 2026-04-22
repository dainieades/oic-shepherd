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
  'pastor-only': 'Pastor only',
  'pastor-and-shepherds': 'Shepherds & pastor',
  everyone: 'Everyone',
};

export function NoticeCard({
  notice,
  onClick,
}: {
  notice: Notice;
  onClick: () => void;
}) {
  const style = URGENCY_STYLE[notice.urgency as NoticeUrgency];
  return (
    <button
      onClick={onClick}
      className="row-card-hover"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        background: style.bg,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            background: style.pillBg,
            color: style.color,
            letterSpacing: '0.03em',
          }}
        >
          {URGENCY_LABEL[notice.urgency]}
        </span>
        {notice.categories.map((cat) => (
          <span
            key={cat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
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
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {notice.content}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Eye size={11} />
        {PRIVACY_LABEL[notice.privacy] ?? notice.privacy}
      </p>
    </button>
  );
}
