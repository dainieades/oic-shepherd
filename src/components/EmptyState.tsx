'use client';

import React from 'react';

export function EmptyState({
  title,
  description,
  subtext,
  icon,
  padding = '32px 20px',
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
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: description ? 6 : 0,
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
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
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            maxWidth: 260,
            margin: '10px auto 0',
            fontWeight: 600,
          }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
