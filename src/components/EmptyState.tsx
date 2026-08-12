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
    <div className="text-center" style={{ padding }}>
      {icon && <div className="mb-2">{icon}</div>}
      <p className={`text-14 text-text-secondary font-semibold ${description ? 'mb-1.5' : 'mb-0'}`}>
        {title}
      </p>
      {description && (
        <p className="text-13 text-text-muted mx-auto leading-loose" style={{ maxWidth: 260 }}>
          {description}
        </p>
      )}
      {subtext && (
        <p
          className="text-12 text-text-muted mx-auto leading-normal font-semibold"
          style={{ maxWidth: 260, marginTop: '0.625rem' }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
