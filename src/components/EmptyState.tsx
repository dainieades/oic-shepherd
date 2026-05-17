'use client';

import React from 'react';

export function EmptyState({
  title,
  description,
  subtext,
  icon,
  padding = '2rem 1.25rem',
}: {
  title: string;
  description?: string;
  subtext?: string;
  icon?: React.ReactNode;
  padding?: string;
}) {
  return (
    <div style={{ textAlign: 'center', padding }}>
      {icon && <div style={{ marginBottom: 8 }}>{icon}</div>}
      <p
        style={{
          fontSize: 'var(--text-14)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-secondary)',
          marginBottom: description ? 6 : 0,
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 'var(--text-13)',
            color: 'var(--text-muted)',
            lineHeight: 'var(--leading-loose)',
            maxWidth: 260,
            margin: '0 auto',
          }}
        >
          {description}
        </p>
      )}
      {subtext && (
        <p
          style={{
            fontSize: 'var(--text-12)',
            color: 'var(--text-muted)',
            lineHeight: 'var(--leading-normal)',
            maxWidth: 260,
            margin: '0.625rem auto 0',
            fontWeight: 'var(--font-semibold)',
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
